import type { Request, Response, NextFunction } from 'express'
import { env } from '../env.ts'

export class ApiError extends Error {
	statusCode: number

	constructor(statusCode: number, message: string) {
		super(message)
		this.statusCode = statusCode
		this.name = 'ApiError'

		// Limpiar stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ApiError)
		}
	}
}

// Type guard para identificar errores de API
function isApiError(err: any): err is ApiError {
	return err instanceof ApiError && typeof err.statusCode === 'number'
}

const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	console.error(err.stack)

	// Valores de error por defecto
	let status = 500
	let message = 'Error interno del servidor'
	let details = undefined

	// Error de API lanzado desde un servicio
	if (isApiError(err)) {
		status = err.statusCode
		message = err.message
	} else if (err.name === 'ZodValidationError') {
		status = 400
		message = 'Error de validación'
		details = err.issues.map((issue: any) => ({
			field: issue.path.join('.'),
			message: issue.message,
		}))
	}

	res.status(status).json({
		message: message,
		...(details && { details }),
		...(env.APP_STAGE === 'dev' && { stack: err.stack }),
	})
}

export default errorHandler
