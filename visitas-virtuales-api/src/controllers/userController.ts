import type { CookieOptions, Request, Response } from 'express'
import {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
} from '../helpers/jwt.ts'
import { getHttpOnlyCookieOptions } from '../helpers/cookies.ts'
import userService from '../services/userService.ts'
import type { ValidAuthenticatedRequest } from '../middlewares/validation.ts'
import { env } from '../env.ts'
import {
	centerImageUpdateSchema,
	updateCurrUserProfileSchema,
	userImageUpdateSchema,
	userLoginSchema,
	userRegisterSchema,
} from '../db/schema.ts'
import storageService from '../services/storageService.ts'
import { asyncHandler } from '../middlewares/asyncHandler.ts'

/**
 *
 * @param request.body debe contener email, username, password y role (opcional, guest por defecto)
 * @throws manejados por middleware apiErrorHandler
 *
 * No se devuelven tokens de autenticación al registrar un nuevo usuario, se obtendrán al iniciar sesión.
 */
export const registerHandler = async (req: Request, res: Response) => {
	const { body: userData } = (
		req as ValidAuthenticatedRequest<typeof userRegisterSchema>
	).validData
	await userService.register(userData)
	res.status(201).json({
		message: 'Usuario registrado exitosamente',
	})
}
/**
 *
 * @param request.body debe contener email o username y password
 * @returns objeto con accessToken (refreshToken se envía al cliente en una cookie HTTP-only)
 * @throws manejados por middleware apiErrorHandler
 */
export const loginHandler = async (req: Request, res: Response) => {
	const { body } = (req as ValidAuthenticatedRequest<typeof userLoginSchema>)
		.validData
	const tokenPair = await userService.login(body)
	// Insertar token de actualización en cookie HTTP-only para que el cliente lo envíe automáticamente en cada solicitud
	res.cookie('refreshToken', tokenPair.refreshToken, getHttpOnlyCookieOptions())
	res.json({
		message: 'Usuario autenticado exitosamente',
		accessToken: tokenPair.accessToken,
	})
}

/**
 *
 * @param req debe contener la cookie HTTP-only refreshToken enviada automáticamente por el navegador
 *
 * Logout envia instrucciones al navegador para eliminar la cookie HTTP-only refreshToken
 */
export const logoutHandler = (req: Request, res: Response) => {
	const options = getHttpOnlyCookieOptions() as CookieOptions
	delete options.maxAge
	res.clearCookie('refreshToken', options)
	res.status(200).json({ message: 'Logout successful' })
}

// Actualizar perfil del usuario autenticado (puede contener nueva imagen de perfil)
export const userUpdateHandler = async (req: Request, res: Response) => {
	const { user, validData } = req as ValidAuthenticatedRequest<
		typeof updateCurrUserProfileSchema
	>
	const file = req.file
	let fileUrl: string | undefined
	if (file) {
		// Derivar nombre, tipo MIME y buffer del fichero interceptado por Multer
		const fileName = req.file?.originalname
		const mimeType = req.file?.mimetype
		const buffer = req.file?.buffer

		if (!fileName || !mimeType || !buffer) {
			return res
				.status(400)
				.json({ error: 'Fichero no proporcionado o inválido.' })
		}

		if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
			return res.status(400).json({
				error:
					'Tipo de fichero no permitido. Solo se permiten imágenes JPEG, PNG o GIF.',
			})
		}

		// Subir la imagen a MinIO y obtener la URL pública
		const sanitizedFileName = await storageService.simpleUpload(
			fileName,
			mimeType,
			buffer,
		)
		fileUrl = `${env.API_BASE_URL}/api/${env.API_VERSION}/assets/${sanitizedFileName}`
		validData.body.imageUrl = fileUrl // Agregar la URL de la imagen al cuerpo de datos a actualizar
	} else {
		// El frontend envía una string vacía para indicar que se desea eliminar la imagen de perfil
		validData.body.imageUrl = req.body.imageUrl
	}

	const updatedUser = await userService.updateUser(user.sub, validData.body)

	res.json({
		message: 'Perfil actualizado exitosamente',
		user: updatedUser,
	})
}

/**
 *
 * @param req debe contener la cookie HTTP-only refreshToken enviada automáticamente por el navegador
 * @returns objeto con un nuevo accessToken si el refreshToken es válido (refreshToken se envía al cliente en una cookie HTTP-only)
 *
 * El token de actualización se enviará desde el cliente en una cookie HTTP-only para evitar ataques XSS.
 * El cliente no tiene acceso directo a esta cookie, el navegador la envía automáticamente en cada solicitud al backend.
 */
export const refreshTokenHandler = async (req: Request, res: Response) => {
	const token = req.cookies?.refreshToken

	// Denegar acceso si no se proporciona un token de actualización
	if (!token) {
		env.APP_STAGE === 'dev' &&
			console.warn(
				'Token de actualización no proporcionado para ruta protegida: ' +
					req.method +
					' ' +
					req.originalUrl,
			)
		return res
			.status(401)
			.json({ message: 'Token de actualización no proporcionado' })
	}

	// Verificar token de actualización y generar un nuevo token de acceso si es válido
	try {
		const { payload } = await verifyToken(token)
		const newAccessToken = await generateAccessToken(payload.sub, payload.role)
		// Adicionalmente, renovar el token de actualización
		const newRefreshToken = await generateRefreshToken(
			payload.sub,
			payload.role,
		)
		res.cookie('refreshToken', newRefreshToken, getHttpOnlyCookieOptions())
		return res.json({
			message: 'Tokens renovados exitosamente',
			accessToken: newAccessToken,
		})
	} catch (_) {
		env.APP_STAGE === 'dev' &&
			console.warn(
				'Token de actualización inválido o expirado para ruta protegida: ' +
					req.method +
					' ' +
					req.originalUrl,
			)
		// Denegar acceso si el token de actualización es inválido o ha expirado
		return res.status(403).json({
			message: 'Token de actualización inválido o expirado',
		})
	}
}

/**
 *
 * @param req contiene el ID del usuario autenticado en req.user.sub, proporcionado por el middleware isAuthenticated
 * @returns perfil del usuario autenticado
 * @throws manejados por middleware apiErrorHandler
 */
export const profileHandler = async (req: Request, res: Response) => {
	const validReq = req as ValidAuthenticatedRequest
	const userProfile = await userService.getUserProfile(validReq.user.sub)
	return res.json({
		message: 'Perfil de usuario obtenido exitosamente',
		profile: userProfile,
	})
}
