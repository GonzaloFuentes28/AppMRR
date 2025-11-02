import type { APIRoute } from 'astro';
import { getStartupsWithApiKeys, upsertRevenueMetrics, deleteStartup } from '../../../lib/db';
import { decryptApiKey } from '../../../lib/encryption';
import { fetchRevenueCatMetrics } from '../../../lib/revenuecat';

/**
 * Cron job endpoint to update metrics for all startups daily
 * 
 * This endpoint should be called by Vercel Cron Jobs.
 * It fetches the latest metrics from RevenueCat for each startup
 * and updates the database.
 * 
 * Note: Vercel Hobby plan limits cron jobs to once per day.
 * Schedule: Runs daily at midnight UTC (0 0 * * *)
 */
export const GET: APIRoute = async ({ request }) => {
	// Secure the endpoint - only allow Vercel Cron Jobs
	const authHeader = request.headers.get('authorization');
	const cronSecret = (import.meta as any).env?.CRON_SECRET || process.env.CRON_SECRET;
	
	// Require CRON_SECRET to be set in production
	if (!cronSecret) {
		console.error('CRON_SECRET is not set in environment variables');
		return new Response('Unauthorized', { status: 401 });
	}
	
	// Verify the Authorization header matches CRON_SECRET
	// Vercel Cron Jobs automatically include this header
	if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		// Get all startups with their encrypted API keys
		const startupsWithKeys = await getStartupsWithApiKeys();
		
		if (startupsWithKeys.length === 0) {
			return new Response(
				JSON.stringify({ message: 'No startups to update', updated: 0 }),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const results = {
			success: 0,
			failed: 0,
			deleted: 0,
			errors: [] as Array<{ startup_id: number; error: string }>,
		};

		// Process each startup
		for (const { startup_id, encrypted_api_key, project_id } of startupsWithKeys) {
			try {
				// Skip if project_id is missing
				if (!project_id) {
					results.failed++;
					results.errors.push({
						startup_id,
						error: 'Project ID is missing',
					});
					continue;
				}
				
				// Decrypt the API key
				const apiKey = decryptApiKey(encrypted_api_key);
				
				// Fetch latest metrics from RevenueCat
				const metrics = await fetchRevenueCatMetrics(apiKey, project_id);
				
				// Update the database
				await upsertRevenueMetrics(startup_id, metrics.revenue, metrics.mrr);
				
				results.success++;
			} catch (error) {
				// Check if error is "Invalid API key" (401 Unauthorized)
				if (error instanceof Error && error.name === 'InvalidApiKeyError') {
					console.log(`Invalid API key detected for startup ${startup_id}. Deleting startup...`);
					try {
						await deleteStartup(startup_id);
						results.deleted++;
						console.log(`Successfully deleted startup ${startup_id} due to invalid API key`);
					} catch (deleteError) {
						results.failed++;
						results.errors.push({
							startup_id,
							error: `Failed to delete startup: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`,
						});
						console.error(`Failed to delete startup ${startup_id}:`, deleteError);
					}
				} else {
					results.failed++;
					results.errors.push({
						startup_id,
						error: error instanceof Error ? error.message : 'Unknown error',
					});
					console.error(`Failed to update metrics for startup ${startup_id}:`, error);
				}
			}
		}

		return new Response(
			JSON.stringify({
				message: 'Metrics update completed',
				...results,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Cron job error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to update metrics',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

