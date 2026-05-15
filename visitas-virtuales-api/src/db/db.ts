import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.ts'
import { env } from '../env.ts'

// Singleton para evitar duplicar pools en hot reload durante desarrollo
const globalForDb = global as unknown as { pool: Pool | undefined }

const pool =
	globalForDb.pool ??
	new Pool({
		connectionString: env.DATABASE_URL,
		max: 4,
	})

if (process.env.NODE_ENV !== 'production') {
	globalForDb.pool = pool
}
const db = drizzle(pool, { schema })

export async function verifyDatabaseConnection() {
	try {
		await pool.query('SELECT 1')
	} catch (error) {
		throw new Error(
			`Error de conexión a la base de datos`,
		)
	}
}

export { db }
