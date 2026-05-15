import { Router } from 'express'
import hasRoles from '../middlewares/hasRole.ts'
import {
	poisByCenterHandler,
	newPoiHandler,
	deletePoiHandler,
	poisByCenterAndFuzzyNameHandler,
	allPoisHandler,
	updatePoiHandler,
} from '../controllers/poiController.ts'
import {
	validateBody,
	validateParams,
	validateRequest,
} from '../middlewares/validation.ts'
import {
	poiByCenterSchema,
	createPoiSchema,
	deletePoiSchema,
	updatePoiSchema,
} from '../db/schema.ts'

export const router = Router()

// ====================== //
// ==== CRUD de POIs ==== //
// ====================== //

/**
 * @openapi
 * /api/v1/centers/{centerId}/pois:
 *   post:
 *     summary: Crear un nuevo POI para un centro específico (solo para administradores o profesores)
 *     description: Esta ruta permite a los administradores o profesores crear un nuevo POI asociado a un centro específico. El ID del centro se proporciona como parámetro en la URL, y los detalles del POI, en formato JSON, se incluyen en el cuerpo de la solicitud.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del centro al que se asociará el nuevo POI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, details]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "POI de ejemplo"
 *               details:
 *                 type: object
 *                 example: { "description": "Descripción del POI" }
 *     responses:
 *       200:
 *         description: POI creado con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.post(
	'/centers/:centerId/pois',
	hasRoles(['admin', 'teacher']),
	validateRequest({
		params: createPoiSchema.shape.params,
		body: createPoiSchema.shape.body,
	}),
	newPoiHandler,
)

/**
 * @openapi
 * /api/v1/centers/{centerId}/pois:
 *   get:
 *     summary: Listar POIs de un centro específico con paginación opcional
 *     description: Esta ruta permite a los usuarios obtener una lista de POIs asociados a un centro específico. El ID del centro se proporciona como parámetro en la URL. Además, se pueden incluir parámetros de consulta para paginar los resultados, como el número de POIs por página (limit) y el ID del último POI obtenido en la página anterior (lastId) para cargar la siguiente página de resultados.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del centro del cual se desean obtener los POIs
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de POIs por página para paginación (opcional, por defecto es 10)
 *       - in: query
 *         name: lastId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID del último POI obtenido en la página anterior para paginación (opcional)
 *     responses:
 *       200:
 *         description: Lista de POIs obtenida con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.get(
	'/centers/:centerId/pois',
	hasRoles(['admin', 'teacher', 'guest']),
	validateRequest({
		params: poiByCenterSchema.shape.params,
		query: poiByCenterSchema.shape.query,
	}),
	poisByCenterHandler,
)

/**
 * @openapi
 * /api/v1/centers/{centerId}/pois/search:
 *   get:
 *     summary: Buscar POIs por nombre parcial dentro de un centro específico
 *     description: Esta ruta permite a los usuarios buscar POIs dentro de un centro específico utilizando un nombre parcial. El ID del centro se proporciona como parámetro en la URL, y el nombre parcial se pasa como un query parameter.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del centro en el que se realizará la búsqueda de POIs
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre parcial para buscar POIs dentro del centro especificado
 *     responses:
 *       200:
 *         description: Lista de POIs que coinciden con el nombre parcial obtenida con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.get(
	'/centers/:centerId/pois/search',
	hasRoles(['admin', 'teacher', 'guest']),
	validateRequest({
		params: poiByCenterSchema.shape.params,
	}),
	poisByCenterAndFuzzyNameHandler,
)

/**
 * @openapi
 * /api/v1/pois:
 *   get:
 *     summary: Listar todos los POIs de todos los centros (solo para administradores)
 *     description: Esta ruta permite a los administradores obtener una lista de todos los POIs existentes en todos los centros. Esta ruta es útil para la gestión global de POIs y no requiere un ID de centro específico.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los POIs obtenida con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.get('/pois', hasRoles('admin'), allPoisHandler)

/**
 * @openapi
 * /api/v1/centers/{centerId}/pois/{id}:
 *   patch:
 *     summary: Actualizar un POI existente (solo para administradores o profesores)
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del centro al que pertenece el POI
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               details:
 *                 type: string
 *     responses:
 *       200:
 *         description: POI actualizado con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.patch(
	'/centers/:centerId/pois/:id',
	hasRoles(['admin', 'teacher']),
	validateRequest({
		params: updatePoiSchema.shape.params,
		body: updatePoiSchema.shape.body,
	}),
	updatePoiHandler,
)

/**
 * @openapi
 * /api/v1/centers/{centerId}/pois/{id}:
 *   delete:
 *     summary: Eliminar un POI existente en un centro específico (solo para administradores o profesores)
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del centro al que pertenece el POI
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI a eliminar
 *     responses:
 *       200:
 *         description: POI eliminado con éxito
 *       401:
 *         description: No se proporcionó un token de acceso
 *       403:
 *         description: Token de acceso inválido o expirado
 */
router.delete(
	'/centers/:centerId/pois/:id',
	hasRoles(['admin', 'teacher']),
	validateRequest({
		params: deletePoiSchema.shape.params,
	}),
	deletePoiHandler,
)

export default router
