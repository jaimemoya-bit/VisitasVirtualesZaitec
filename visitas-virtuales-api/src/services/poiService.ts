import { db } from '../db/db.ts'
import { ApiError } from '../middlewares/errorHandler.ts'
import { eq, and, ilike, gt, asc } from 'drizzle-orm'
import { pois, centers, poiHistory } from '../db/schema.ts'
import type { Poi } from '../db/schema.ts'
import traceabilityService from './traceabilityService.ts'
import type { PoiDetails } from '../db/schema.ts'
import { env } from 'node:process'

const createPoi = async (
	centerId: string,
	userId: number,
	poiData: { name: string; details: any },
): Promise<Poi> => {
	return await db.transaction(async (tx) => {
		const [center] = await tx
			.select({ id: centers.id })
			.from(centers)
			.where(eq(centers.id, Number(centerId)))
			.limit(1)

		if (!center) throw new ApiError(404, 'Centro no encontrado')

		const [existingPoi] = await tx
			.select()
			.from(pois)
			.where(
				and(eq(pois.name, poiData.name), eq(pois.centerId, Number(centerId))),
			)
			.limit(1)

		if (existingPoi)
			throw new ApiError(409, 'Ya existe un POI con ese nombre en este centro')

		const [newPoi] = await tx
			.insert(pois)
			.values({
				name: poiData.name,
				details: poiData.details,
				userId: userId,
				centerId: Number(centerId),
			})
			.returning()

		if (!newPoi) throw new ApiError(500, 'Error al crear el POI')

		// Registrar la creación en el historial de trazabilidad
		await traceabilityService.logPoiAction(userId, newPoi.id, 'create', {
			oldValue: null,
			newValue: newPoi,
			reason: 'Creación de nuevo POI',
		} as PoiDetails)

		return newPoi
	})
}

const getPoisByCenter = async (validData: any): Promise<Poi[]> => {
	const { centerId } = validData.params
	const { limit, lastId } = validData.query

	const [center] = await db
		.select({ id: centers.id })
		.from(centers)
		.where(eq(centers.id, Number(centerId)))
		.limit(1)

	if (!center) throw new ApiError(404, 'Centro no encontrado')

	// Keyset pagination con cursor (lastId). Carga la siguiente página de resultados después del último ID recibido
	return await db
		.select({
			id: pois.id,
			name: pois.name,
			details: pois.details,
			userId: pois.userId,
			centerId: pois.centerId,
		})
		.from(pois)
		.where(
			and(
				eq(pois.centerId, Number(centerId)),
				lastId ? gt(pois.id, Number(lastId)) : undefined,
			),
		)
		.orderBy(asc(pois.id))
		.limit(limit ?? 10)
}

const getAllPois = async (): Promise<Poi[]> => {
	const poiArr: Poi[] = await db
		.select({
			id: pois.id,
			name: pois.name,
			details: pois.details,
			userId: pois.userId,
			centerId: pois.centerId,
		})
		.from(pois)

	return poiArr
}

export const getPoisByUserAndCenter = async (
	userId: number,
	centerId: string,
): Promise<Poi[]> => {
	const [center] = await db
		.select({
			id: centers.id,
		})
		.from(centers)
		.where(eq(centers.id, Number(centerId)))
		.limit(1)

	if (!center) {
		throw new ApiError(404, 'Centro no encontrado')
	}

	const poiArr: Poi[] = await db
		.select({
			id: pois.id,
			name: pois.name,
			details: pois.details,
			userId: pois.userId,
			centerId: pois.centerId,
		})
		.from(pois)
		.where(and(eq(pois.centerId, Number(centerId)), eq(pois.userId, userId)))

	return poiArr
}

