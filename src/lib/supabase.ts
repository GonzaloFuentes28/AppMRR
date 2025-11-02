import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
// Support both import.meta.env (Astro) and process.env (Node.js/SSR)
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;

// Prefer Secret API key for server-side operations (bypasses RLS)
// This works with both legacy service_role keys and new Secret API keys
// Fall back to anon/publishable key if Secret key is not available
const supabaseKey = 
	import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 
	process.env.SUPABASE_SERVICE_ROLE_KEY ||
	import.meta.env.SUPABASE_KEY || 
	process.env.SUPABASE_ANON_KEY || 
	process.env.SUPABASE_KEY;

if (!supabaseUrl) {
	throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseKey) {
	throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY environment variable');
}

// Log which key type is being used (for debugging)
const isServiceRole = 
	!!(import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
if (!isServiceRole) {
	console.warn('⚠️  Using anon/publishable key - RLS policies must be configured. Consider using SUPABASE_SERVICE_ROLE_KEY (Secret API key) for server-side operations.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

