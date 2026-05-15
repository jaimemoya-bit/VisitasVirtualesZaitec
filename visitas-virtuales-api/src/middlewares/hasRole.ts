import type { Request, Response, NextFunction } from 'express'
import { getGuestUser, verifyToken } from '../helpers/jwt.ts'
import { env } from '../env.ts'
import type { JWTPayload } from 'jose'
import type { UserRoleType } from '../db/schema.ts'

type GuestJWTPayload = JWTPayload & {
	role: UserRoleType
	sub: string
}

export type AuthenticatedRequest = Request & {
	user?: JWTPayload | GuestJWTPayload
}

const hasRole = (roles: UserRoleType | UserRoleType[]) => {
	const allowedRoles = Array.isArray(roles) ? roles : [roles]

	return async (req: Request, res: Response, next: NextFunction) => {
		const authReq = req as AuthenticatedRequest
		// Comprobar que el usuario esté autenticado y tenga un rol válido
		const authHeader = authReq.headers['authorization']
		// Authorization: Bearer <token>
		let token = authHeader && authHeader.split(' ')[1]

		// Filtrar token igual a string "null"
		if (token === 'null' || token === 'undefined') {
			token = undefined
		}

		// Si no se proporciona un token y no se permiten invitados, denegar el acceso
		if (!token && !allowedRoles.includes('guest')) {
			env.APP_STAGE === 'dev' &&
				console.warn(
					`Acceso denegado - no se proporcionó un token de acceso: + ${req.method} ${req.originalUrl}`,
				)
			return res.status(401).json({
				message: 'No se proporcionó un token de acceso',
			})
		}

		// Si se proporciona un token, verificarlo y extraer el rol del usuario
		if (token) {
			try {
				const { payload } = await verifyToken(token)
				authReq.user = payload
			} catch {
				// Si la verificación del token falla y no se permiten invitados, denegar el acceso
				if (!allowedRoles.includes('guest')) {
					env.APP_STAGE === 'dev' &&
						console.warn(
							'Token de acceso inválido o expirado para ruta protegida: ' +
								req.method +
								' ' +
								req.originalUrl,
						)
					return res.status(403).json({
						message: 'Token de acceso inválido o expirado',
					})
				}
			}
		}

		// Si no se proporciona un token pero se permiten invitados, asignar un rol de invitado al usuario
		if (!authReq.user && allowedRoles.includes('guest')) {
			authReq.user = getGuestUser() as GuestJWTPayload
		}

		const userRole = authReq.user?.role
		if (env.APP_STAGE === 'dev') {
			console.log(`Rol de usuario detectado: ${userRole}`)
			console.log(`Roles permitidos para esta ruta: ${allowedRoles.join(', ')}`)
		}

		// Si el token no contiene un rol, denegar el acceso
		if (!userRole) {
			env.APP_STAGE === 'dev' &&
				console.warn(
					`Acceso denegado - no se encontró el rol del usuario en la solicitud: + ${req.method} ${req.originalUrl}`,
				)
			return res.status(403).json({
				message: 'No tienes permiso para acceder a este recurso',
			})
		}

		// Si el rol del usuario no está en la lista de roles permitidos, denegar el acceso
		if (!allowedRoles.includes(userRole as UserRoleType)) {
			env.APP_STAGE === 'dev' &&
				console.warn(
					`Acceso denegado - el rol del usuario (${userRole}) no tiene permisos para acceder a este recurso: + ${req.method} ${req.originalUrl}`,
				)
			return res.status(403).json({
				message: 'No tienes permiso para acceder a este recurso',
			})
		}

		// Si el rol del usuario es válido, permitir el acceso
		next()
	}
}

export default hasRole
