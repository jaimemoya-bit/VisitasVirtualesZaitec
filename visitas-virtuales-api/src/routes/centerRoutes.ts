import { Router } from 'express'
import hasRole from '../middlewares/hasRole.ts'
import {
	getAllCentersHandler,
	updateCenterHandler,
	updateCenterImageHandler,
} from '../controllers/centerController.ts'
import { validateRequest } from '../middlewares/validation.ts'
import {
	allCenterSchema,
	centerImageUpdateSchema,
	centerUpdateSchema,
} from '../db/schema.ts'
import multer from 'multer'

export const router = Router()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
}) // Limitar a 10MB por parte

// ========================= //
// ==== CRUD de Centros ==== //
// ========================= //

/**
 * @openapi
 * /api/v1/centers:
 *   get:
 *     summary: Obtener listado de todos los centros disponibles con paginación opcional
 *     description: Esta ruta permite a los usuarios obtener una lista de los centros disponibles en el sistema
 *     tags: [Centros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Número máximo de centros a devolver (opcional, por defecto 10)
 *       - in: query
 *         name: lastId
 *         schema:
 *           type: integer
 *           example: 20
 *         description: ID del último centro recibido en la página anterior para paginación (opcional)
 *     responses:
 *       200:
 *         description: Centros obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Centros obtenidos exitosamente"
 *                 centers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Instituto Madrid"
 *                       description:
 *                         type: string
 *                         example: "Centro educativo principal en Madrid"
 *                       location:
 *                         type: string
 *                         example: "Madrid, España"
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.get(
	'/centers',
	validateRequest({ query: allCenterSchema.shape.query }),
	getAllCentersHandler,
)

/**
 * @openapi
 * /api/v1/centers/{id}:
 *   patch:
 *     summary: Actualizar un centro específico (solo para administradores)
 *     description: Esta ruta permite a los administradores actualizar la información de un centro específico utilizando su ID
 *     tags: [Centros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del centro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Instituto Madrid Actualizado"
 *               description:
 *                 type: string
 *                 example: "Centro educativo principal en Madrid, actualizado"
 *               location:
 *                 type: string
 *                 example: "Madrid, España"
 *               imageUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/updated-image.jpg"
 *     responses:
 *       200:
 *         description: Centro actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Centro actualizado exitosamente"
 *                 center:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Instituto Madrid Actualizado"
 *                     description:
 *                       type: string
 *                       example: "Centro educativo principal en Madrid, actualizado"
 *                     location:
 *                       type: string
 *                       example: "Madrid, España"
 *                     imageUrl:
 *                       type: string
 *                       format: url
 *                       example: "https://example.com/updated-image.jpg"
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Token de acceso no proporcionado
 *       403:
 *         description: Token de acceso inválido, expirado o el usuario no tiene permisos para actualizar el centro
 *       404:
 *         description: Centro no encontrado
 */
router.patch(
	'/centers/:id',
	hasRole(['admin']),
	validateRequest({
		params: centerUpdateSchema.shape.params,
		body: centerUpdateSchema.shape.body,
	}),
	updateCenterHandler,
)

/**
 * @openapi
 * /api/v1/centers/{id}/image:
 *   post:
 *     summary: Actualizar la imagen de un centro específico (solo para administradores)
 *     description: Esta ruta permite a los administradores actualizar la imagen de un centro específico utilizando su ID.
 *     tags: [Centros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del centro al que se le actualizará la imagen
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen del centro actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Imagen del centro actualizada exitosamente"
 *                 center:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Instituto Madrid"
 *                     description:
 *                       type: string
 *                       example: "Centro educativo principal en Madrid"
 *                     location:
 *                       type: string
 *                       example: "Madrid, España"
 *                     imageUrl:
 *                       type: string
 *                       format: url
 *                       example: "https://example.com/new-image.jpg"
 *       400:
 *         description: Fichero no proporcionado o inválido
 *       401:
 *         description: Token de acceso no proporcionado
 *       403:
 *         description: Token de acceso inválido o expirado
 *       404:
 *         description: Centro no encontrado
 */
router.post(
	'/centers/:id/image',
	hasRole(['admin']),
	validateRequest({ params: centerImageUpdateSchema.shape.params }),
	upload.single('file'),
	updateCenterImageHandler,
)

export default router
