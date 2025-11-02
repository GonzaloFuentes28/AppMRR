import type { APIRoute } from 'astro';
import { createStartup, isProjectIdTaken, upsertApiKey, upsertRevenueMetrics } from '../../lib/db';
import { encryptApiKey } from '../../lib/encryption';
import { fetchRevenueCatMetrics, validateRevenueCatApiKey } from '../../lib/revenuecat';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../../lib/rate-limit';
import {
	validateName,
	validateUrl,
	validateUsername,
	validateAppStoreId,
	validateProjectId,
	validateApiKey,
} from '../../lib/validation';

export const POST: APIRoute = async ({ request }) => {
	try {
		// ==========================================
		// STEP 1: RATE LIMITING
		// ==========================================
		// Prevent spam and abuse by limiting requests per IP
		const clientId = getClientIdentifier(request);
		const rateLimit = checkRateLimit(clientId, {
			max: 3, // 3 requests per window
			windowMs: 60 * 60 * 1000, // 1 hour
		});

		if (!rateLimit.allowed) {
			console.warn(`Rate limit exceeded for ${clientId}`);
			return createRateLimitResponse(rateLimit);
		}

		// ==========================================
		// STEP 2: PARSE AND SANITIZE INPUT
		// ==========================================
		const body = await request.json();
		const { name, websiteUrl, appStoreId, founderUsername, revenuecatApiKey, projectId } = body;

		// ==========================================
		// STEP 3: VALIDATE ALL INPUTS
		// ==========================================
		
		// Validate app name (required)
		const nameValidation = validateName(name);
		if (!nameValidation.valid) {
			return new Response(
				JSON.stringify({ error: nameValidation.error }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Validate project ID (required)
		const projectIdValidation = validateProjectId(projectId);
		if (!projectIdValidation.valid) {
			return new Response(
				JSON.stringify({ error: projectIdValidation.error }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Validate RevenueCat API key (required)
		const apiKeyValidation = validateApiKey(revenuecatApiKey);
		if (!apiKeyValidation.valid) {
			return new Response(
				JSON.stringify({ error: apiKeyValidation.error }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Validate website URL (optional)
		let validatedWebsiteUrl: string | null = null;
		if (websiteUrl) {
			const urlValidation = validateUrl(websiteUrl);
			if (!urlValidation.valid) {
				return new Response(
					JSON.stringify({ error: `Website: ${urlValidation.error}` }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}
			validatedWebsiteUrl = urlValidation.value;
		}

		// Validate App Store ID (optional)
		let validatedAppStoreId: string | null = null;
		if (appStoreId) {
			const appStoreIdValidation = validateAppStoreId(appStoreId);
			if (!appStoreIdValidation.valid) {
				return new Response(
					JSON.stringify({ error: `App Store ID: ${appStoreIdValidation.error}` }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}
			validatedAppStoreId = appStoreIdValidation.value;
		}

		// Validate founder username (optional)
		let validatedUsername: string | null = null;
		if (founderUsername) {
			const usernameValidation = validateUsername(founderUsername);
			if (!usernameValidation.valid) {
				return new Response(
					JSON.stringify({ error: `Twitter username: ${usernameValidation.error}` }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}
			validatedUsername = usernameValidation.value;
		}

		// At least one of appStoreId or websiteUrl is required (to get the icon)
		if (!validatedAppStoreId && !validatedWebsiteUrl) {
			return new Response(
				JSON.stringify({ error: 'Either App Store ID or Website is required (at least one to fetch the app icon)' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// ==========================================
		// STEP 4: BUSINESS LOGIC VALIDATION
		// ==========================================
		
		// Ensure the project ID is not already registered
		if (await isProjectIdTaken(projectIdValidation.value)) {
			return new Response(
				JSON.stringify({ error: 'This RevenueCat project ID is already registered.' }),
				{ status: 409, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Validate API key by attempting to fetch metrics
		const isValid = await validateRevenueCatApiKey(apiKeyValidation.value, projectIdValidation.value);
		if (!isValid) {
			return new Response(
				JSON.stringify({ error: 'Invalid RevenueCat API key or Project ID. Please check your credentials.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// ==========================================
		// STEP 5: FETCH DATA AND CREATE RECORDS
		// ==========================================
		
		// Fetch initial metrics
		const metrics = await fetchRevenueCatMetrics(apiKeyValidation.value, projectIdValidation.value);

		// Create startup with sanitized and validated data
		const startup = await createStartup(
			nameValidation.value,
			validatedWebsiteUrl,
			validatedUsername,
			validatedAppStoreId
		);

		// Encrypt and store API key
		const encryptedApiKey = encryptApiKey(apiKeyValidation.value);
		await upsertApiKey(startup.id, encryptedApiKey, projectIdValidation.value);

		// Store initial revenue metrics
		await upsertRevenueMetrics(startup.id, metrics.revenue, metrics.mrr);

		// ==========================================
		// STEP 6: SUCCESS RESPONSE
		// ==========================================
		return new Response(
			JSON.stringify({
				success: true,
				startup: {
					id: startup.id,
					name: startup.name,
				},
				metrics,
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Error adding startup:', error);
		
		// Don't leak internal error details to client
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const safeMessage = errorMessage.includes('API') 
			? errorMessage 
			: 'Failed to add startup. Please try again.';
		
		return new Response(
			JSON.stringify({
				error: 'Failed to add startup',
				message: safeMessage,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

