/**
 * Input validation and sanitization utilities
 * Protects against XSS, injection attacks, and invalid data
 */

// Maximum length limits for inputs
export const MAX_LENGTHS = {
	name: 100,
	websiteUrl: 500,
	founderUsername: 50,
	projectId: 100,
	appStoreId: 50,
	revenuecatApiKey: 500,
} as const;

// Minimum length limits
export const MIN_LENGTHS = {
	name: 1,
	projectId: 4,
	revenuecatApiKey: 10,
} as const;

/**
 * Sanitize string input by removing potentially dangerous characters
 * Prevents XSS attacks by removing HTML/script tags
 */
export function sanitizeString(input: string): string {
	if (typeof input !== 'string') {
		return '';
	}

	return input
		// Remove null bytes
		.replace(/\0/g, '')
		// Remove control characters except newlines and tabs
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
		// Remove HTML tags
		.replace(/<[^>]*>/g, '')
		// Remove potential script injection patterns
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
		// Normalize whitespace
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Validate and sanitize app name
 */
export function validateName(name: unknown): { valid: boolean; value: string; error?: string } {
	if (typeof name !== 'string') {
		return { valid: false, value: '', error: 'Name must be a string' };
	}

	const sanitized = sanitizeString(name);

	if (sanitized.length < MIN_LENGTHS.name) {
		return { valid: false, value: sanitized, error: 'Name is required' };
	}

	if (sanitized.length > MAX_LENGTHS.name) {
		return { valid: false, value: sanitized, error: `Name must be ${MAX_LENGTHS.name} characters or less` };
	}

	// Check for suspicious patterns
	if (/[<>{}[\]\\]/.test(sanitized)) {
		return { valid: false, value: sanitized, error: 'Name contains invalid characters' };
	}

	return { valid: true, value: sanitized };
}

/**
 * Validate URL format and domain
 */
export function validateUrl(url: unknown): { valid: boolean; value: string; error?: string } {
	if (!url || typeof url !== 'string') {
		return { valid: false, value: '', error: 'URL must be a string' };
	}

	const sanitized = sanitizeString(url);

	if (sanitized.length > MAX_LENGTHS.websiteUrl) {
		return { valid: false, value: sanitized, error: `URL must be ${MAX_LENGTHS.websiteUrl} characters or less` };
	}

	// Check if it's a valid URL
	try {
		const urlObj = new URL(sanitized);
		
		// Only allow http and https protocols
		if (!['http:', 'https:'].includes(urlObj.protocol)) {
			return { valid: false, value: sanitized, error: 'URL must use http or https protocol' };
		}

		// Reject localhost, private IPs, and suspicious domains
		const hostname = urlObj.hostname.toLowerCase();
		if (
			hostname === 'localhost' ||
			hostname.startsWith('127.') ||
			hostname.startsWith('192.168.') ||
			hostname.startsWith('10.') ||
			hostname.startsWith('172.16.') ||
			hostname === '0.0.0.0' ||
			hostname === '::1'
		) {
			return { valid: false, value: sanitized, error: 'URL cannot point to private/local addresses' };
		}

		return { valid: true, value: sanitized };
	} catch {
		return { valid: false, value: sanitized, error: 'Invalid URL format' };
	}
}

/**
 * Validate Twitter/X username
 */
export function validateUsername(username: unknown): { valid: boolean; value: string; error?: string } {
	if (!username || typeof username !== 'string') {
		return { valid: true, value: '' }; // Username is optional
	}

	let sanitized = sanitizeString(username).replace(/^@/, ''); // Remove @ if present

	if (sanitized.length > MAX_LENGTHS.founderUsername) {
		return { valid: false, value: sanitized, error: `Username must be ${MAX_LENGTHS.founderUsername} characters or less` };
	}

	// Twitter usernames can only contain letters, numbers, and underscores
	if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
		return { valid: false, value: sanitized, error: 'Username can only contain letters, numbers, and underscores' };
	}

	return { valid: true, value: sanitized };
}

/**
 * Validate App Store ID
 */
export function validateAppStoreId(appStoreId: unknown): { valid: boolean; value: string; error?: string } {
	if (!appStoreId || typeof appStoreId !== 'string') {
		return { valid: true, value: '' }; // Optional field
	}

	const sanitized = sanitizeString(appStoreId);

	if (sanitized.length > MAX_LENGTHS.appStoreId) {
		return { valid: false, value: sanitized, error: `App Store ID must be ${MAX_LENGTHS.appStoreId} characters or less` };
	}

	// App Store IDs are numeric
	if (!/^\d+$/.test(sanitized)) {
		return { valid: false, value: sanitized, error: 'App Store ID must contain only numbers' };
	}

	return { valid: true, value: sanitized };
}

/**
 * Validate RevenueCat Project ID
 */
export function validateProjectId(projectId: unknown): { valid: boolean; value: string; error?: string } {
	if (typeof projectId !== 'string') {
		return { valid: false, value: '', error: 'Project ID must be a string' };
	}

	const sanitized = sanitizeString(projectId);

	if (sanitized.length < MIN_LENGTHS.projectId) {
		return { valid: false, value: sanitized, error: `Project ID must be at least ${MIN_LENGTHS.projectId} characters` };
	}

	if (sanitized.length > MAX_LENGTHS.projectId) {
		return { valid: false, value: sanitized, error: `Project ID must be ${MAX_LENGTHS.projectId} characters or less` };
	}

	// Project IDs should be alphanumeric with possible hyphens/underscores
	if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
		return { valid: false, value: sanitized, error: 'Project ID contains invalid characters' };
	}

	return { valid: true, value: sanitized };
}

/**
 * Validate RevenueCat API Key format
 */
export function validateApiKey(apiKey: unknown): { valid: boolean; value: string; error?: string } {
	if (typeof apiKey !== 'string') {
		return { valid: false, value: '', error: 'API key must be a string' };
	}

	const trimmed = apiKey.trim();

	if (trimmed.length < MIN_LENGTHS.revenuecatApiKey) {
		return { valid: false, value: trimmed, error: 'API key is too short' };
	}

	if (trimmed.length > MAX_LENGTHS.revenuecatApiKey) {
		return { valid: false, value: trimmed, error: 'API key is too long' };
	}

	// RevenueCat API keys typically start with "sk_" (secret key)
	if (!trimmed.startsWith('sk_')) {
		return { valid: false, value: trimmed, error: 'Invalid API key format (must start with sk_)' };
	}

	// Check for suspicious characters (should be alphanumeric + underscores)
	if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
		return { valid: false, value: trimmed, error: 'API key contains invalid characters' };
	}

	return { valid: true, value: trimmed };
}

