export interface RevenueCatMetric {
	id: string;
	name: string;
	value: number;
	unit: string;
	period: string;
	description: string;
	object: string;
	last_updated_at: string | null;
	last_updated_at_iso8601: string | null;
}

export interface RevenueCatOverviewMetrics {
	object: string;
	metrics: RevenueCatMetric[];
}

export interface ParsedMetrics {
	mrr: number;
	revenue: number;
}

/**
 * Extract project ID from RevenueCat API key
 * RevenueCat API keys are in format: "sk_xxx" where xxx is the project identifier
 * But for API v2, we need the project_id from the key or separate configuration
 */
function extractProjectIdFromApiKey(apiKey: string): string | null {
	// RevenueCat API keys format: sk_live_xxxxx or sk_test_xxxxx
	// The project ID might need to be provided separately or extracted differently
	// For now, we'll need the project_id to be provided
	// This is a placeholder - actual implementation depends on RevenueCat API structure
	return null;
}

/**
 * Fetch overview metrics from RevenueCat API v2
 * 
 * @param apiKey - RevenueCat read-only API key
 * @param projectId - RevenueCat project ID (required)
 * @returns Parsed metrics with MRR and revenue
 */
export async function fetchRevenueCatMetrics(
	apiKey: string,
	projectId: string
): Promise<ParsedMetrics> {
	if (!projectId) {
		throw new Error('Project ID is required');
	}
	
	const baseUrl = 'https://api.revenuecat.com/v2';
	const url = `${baseUrl}/projects/${projectId}/metrics/overview`;
	
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		let errorBody: any;
		
		// Try to parse error body as JSON to check for "Invalid API key" message
		try {
			errorBody = JSON.parse(errorText);
		} catch {
			// If not JSON, use the text as is
			errorBody = { message: errorText };
		}
		
		// Check for 401 Unauthorized with "Invalid API key" message
		// The message might be in different fields: message, error, etc.
		const errorMessage = errorBody.message || errorBody.error || errorText;
		if (response.status === 401 && 
		    (errorMessage === 'Invalid API key.' || errorMessage.includes('Invalid API key'))) {
			const error = new Error('Invalid API key');
			error.name = 'InvalidApiKeyError';
			throw error;
		}
		
		throw new Error(
			`RevenueCat API error: ${response.status} ${response.statusText}. ${errorText}`
		);
	}
	
	const data: RevenueCatOverviewMetrics = await response.json();
	
	// Parse metrics to extract MRR and revenue
	const mrrMetric = data.metrics.find((m) => m.id === 'mrr');
	const revenueMetric = data.metrics.find((m) => m.id === 'revenue');
	
	return {
		mrr: mrrMetric?.value || 0,
		revenue: revenueMetric?.value || 0,
	};
}

/**
 * Validate RevenueCat API key by attempting to fetch metrics
 */
export async function validateRevenueCatApiKey(
	apiKey: string,
	projectId: string
): Promise<boolean> {
	try {
		await fetchRevenueCatMetrics(apiKey, projectId);
		return true;
	} catch (error) {
		console.error('RevenueCat API key validation failed:', error);
		return false;
	}
}

