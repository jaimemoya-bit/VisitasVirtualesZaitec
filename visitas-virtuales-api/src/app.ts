import type { Request, Response, RequestHandler } from 'express'
import { env } from './env.ts'
import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import userRoutes from './routes/userRoutes.ts'
import centerRoutes from './routes/centerRoutes.ts'
import poiRoutes from './routes/poiRoutes.ts'
import storageRoutes from './routes/storageRoutes.ts'
import traceabilityRoutes from './routes/traceabilityRoutes.ts'
import errorHandler from './middlewares/errorHandler.ts'
import cors from 'cors'
import helmet from 'helmet'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import rateLimit from 'express-rate-limit'

const app = express()

// Logger para solicitudes HTTP
app.use(morgan('dev') as RequestHandler)

// Middleware para establecer headers de seguridad en las respuestas (permitiendo embedding de imágenes desde React)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// Confiar en el proxy para obtener IP real del cliente
app.set('trust proxy', 1)

// Middleware para rate limiting (100 solicitudes cada 15 minutos por IP por defecto)
const limiter = rateLimit({
	windowMs: env.RATE_LIMIT_WINDOW,
	max: env.RATE_LIMIT_MAX,
	message: {
		error: 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.',
		// Tiempo en minutos para el header Retry-After
		retryAfter: env.RATE_LIMIT_WINDOW / 60000,
	},
	// Enviar información de rate limit en headers
	standardHeaders: true,
	// No enviar headers obsoletos
	legacyHeaders: false,
})

app.use(limiter as RequestHandler)
// Rutas de autenticación utilizan un rate limit más estricto

// Middleware para extraer JSON de las solicitudes
app.use(express.json())

// Middleware para extraer cookies de las solicitudes
app.use(cookieParser() as RequestHandler)

// Permitir CORS desde la app de React (Vite)
const allowedOrigins = [
	...env.FRONTEND_URLS,
	'http://localhost:5173',
	'http://localhost:8000',
]

app.use(
	cors({
		// Comprobar si el origen de la petición está en la lista
		origin: (
			origin: string | undefined,
			callback: (err: Error | null, allow?: boolean) => void,
		) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('Origen no permitido por CORS'))
			}
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		credentials: true,
		exposedHeaders: ['ETag'], // Permitir acceso a header ETag (subida multipart)
	}) as RequestHandler,
)

// Montar rutas de MinIO (subida multipart)
app.use('/api/v1/', storageRoutes)

// Montar rutas de usuarios
app.use('/api/v1/', userRoutes)

// Montar rutas de centros
app.use('/api/v1/', centerRoutes)

// Montar rutas de POIs
app.use('/api/v1/', poiRoutes)

// Montar rutas de trazabilidad
app.use('/api/v1/', traceabilityRoutes)

// Health check
app.get('/health', (req: Request, res: Response) => {
	res.status(200).json({ status: 'ok' })
})

// Montar ruta de especificación OpenAPI (solo en desarrollo y staging)
if (env.APP_STAGE !== 'prod') {
	const currentDir = dirname(fileURLToPath(import.meta.url))
	const openApiPath = resolve(currentDir, '../openapi.json')
	const swaggerSpec = JSON.parse(readFileSync(openApiPath, 'utf-8'))
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
	for (const url of env.FRONTEND_URLS) {
		console.log(`Documentación API disponible en ${url}/api-docs`)
	}
}

// Middleware para manejar errores lanzados desde servicios
app.use(errorHandler)

// El servidor se inicia en index.ts mediante appBootstrap.
// Primero incializa MinIO y comprueba el bucket, luego arranca el servidor.

export default app
