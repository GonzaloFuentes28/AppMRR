// Load environment variables from .env file (for local development)
import 'dotenv/config';
import { Pool } from 'pg';

// Determine the database connection string
// Priority: SUPABASE_DB_URL > DATABASE_URL > POSTGRES_URL > construct from individual vars
let connectionString: string | undefined;

if (process.env.SUPABASE_DB_URL) {
	connectionString = process.env.SUPABASE_DB_URL;
} else if (process.env.DATABASE_URL) {
	connectionString = process.env.DATABASE_URL;
} else if (process.env.POSTGRES_URL) {
	connectionString = process.env.POSTGRES_URL;
} else if (process.env.POSTGRES_HOST) {
	// Construct POSTGRES_URL from individual variables
	const host = process.env.POSTGRES_HOST;
	const port = process.env.POSTGRES_PORT || '5432';
	const database = process.env.POSTGRES_DATABASE || 'appmrr';
	const user = process.env.POSTGRES_USER || 'postgres';
	const password = process.env.POSTGRES_PASSWORD || '';
	connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

if (!connectionString) {
	throw new Error(
		'Database connection string not found. Please set SUPABASE_DB_URL, DATABASE_URL, POSTGRES_URL, or individual POSTGRES_* variables.'
	);
}

// Detect if this is a Supabase connection
const isSupabase = connectionString.includes('supabase.co');

// Initialize PostgreSQL connection pool
// Works with Supabase, local PostgreSQL, or any PostgreSQL-compatible database
const pool = new Pool({
	connectionString,
	// Connection pool settings optimized for Supabase and serverless
	max: isSupabase ? 10 : 20, // Lower max for Supabase pooler
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 10000, // Increased timeout for Supabase (10 seconds)
	ssl: isSupabase || process.env.DATABASE_URL 
		? { rejectUnauthorized: false } // Supabase requires SSL
		: undefined,
});

// Handle pool errors
pool.on('error', (err) => {
	console.error('Unexpected error on idle client', err);
	// Don't exit process - let it handle errors gracefully
	// process.exit(-1);
});

// Test connection on startup
if (isSupabase && connectionString.includes('[YOUR_PASSWORD]')) {
	console.warn('⚠️  Warning: Connection string contains [YOUR_PASSWORD] placeholder. Please replace it with your actual password.');
}

// Helpful error message for common Supabase connection issues
if (isSupabase && !connectionString.includes('pooler')) {
	console.warn('💡 Tip: If you encounter connection errors, try using Supabase Session Pooler connection string (port 6543) instead of direct connection (port 5432).');
}

// Create a sql template tag compatible with the existing API
export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: any[] }> {
	let query = strings[0];
	const params: any[] = [];
	
	for (let i = 0; i < values.length; i++) {
		params.push(values[i]);
		query += `$${params.length}`;
		query += strings[i + 1];
	}
	
	return pool.query(query, params).then((result) => ({
		rows: result.rows,
	}));
}

