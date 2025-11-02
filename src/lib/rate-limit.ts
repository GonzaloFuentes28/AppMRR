/**
 * Simple in-memory rate limiting
 * 
 * IMPORTANT: This is a basic implementation for Vercel serverless functions.
 * For production with multiple instances, consider using:
 * - Vercel KV (Redis): https://vercel.com/docs/storage/vercel-kv
 * - Upstash Redis: https://upstash.com/
 * - Vercel Edge Config: https://vercel.com/docs/storage/edge-config
 * 
 * This implementation works per-instance, so with multiple serverless
 * instances, limits are approximate. Good enough for basic protection.
 */

interface RateLimitRecord {
	count: number;
	resetAt: number;
}

// In-memory store (resets on serverless function cold start)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries periodically (every 1000 requests)
let requestCount = 0;
const CLEANUP_INTERVAL = 1000;

function cleanup() {
	const now = Date.now();
	for (const [key, record] of rateLimitStore.entries()) {
		if (now > record.resetAt) {
			rateLimitStore.delete(key);
		}
	}
}

export interface RateLimitConfig {
	/**
	 * Maximum number of requests allowed in the time window
	 * Default: 5
	 */
	max?: number;
	
	/**
	 * Time window in milliseconds
	 * Default: 60000 (1 minute)
	 */
	windowMs?: number;
}

export interface RateLimitResult {
	/**
	 * Whether the request should be allowed
	 */
	allowed: boolean;
	
	/**
	 * Current request count in the window
	 */
	current: number;
	
	/**
	 * Maximum requests allowed
	 */
	limit: number;
	
	/**
	 * Timestamp when the limit resets (milliseconds)
	 */
	resetAt: number;
	
	/**
	 * Seconds until reset
	 */
	retryAfter: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig = {}
): RateLimitResult {
	const max = config.max ?? 5;
	const windowMs = config.windowMs ?? 60000; // 1 minute default
	
	const now = Date.now();
	const key = identifier;
	
	// Periodic cleanup
	requestCount++;
	if (requestCount % CLEANUP_INTERVAL === 0) {
		cleanup();
	}
	
	// Get or create record
	let record = rateLimitStore.get(key);
	
	if (!record || now > record.resetAt) {
		// Create new record
		record = {
			count: 1,
			resetAt: now + windowMs,
		};
		rateLimitStore.set(key, record);
		
		return {
			allowed: true,
			current: 1,
			limit: max,
			resetAt: record.resetAt,
			retryAfter: 0,
		};
	}
	
	// Increment count
	record.count++;
	
	const allowed = record.count <= max;
	const retryAfter = allowed ? 0 : Math.ceil((record.resetAt - now) / 1000);
	
	return {
		allowed,
		current: record.count,
		limit: max,
		resetAt: record.resetAt,
		retryAfter,
	};
}

/**
 * Get client identifier from request
 * Tries to extract real IP from headers (handles proxies/CDNs)
 */
export function getClientIdentifier(request: Request): string {
	// Try to get real IP from headers
	// Vercel provides x-forwarded-for and x-real-ip
	const headers = request.headers;
	
	const forwardedFor = headers.get('x-forwarded-for');
	if (forwardedFor) {
		// x-forwarded-for can be a comma-separated list
		// First IP is the original client
		return forwardedFor.split(',')[0].trim();
	}
	
	const realIp = headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}
	
	// Fallback to CF-Connecting-IP (Cloudflare)
	const cfIp = headers.get('cf-connecting-ip');
	if (cfIp) {
		return cfIp;
	}
	
	// Last resort: use a generic identifier
	// Not ideal but prevents crashes
	return 'unknown';
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
	return new Response(
		JSON.stringify({
			error: 'Too many requests',
			message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
			retryAfter: result.retryAfter,
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': result.retryAfter.toString(),
				'X-RateLimit-Limit': result.limit.toString(),
				'X-RateLimit-Remaining': Math.max(0, result.limit - result.current).toString(),
				'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
			},
		}
	);
}

