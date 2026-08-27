import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	console.error('❌ CRITICAL: DATABASE_URL environment variable is not set!')
}

// Support SSL connections (e.g. Neon, Supabase, Vercel Postgres) with serverless connection pooling
const client = postgres(connectionString || '', {
	prepare: false,
	max: 1, // Keep connection count minimal for serverless functions
	ssl: connectionString?.includes('localhost') ? false : 'require',
	connect_timeout: 10,
})

export const db = drizzle(client, { schema })
