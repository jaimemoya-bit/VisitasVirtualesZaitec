import { existsSync } from 'node:fs'
import assert from 'node:assert'
import { config as loadEnv } from 'dotenv'
import { expand as expandEnv } from 'dotenv-expand'
import { defineConfig } from 'drizzle-kit'

const stage = process.env.APP_STAGE

const envFile =
	stage === 'prod'
		? '.env.prod'
		: stage === 'dev' && existsSync('.env.dev')
			? '.env.dev'
			: '.env'

expandEnv(loadEnv({ path: envFile, quiet: true }))

assert(
	process.env.DATABASE_URL,
	`Error: DATABASE_URL no está definido en ${envFile}`,
)

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	dialect: 'postgresql',
	verbose: true,
	strict: true,
})
