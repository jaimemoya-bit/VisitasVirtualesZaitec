import type { Request, Response } from 'express'
import centerService from '../services/centerService.ts'
import storageService from '../services/storageService.ts'
import { asyncHandler } from '../middlewares/asyncHandler.ts'
import type { ValidAuthenticatedRequest } from '../middlewares/validation.ts'
import type {
	centerImageUpdateSchema,
	centerUpdateSchema,
} from '../db/schema.ts'
import { env } from '../env.ts'

// Listar todos los centros
export const getAllCentersHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData } = req as ValidAuthenticatedRequest
		const { limit, lastId } = validData.query
		const centers = await centerService.getAllCenters(limit, lastId)
		if (centers.length === 0) {
			return res
				.status(200)
				.json({ message: 'No se encontraron centros', centers: [] })
		}
		return res.json({
			message: 'Centros obtenidos exitosamente',
			centers: centers,
		})
	},
)

// Actualizar un centro
export const updateCenterHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData } = req as ValidAuthenticatedRequest<
			typeof centerUpdateSchema
		>
		const { id } = validData.params
		const updatedCenter = await centerService.updateCenter(id, validData.body)

		return res.json({
			message: 'Centro actualizado exitosamente',
			center: updatedCenter,
		})
	},
)

// Actualizar imagen de un centro
export const updateCenterImageHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const { validData } = req as ValidAuthenticatedRequest<
			typeof centerImageUpdateSchema
		>
		const { id } = validData.params

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
		const fileUrl = `${env.API_BASE_URL}/api/${env.API_VERSION}/assets/${sanitizedFileName}`
		// Actualizar el centro con la nueva URL de la imagen
		const updatedCenter = await centerService.updateCenterImage(id, {
			imageUrl: fileUrl,
		})

		return res.json({
			message: 'Imagen del centro actualizada exitosamente',
			center: updatedCenter,
		})
	},
)
