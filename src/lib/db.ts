import { supabase } from './supabase';

export interface Startup {
	id: number;
	name: string;
	website_url: string | null;
	founder_username: string | null;
    app_store_id: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface RevenueMetrics {
	id: number;
	startup_id: number;
	total_revenue: number;
	mrr: number;
	last_updated: Date;
}

export interface ApiKey {
	id: number;
	startup_id: number;
	revenuecat_api_key: string; // Encrypted
	revenuecat_project_id: string | null;
	created_at: Date;
}

export interface StartupWithMetrics extends Startup {
	total_revenue: number;
	mrr: number;
	last_updated: Date | null;
}

/**
 * Check whether a RevenueCat project ID is already associated with another startup
 */
export async function isProjectIdTaken(projectId: string): Promise<boolean> {
	if (!projectId) {
		return false;
	}

	const normalized = projectId.trim();
	if (!normalized) {
		return false;
	}

	const { count, error } = await supabase
		.from('api_keys')
		.select('id', { count: 'exact', head: true })
		.eq('revenuecat_project_id', normalized)
		.limit(1);

	if (error) {
		throw new Error(`Failed to validate project ID uniqueness: ${error.message}`);
	}

	return (count ?? 0) > 0;
}

/**
 * Create a new startup
 */
export async function createStartup(
    name: string,
    websiteUrl: string | null,
    founderUsername: string | null,
    appStoreId: string | null
): Promise<Startup> {
	const { data, error } = await supabase
		.from('startups')
		.insert({
			name,
			website_url: websiteUrl,
			founder_username: founderUsername,
            app_store_id: appStoreId,
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create startup: ${error.message}`);
	}

	return data as Startup;
}

/**
 * Get all startups with their revenue metrics, sorted by total revenue
 */
export async function getStartupsWithMetrics(
	sortBy: 'revenue' | 'mrr' = 'revenue'
): Promise<StartupWithMetrics[]> {
	// Fetch startups and revenue_metrics separately for reliability
	// This ensures we always get the latest data
	const [startupsResult, metricsResult] = await Promise.all([
		supabase
			.from('startups')
			.select('*')
			.order('id', { ascending: true }),
		supabase
			.from('revenue_metrics')
			.select('startup_id, total_revenue, mrr, last_updated')
	]);

	if (startupsResult.error) {
		throw new Error(`Failed to fetch startups: ${startupsResult.error.message}`);
	}

	if (metricsResult.error) {
		throw new Error(`Failed to fetch revenue metrics: ${metricsResult.error.message}`);
	}

	// Create a map of startup_id -> metrics for quick lookup
	const metricsMap = new Map(
		(metricsResult.data || []).map((metric: any) => [
			metric.startup_id,
			{
				total_revenue: typeof metric.total_revenue === 'number' 
					? metric.total_revenue 
					: parseFloat(metric.total_revenue || '0'),
				mrr: typeof metric.mrr === 'number' 
					? metric.mrr 
					: parseFloat(metric.mrr || '0'),
				last_updated: metric.last_updated ? new Date(metric.last_updated) : null,
			}
		])
	);

	// Transform the data to match the expected format
	const startups: StartupWithMetrics[] = (startupsResult.data || []).map((startup: any) => {
		const metrics = metricsMap.get(startup.id);
		return {
			id: startup.id,
			name: startup.name,
			website_url: startup.website_url,
			founder_username: startup.founder_username,
            app_store_id: startup.app_store_id ?? null,
			created_at: new Date(startup.created_at),
			updated_at: new Date(startup.updated_at),
			total_revenue: metrics?.total_revenue || 0,
			mrr: metrics?.mrr || 0,
			last_updated: metrics?.last_updated || null,
		};
	});

	// Sort by revenue or MRR
	if (sortBy === 'mrr') {
		startups.sort((a, b) => b.mrr - a.mrr);
	} else {
		startups.sort((a, b) => b.total_revenue - a.total_revenue);
	}

	return startups;
}

/**
 * Get a startup by ID
 */
export async function getStartupById(id: number): Promise<Startup | null> {
	const { data, error } = await supabase
		.from('startups')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No rows returned
			return null;
		}
		throw new Error(`Failed to fetch startup: ${error.message}`);
	}

	return data as Startup;
}

/**
 * Store or update encrypted API key for a startup
 */
export async function upsertApiKey(
	startupId: number,
	encryptedApiKey: string,
	projectId?: string | null
): Promise<void> {
	const { error } = await supabase
		.from('api_keys')
		.upsert(
			{
				startup_id: startupId,
				revenuecat_api_key: encryptedApiKey,
				revenuecat_project_id: projectId || null,
			},
			{
				onConflict: 'startup_id',
			}
		);

	if (error) {
		throw new Error(`Failed to upsert API key: ${error.message}`);
	}
}

/**
 * Get encrypted API key for a startup
 */
export async function getApiKey(startupId: number): Promise<string | null> {
	const { data, error } = await supabase
		.from('api_keys')
		.select('revenuecat_api_key')
		.eq('startup_id', startupId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No rows returned
			return null;
		}
		throw new Error(`Failed to fetch API key: ${error.message}`);
	}

	return data?.revenuecat_api_key || null;
}

/**
 * Get all startups with their API keys for cron job
 */
export async function getStartupsWithApiKeys(): Promise<
	Array<{ startup_id: number; encrypted_api_key: string; project_id: string | null }>
> {
	const { data, error } = await supabase
		.from('api_keys')
		.select('startup_id, revenuecat_api_key, revenuecat_project_id');

	if (error) {
		throw new Error(`Failed to fetch API keys: ${error.message}`);
	}

	return (data || []).map((row) => ({
		startup_id: row.startup_id,
		encrypted_api_key: row.revenuecat_api_key,
		project_id: row.revenuecat_project_id,
	}));
}

/**
 * Update or insert revenue metrics for a startup
 */
export async function upsertRevenueMetrics(
	startupId: number,
	totalRevenue: number,
	mrr: number
): Promise<void> {
	const { data, error } = await supabase
		.from('revenue_metrics')
		.upsert(
			{
				startup_id: startupId,
				total_revenue: totalRevenue,
				mrr: mrr,
				last_updated: new Date().toISOString(),
			},
			{
				onConflict: 'startup_id',
			}
		)
		.select();

	if (error) {
		console.error('Error upserting revenue metrics:', error);
		throw new Error(`Failed to upsert revenue metrics: ${error.message}`);
	}

	// Log successful update for debugging
	if (data && data.length > 0) {
		console.log(`Updated metrics for startup ${startupId}:`, {
			total_revenue: data[0].total_revenue,
			mrr: data[0].mrr,
			last_updated: data[0].last_updated,
		});
	}
}

/**
 * Delete a startup and all related data (cascade will handle api_keys and revenue_metrics)
 */
export async function deleteStartup(startupId: number): Promise<void> {
	const { error } = await supabase
		.from('startups')
		.delete()
		.eq('id', startupId);

	if (error) {
		throw new Error(`Failed to delete startup: ${error.message}`);
	}
}

