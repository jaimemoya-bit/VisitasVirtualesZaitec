import { asc, eq, gt } from 'drizzle-orm'
import { db } from '../db/db.ts'
import { type Center, centers, type CenterUpdateType } from '../db/schema.ts'
import { ApiError } from '../middlewares/errorHandler.ts'

const getAllCenters = async (
	limit?: number,
	lastId?: number,
): Promise<Center[]> => {
	return await db
		.select({
			id: centers.id,
			name: centers.name,
			description: centers.description,
			location: centers.location,
			imageUrl: centers.imageUrl,
			createdAt: centers.createdAt,
			updatedAt: centers.updatedAt,
		})
		.from(centers)
		.where(lastId ? gt(centers.id, lastId) : undefined)
		.orderBy(asc(centers.id))
		.limit(limit ?? 10)
}

const updateCenter = async (
	id: number,
	updateData: CenterUpdateType['body'],
): Promise<Center> => {
	const { name, description, location, imageUrl } = updateData

	// Comprobar si el centro existe antes de intentar actualizarlo
	const [existingCenter] = await db
		.select()
		.from(centers)
		.where(eq(centers.id, id))
		.limit(1)

	if (!existingCenter) {
		throw new ApiError(404, 'Centro no encontrado')
	}

	const [updatedCenter] = await db
		.update(centers)
		.set({
			name,
			description,
			location,
			imageUrl,
		})
		.where(eq(centers.id, id))
		.returning({
			id: centers.id,
			name: centers.name,
			description: centers.description,
			location: centers.location,
			imageUrl: centers.imageUrl,
			createdAt: centers.createdAt,
			updatedAt: centers.updatedAt,
		})

	if (!updatedCenter) {
		throw new ApiError(404, 'Error al actualizar el centro')
	}

	return updatedCenter
}

export const updateCenterImage = async (
	id: number,
	validData: CenterUpdateType['body'],
): Promise<Center> => {
	const { imageUrl } = validData

	// Comprobar si el centro existe antes de intentar actualizarlo
	const [existingCenter] = await db
		.select()
		.from(centers)
		.where(eq(centers.id, id))
		.limit(1)

	if (!existingCenter) {
		throw new ApiError(404, 'Centro no encontrado')
	}

	const [updatedCenter] = await db
		.update(centers)
		.set({
			imageUrl,
		})
		.where(eq(centers.id, id))
		.returning({
			id: centers.id,
			name: centers.name,
			description: centers.description,
			location: centers.location,
			imageUrl: centers.imageUrl,
			createdAt: centers.createdAt,
			updatedAt: centers.updatedAt,
		})

	if (!updatedCenter) {
		throw new ApiError(404, 'Error al actualizar la imagen del centro')
	}

	return updatedCenter
}

export default {
	getAllCenters,
	updateCenter,
	updateCenterImage,
}
