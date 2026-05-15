import { z } from 'zod'
import { existsSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { expand as expandEnv } from 'dotenv-expand'

// Aceptar .env o .env.dev para desarrollo
const envFile = existsSync('.env.dev') ? '.env.dev' : '.env'
if (process.env.APP_STAGE === 'dev' || !process.env.APP_STAGE) {
	console.log(`Modo desarrollo. Cargando variables desde ${envFile}`)
	const loaded = loadEnv({ path: envFile, quiet: true })
	expandEnv(loaded)
}

// En producción, las variables de entorno son proporcionadas por Docker

// Usar schema de zod para validar las variables de entorno de forma estricta, evitando
// que la app se ejecute con configuraciones incorrectas o faltantes.
const rateLimitWindowSchema = (defaultVal: string) =>
	z
		.string()
		.default(defaultVal)
		.refine((val) => /^\d+m$/.test(val), {
			message:
				'Debe ser un string con formato: número seguido de "m", por ejemplo "15m"',
		})
		.transform((val) => parseInt(val) * 60 * 1000)
const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']),
	APP_STAGE: z.enum(['dev', 'stage', 'prod']).default('dev'),
	APP_PORT: z.coerce.number().default(8000),
	API_BASE_URL: z.string().startsWith('http'),
	API_VERSION: z.string().regex(new RegExp('^v\\d+$')).default('v1'),
	ADMIN_EMAIL: z.email().min(1),
	ADMIN_PASSWORD: z.string().min(26).max(128),
	RATE_LIMIT_WINDOW: rateLimitWindowSchema('5m'),
	AUTH_RATE_LIMIT_WINDOW: rateLimitWindowSchema('15m'),
	RATE_LIMIT_MAX: z.coerce.number().default(100),
	AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
	POSTGRES_USER: z.string().min(1),
	POSTGRES_PASSWORD: z.string().min(32),
	POSTGRES_DB: z.string().min(1),
	DATABASE_URL: z.string().startsWith('postgres://'),
	BCRYPT_ROUNDS: z.coerce.number().min(10).default(10),
	JWT_SECRET: z.string().min(32),
	JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
	JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),
	JWT_ISSUER: z.string().min(1),
	JWT_AUDIENCE: z.string().min(1),
	FRONTEND_URLS: z
		.string()
		.min(1)
		.transform((val) => val.split(',').map((url) => url.trim()))
		.pipe(z.array(z.string().startsWith('http'))),
	MINIO_ROOT_USER: z.string().min(1),
	MINIO_ROOT_PASSWORD: z.string().min(32),
	MINIO_ENDPOINT: z.string().min(1),
	MINIO_PORT: z.coerce.number().min(1).max(65535),
	MINIO_USE_SSL: z.enum(['true', 'false']).transform((val) => val === 'true'),
	MINIO_BUCKET_NAME: z.string().min(1),
})

// Garantizar que la variable de entorno APP_STAGE esté definida, dev por defecto
const validStageSchema = envSchema
	.pick({ APP_STAGE: true })
	.default({ APP_STAGE: 'dev' })
try {
	validStageSchema.parse({ APP_STAGE: process.env.APP_STAGE })
} catch (e) {
	console.error(
		"APP_STAGE inválido o no definido. Debe ser 'dev', 'stage' o 'prod'.",
	)
	process.exit(1)
}

// Exportar objeto env con variables de entorno validadas y tipadas
export const env = (() => {
	try {
		return envSchema.parse(process.env)
	} catch (e) {
		console.error('Error en variables de entorno:', e)
		process.exit(1)
	}
})()
