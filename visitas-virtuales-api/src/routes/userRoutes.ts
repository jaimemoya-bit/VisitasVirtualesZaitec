import { Router } from 'express'
import {
	loginHandler,
	userUpdateHandler,
	refreshTokenHandler,
	profileHandler,
	registerHandler,
	logoutHandler,
} from '../controllers/userController.ts'
import {
	updateCurrUserProfileSchema,
	userImageUpdateSchema,
	userLoginSchema,
	userRegisterSchema,
	UserRoleEditSchema,
} from '../db/schema.ts'
import { validateRequest } from '../middlewares/validation.ts'
import hasRole from '../middlewares/hasRole.ts'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { env } from '../env.ts'

export const router = Router()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
}) // Limitar a 10MB por parte

// Middleware para rate limiting en rutas de autenticación (20 solicitudes cada 15 minutos por IP por defecto)
const authLimiter = rateLimit({
	windowMs: env.AUTH_RATE_LIMIT_WINDOW,
	max: env.AUTH_RATE_LIMIT_MAX,
	message: {
		error: 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.',
		// Tiempo en minutos para el header Retry-After
		retryAfter: env.AUTH_RATE_LIMIT_WINDOW / (60 * 1000),
	},
	// Enviar información de rate limit en headers
	standardHeaders: true,
	// No enviar headers obsoletos
	legacyHeaders: false,
})

/**
 * @openapi
 * /api/v1/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado (solo para administradores y profesores)
 *     description: Devuelve el perfil del usuario autenticado. Requiere un token de acceso válido en el header Authorization. Los usuarios invitados no tienen un perfil, por lo que no podrán acceder a esta ruta.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Token de acceso no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Token de acceso inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor al obtener el perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/me', hasRole(['admin', 'teacher']), profileHandler)

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Registrar nuevo usuario (solo para administradores)
 *     description: Registra un nuevo usuario con email, nombre de usuario, contraseña y, opcionalmente, su rol. Por defecto el rol asignado es el de menor rango, "guest". No devuelve tokens, estos se proveeran cuando el usuario registrado inicie sesión.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 maxLength: 120
 *                 format: email
 *                 example: 'alumno_mad_2@instituto.es'
 *               username:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 24
 *                 example: 'alumno_mad_2'
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 32
 *                 example: 'Alumno123!'
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, guest]
 *                 description: Rol del usuario (opcional, por defecto "guest")
 *     responses:
 *       201:
 *         description: Usuario registrado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Email, nombre de usuario o contraseña no proporcionados, o con formato no válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       409:
 *         description: Email o nombre de usuario ya en uso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor al registrar el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post(
	'/users',
	hasRole('admin'),
	validateRequest({
		body: userRegisterSchema.shape.body,
	}),
	registerHandler,
)

/**
 * @openapi
 * /api/v1/users/auth:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     description: Permite a un usuario iniciar sesión utilizando su email o su nombre de usuario junto con su contraseña. Devuelve un token de acceso para autenticación en futuras solicitudes. El token de actualización se envía al cliente en una cookie HTTP-only. El administrador se encargará de registrar a los usuarios y darles los credenciales que deben utilizar en esta ruta para iniciar sesión.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [email, password]
 *                 properties:
 *                   email:
 *                     type: string
 *                     maxLength: 120
 *                     format: email
 *                     example: 'admin_mad@instituto.es'
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                     maxLength: 32
 *                     example: 'Admin123!'
 *               - type: object
 *                 required: [username, password]
 *                 properties:
 *                   username:
 *                     type: string
 *                     minLength: 6
 *                     maxLength: 24
 *                     example: 'admin_mad'
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                     maxLength: 32
 *                     example: 'Admin123!'
 *     responses:
 *       200:
 *         description: Usuario autenticado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Formato de solicitud no válido o campos requeridos no proporcionados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor al autenticar el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post(
	'/users/auth',
	authLimiter,
	validateRequest({ body: userLoginSchema.shape.body }),
	loginHandler,
)

/**
 * @openapi
 * /api/v1/users/auth/logout:
 *   post:
 *     summary: Cerrar sesión de usuario
 *     description: Permite a un usuario cerrar su sesión actual. Requiere un token de acceso válido en el header Authorization. El token de actualización asociado al usuario se invalidará y eliminará del cliente. Los usuarios invitados no pueden iniciar sesión, por lo que no necesitan cerrar sesión.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Token de acceso no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Token de acceso inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor al cerrar la sesión del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/users/auth/logout', logoutHandler)

/**
 * @openapi
 * /api/v1/me:
 *   patch:
 *     summary: Editar perfil del usuario autenticado (solo para administradores y profesores)
 *     description: Permite al usuario autenticado editar su propio perfil, incluyendo su email, nombre de usuario y contraseña. Requiere un token de acceso válido en el header Authorization.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               centerPreferenceId:
 *                 type: integer
 *     multipart/form-data:
 *       schema:
 *         type: object
 *         properties:
 *           file:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Usuario actualizado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Formato de solicitud no válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Token de acceso no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Token de acceso inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor al actualizar el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.patch(
	'/me',
	hasRole(['admin', 'teacher']),
	upload.single('file'),
	validateRequest({ body: updateCurrUserProfileSchema.shape.body }),
	userUpdateHandler,
)

/**
 * @openapi
 * /api/v1/users/auth/refresh:
 *   post:
 *     summary: Renovar tokens de autenticación utilizando token de actualización (solo para administradores y profesores)
 *     description: Permite a un usuario renovar sus tokens utilizando un token de actualización válido. Devuelve un nuevo token de acceso en la respuesta y asigna un nuevo token de actualización en una cookie HTTP-only. Los invitados no necesitan renovar tokens, se les permite el acceso a las rutas públicas sin autenticación. La validación del token se realiza dentro del handler.
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tokens renovados con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Token de actualización no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Token de actualización inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post(
	'/users/auth/refresh',
	authLimiter,
	refreshTokenHandler,
)

/**
 * @openapi
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Cambiar el rol de un usuario (solo para administradores) - SIN IMPLEMENTAR
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario al que se le cambiará el rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *                 description: Nuevo rol para el usuario
 *     responses:
 *       200:
 *         description: Rol del usuario actualizado con éxito
 *       400:
 *         description: Rol proporcionado no es válido
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: El token proporcionado no es válido o el usuario no tiene permisos de administrador
 */
router.patch(
	'/users/:id/role',
	hasRole('admin'),
	validateRequest({
		params: UserRoleEditSchema.shape.params,
		body: UserRoleEditSchema.shape.body,
	}),
	(req, res) => {
		res.json({
			message: `Ruta para cambiar el rol del usuario con ID ${req.params.id} - solo accesible para administradores`,
		})
	},
)

export default router
