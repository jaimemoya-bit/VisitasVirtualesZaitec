import type { Request, Response } from 'express'
import poiService from '../services/poiService.ts'
import { asyncHandler } from '../middlewares/asyncHandler.ts'
import { env } from '../env.ts'
import { ApiError } from '../middlewares/errorHandler.ts'
import type { ValidAuthenticatedRequest } from '../middlewares/validation.ts'

// Actualizar un POI existente
export const updatePoiHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData, user } = req as ValidAuthenticatedRequest
		const { body: poiData, params } = validData
		const { centerId, id: poiId } = params
		const userId = user?.sub

		if (!userId) throw new ApiError(401, 'Usuario no autenticado')

		const updatedPoi = await poiService.updatePoi(
			userId,
			centerId,
			poiId,
			poiData,
		)

		return res.json({
			message: 'POI actualizado exitosamente',
			updatedPoi,
		})
	},
)

// Obtener el historial de cambios de un POI
export const getPoiHistoryHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { params } = (req as ValidAuthenticatedRequest).validData
		const { id: poiId } = params

		const history = await poiService.getPoiHistory(poiId)
		return res.json(history)
	},
)

// Crear un nuevo POI para un centro específico
export const newPoiHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData, user } = req as ValidAuthenticatedRequest
		const { body: poiData, params } = validData
		const { centerId } = params
		const userId = user?.sub

		if (!userId) throw new ApiError(401, 'Usuario no autenticado')

		if (env.APP_STAGE === 'dev') {
			console.log(
				`Creando POI "${poiData.name}" para centro ${centerId} por usuario ${userId}`,
			)
		}

		const newPoi = await poiService.createPoi(centerId, userId, poiData)

		return res.json({
			message: 'POI creado exitosamente',
			newPoi,
		})
	},
)

export const poisByCenterHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { params, query } = (req as ValidAuthenticatedRequest).validData
		const { centerId } = params
		const { lastId } = query

		const pois = await poiService.getPoisByCenter({ params, query })

		if (pois.length === 0) {
			return res.status(200).json({
				message: lastId
					? 'No hay más POIs para mostrar'
					: `No se encontraron POIs para el centro con ID ${centerId}`,
				pois: [],
			})
		}

		const nextCursor = pois[pois.length - 1]!.id

		return res.json({
			message: 'POIs obtenidos exitosamente',
			pois,
			nextCursor,
		})
	},
)

export const poisByUserAndCenterHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData, user } = req as ValidAuthenticatedRequest
		const { params } = validData
		const { centerId } = params
		const userId = user?.sub

		if (!userId) throw new ApiError(401, 'Usuario no autenticado')

		const pois = await poiService.getPoisByUserAndCenter(userId, centerId)

		if (pois.length === 0) {
			return res.status(200).json({
				message: `No se encontraron POIs para el usuario ${userId} en el centro ${centerId}`,
				pois: [],
			})
		}
		return res.json({ message: 'POIs obtenidos exitosamente', pois })
	},
)

export const poisByCenterAndFuzzyNameHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { params, query } = (req as ValidAuthenticatedRequest).validData
		const { centerId } = params
		const { search: partialName } = query

		if (!partialName) {
			throw new ApiError(400, 'Query param "search" es requerido')
		}

		const pois = await poiService.getPoisByCenterAndFuzzyName(
			centerId,
			partialName,
		)

		if (pois.length === 0) {
			return res.status(200).json({
				message: `No se encontraron POIs en el centro ${centerId} con nombre '${partialName}'`,
				pois: [],
			})
		}
		return res.json({ message: 'POIs obtenidos exitosamente', pois })
	},
)

export const allPoisHandler = asyncHandler(
	async (_req: Request, res: Response) => {
		const pois = await poiService.getAllPois()
		if (pois.length === 0) {
			return res
				.status(200)
				.json({ message: 'No se encontraron POIs', pois: [] })
		}
		return res.json({ message: 'POIs obtenidos exitosamente', pois })
	},
)

export const deletePoiHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData, user } = req as ValidAuthenticatedRequest
		const { params } = validData
		const { centerId, id: poiId } = params
		const userId = user?.sub

		const deletedPoi = await poiService.deletePoiByCenterAndId(
			userId,
			centerId,
			poiId,
		)
		return res.json({
			message: 'POI eliminado exitosamente',
			deletedPoi,
		})
	},
)
