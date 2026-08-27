import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	console.warn('⚠️ Warning: DATABASE_URL is not set.')
}

// For serverless / edge / node function connection pooling
const client = postgres(connectionString || '', {
	prepare: false,
	max: 1, // Keep connection count minimal for serverless functions
})

export const db = drizzle(client, { schema })