const getPoisByCenterAndFuzzyName = async (
	centerId: string,
	partialName: string,
): Promise<Poi[]> => {
	const [center] = await db
		.select({
			id: centers.id,
		})
		.from(centers)
		.where(eq(centers.id, Number(centerId)))
		.limit(1)

	if (!center) {
		throw new ApiError(404, 'Centro no encontrado')
	}

	const poiArr: Poi[] = await db
		.select({
			id: pois.id,
			name: pois.name,
			details: pois.details,
			userId: pois.userId,
			centerId: pois.centerId,
		})
		.from(pois)
		.where(
			and(
				eq(pois.centerId, Number(centerId)),
				ilike(pois.name, `%${partialName}%`),
			),
		)

	return poiArr
}

const deletePoiByCenterAndId = async (
	userId: number,
	centerId: string,
	poiId: string,
): Promise<Poi> => {
	const { poi: deletedPoi, centerName } = await db.transaction(async (tx) => {
		const [center] = await tx
			.select({ id: centers.id, name: centers.name })
			.from(centers)
			.where(eq(centers.id, Number(centerId)))
			.limit(1)

		if (!center) throw new ApiError(404, 'Centro no encontrado')

		const [poi] = await tx
			.select()
			.from(pois)
			.where(
				and(eq(pois.centerId, Number(centerId)), eq(pois.id, Number(poiId))),
			)
			.limit(1)

		if (!poi) throw new ApiError(404, 'POI no encontrado en este centro')

		const deleted = await tx
			.delete(pois)
			.where(
				and(eq(pois.centerId, Number(centerId)), eq(pois.id, Number(poiId))),
			)
			.returning()

		if (deleted.length === 0) {
			throw new ApiError(500, 'Error al eliminar el POI')
		}

		return {
			poi,
			centerName: center.name,
		}
	})

	await traceabilityService.logPoiAction(userId, deletedPoi.id, 'delete', {
		oldValue: {
			...deletedPoi,
			center: {
				name: centerName,
			},
		},
		newValue: null,
		reason: 'Eliminación de POI',
	})

	return deletedPoi
}

const updatePoi = async (
	userId: number,
	centerId: string,
	poiId: string,
	poiData: { name?: string; details?: any },
): Promise<Poi> => {
	return await db.transaction(async (tx) => {
		// Verificar que el poi exista en el centro indicado
		const [existingPoi] = await tx
			.select()
			.from(pois)
			.where(
				and(eq(pois.id, Number(poiId)), eq(pois.centerId, Number(centerId))),
			)
			.limit(1)

		if (!existingPoi)
			throw new ApiError(404, 'POI no encontrado en este centro')

		if (poiData.name === undefined && poiData.details === undefined) {
			throw new ApiError(
				400,
				'Debes enviar al menos name o details para actualizar el POI',
			)
		}

		try {
			// Modificar o actualizar el POI con los nuevos datos
			const [updatedPoi] = await tx
				.update(pois)
				.set(poiData)
				.where(
					and(eq(pois.id, Number(poiId)), eq(pois.centerId, Number(centerId))),
				)
				.returning()

			if (!updatedPoi) throw new ApiError(500, 'Error al actualizar el POI')

			// Registrar el cambio en el historial de trazabilidad
			await traceabilityService.logPoiAction(userId, updatedPoi.id, 'update', {
				oldValue: existingPoi,
				newValue: updatedPoi,
				reason: 'Actualización de POI',
			} as PoiDetails)

			return updatedPoi
		} catch (error: any) {
			const pgErrorCode = error?.code ?? error?.cause?.code
			if (pgErrorCode === '23505') {
				throw new ApiError(
					409,
					'Ya existe un POI con ese nombre en este centro',
				)
			}
			throw error
		}
	})
}

const getPoiHistory = async (poiId: string): Promise<any[]> => {
	return await db
		.select()
		.from(poiHistory)
		.where(eq(poiHistory.poiId, Number(poiId)))
}

export default {
	createPoi,
	getPoisByCenter,
	deletePoiByCenterAndId,
	getPoisByUserAndCenter,
	getPoisByCenterAndFuzzyName,
	getAllPois,
	updatePoi,
	getPoiHistory,
}
