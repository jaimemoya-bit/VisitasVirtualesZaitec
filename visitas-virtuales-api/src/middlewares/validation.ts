import type { ZodType, z } from 'zod'
import { ZodError } from 'zod'
import type { Request } from 'express'

export interface ValidRequest extends Request {
	validData: {
		params: any
		body: any
		query: any
	}
}

export interface ValidAuthenticatedRequest<
	T extends ZodType = any,
> extends Request {
	user: { sub: number; role: string }
	validData: z.infer<T>
}

export const validateBody = (schema: ZodType) => {
	return (req: any, res: any, next: any) => {
		try {
			const validatedData = schema.parse(req.body)
			;(req as any).body = validatedData
			next()
		} catch (e) {
			if (e instanceof ZodError) {
				// Pasar error a middleware de manejo de errores
				e.name = 'ZodValidationError'
			}
			next(e)
		}
	}
}

export const validateParams = (schema: ZodType) => {
	return (req: any, res: any, next: any) => {
		try {
			const validatedData = schema.parse(req.params)
			;(req as any).params = validatedData
			next()
		} catch (e) {
			if (e instanceof ZodError) {
				// Pasar error a middleware de manejo de errores
				e.name = 'ZodValidationError'
			}
			next(e)
		}
	}
}

export const validateQuery = (schema: ZodType) => {
	return (req: any, res: any, next: any) => {
		try {
			const validatedData = schema.parse(req.query)
			;(req as any).query = validatedData
			next()
		} catch (e) {
			if (e instanceof ZodError) {
				// Pasar error a middleware de manejo de errores
				e.name = 'ZodValidationError'
			}
			next(e)
		}
	}
}

export const validateRequest = (schema: {
	params?: ZodType
	query?: ZodType
	body?: ZodType
}) => {
	return (req: any, res: any, next: any) => {
		try {
			// Creamos un objeto para guardar lo validado
			const params = schema.params
				? schema.params.parse(req.params)
				: req.params
			const query = schema.query ? schema.query.parse(req.query) : req.query
			const body = schema.body ? schema.body.parse(req.body) : req.body
			req.validData = { params, query, body }
			next()
		} catch (e) {
			if (e instanceof ZodError) {
				// Pasar error a middleware de manejo de errores
				e.name = 'ZodValidationError'
			}
			next(e)
		}
	}
}
