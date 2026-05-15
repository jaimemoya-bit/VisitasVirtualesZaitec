import type { Request, Response } from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.ts'
import traceabilityService from '../services/traceabilityService.ts'

export const getPoiHistoryHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const limit = parseInt(req.query.limit as string) || 20
		const history = await traceabilityService.getPoiHistory(limit)
		return res.json({
			message: 'Historial de POI obtenido exitosamente',
			history,
		})
	},
)
