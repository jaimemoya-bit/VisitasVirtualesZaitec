import { db } from '../db/db.ts'
import {
	poiHistory,
	type PoiDetails,
	type PoiHistoryItemType,
	users,
	pois,
} from '../db/schema.ts'
import { ApiError } from '../middlewares/errorHandler.ts'

const logPoiAction = async (
	userId: number,
	poiId: number,
	action: 'create' | 'update' | 'delete',
	details: PoiDetails,
): Promise<void> => {
	try {
		await db.insert(poiHistory).values({
			userId,
			poiId,
			action,
			details,
		})
	} catch (error) {
		console.error('Error al registrar la acción en el historial de POI:', error)
	}
}

export type PoiHistoryWithRelations = PoiHistoryItemType & {
	user: { username: string; imageUrl: string | null }
	poi: { name: string; center: { name: string } | null } | null
}

const getPoiHistory = async (
	limit: number,
): Promise<PoiHistoryWithRelations[]> => {
	try {
		const history = await db.query.poiHistory.findMany({
			limit,
			orderBy: (poiHistory, { desc }) => [desc(poiHistory.timestamp)],
			with: {
				user: {
					columns: {
						username: true,
						imageUrl: true,
					},
				},
				poi: {
					columns: {
						name: true,
					},
					with: {
						center: {
							columns: {
								name: true,
							},
						},
					},
				},
			},
		})
		const normalizedHistory = history.map((entry) => {
			if (entry.poi) return entry

			const old = entry.details?.oldValue ?? {}

			return {
				...entry,
				poi: {
					name: old.name,
					center: {
						name: old.center?.name ?? 'Centro desconocido',
					},
				},
			}
		})
		return (normalizedHistory as PoiHistoryWithRelations[]) ?? []
	} catch (error) {
		console.error('Error al obtener el historial de POI:', error)
		throw new ApiError(500, 'Error al obtener el historial de POI')
	}
}

export default {
	logPoiAction,
	getPoiHistory,
}
