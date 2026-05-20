import { Router } from 'express'
import { getPoiHistoryHandler } from '../controllers/traceabilityController.ts'
import hasRole from '../middlewares/hasRole.ts'

export const router = Router()

/**
 * @openapi
 * /api/v1/audit/poi-history:
 *   get:
 *     summary: Obtener el historial de POI
 *     description: Devuelve un historial de modificaciones realizadas a los Puntos de Interés (POI) en el sistema.
 *     tags:
 *       - Traceability
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de registros a devolver
 *     responses:
 *       200:
 *         description: Historial de POI obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Historial de POI obtenido exitosamente
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       details:
 *                         type: object
 *                         example: { "oldValue": "Antiguo valor", "newValue": "Nuevo valor", "reason": "Crear nuevo POI" }
 *                       userId:
 *                         type: integer
 *                         example: 42
 *                       poiId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       action:
 *                         type: string
 *                         example: "update"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-01T12:34:56Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                             example: "johndoe"
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/avatar.jpg"
 *                       poi:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Cafetería del centro"
 *                       center:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Instituto Madrid"
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
 *         description: Error del servidor al obtener el historial de POI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/audit/poi-history', hasRole('admin'), getPoiHistoryHandler)

export default router
