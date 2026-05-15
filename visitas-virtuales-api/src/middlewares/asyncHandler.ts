import type { Request, Response, NextFunction, RequestHandler } from 'express'

// Middleware para capturar errores en funciones async (evita try/catch en cada handler)
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next)
	}
}
