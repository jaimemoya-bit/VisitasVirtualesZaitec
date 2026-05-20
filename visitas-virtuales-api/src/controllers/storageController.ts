import type { Request, Response } from 'express'
import storageService from '../services/storageService.ts'
import { env } from '../env.ts'

const assetUrlTemplate = (fileName: string) =>
	`${env.API_BASE_URL}/api/${env.API_VERSION}/assets/${fileName}`

// Limpiar el map periódicamente para evitar memory leaks en caso de subidas iniciadas pero nunca completadas
export const uploadIdMap = new Map<
	string,
	{ filename: string; createdAt: number }
>()

export const simpleUploadHandler = async (req: Request, res: Response) => {
	// Derivar nombre, tipo MIME y buffer del fichero interceptado por Multer
	const fileName = req.file?.originalname
	const mimeType = req.file?.mimetype
	const buffer = req.file?.buffer

	if (!fileName || !mimeType || !buffer) {
		return res
			.status(400)
			.json({ error: 'Fichero no proporcionado o inválido.' })
	}

	try {
		const sanitizedFileName = await storageService.simpleUpload(
			fileName,
			mimeType,
			buffer,
		)
		// Construir la URL pública del fichero subido
		res.json({
			message: 'Fichero subido exitosamente.',
			assetUrl: assetUrlTemplate(sanitizedFileName),
		})
	} catch (e) {
		console.error('Error subiendo el fichero:', e)
		res.status(500).json({ error: 'Error subiendo el fichero.' })
	}
}

export const startMultipartHandler = async (req: Request, res: Response) => {
	const { fileName, mimeType } = req.body

	if (!fileName || !mimeType) {
		return res.status(400).json({
			error:
				'Faltan datos requeridos para iniciar subida multipart (fileName o mimeType).',
		})
	}

	try {
		const sanitizedFileName = await storageService.sanitizeFileName(fileName)
		const uploadId = await storageService.startMultipart(
			sanitizedFileName,
			mimeType,
		)
		uploadIdMap.set(uploadId, {
			filename: sanitizedFileName,
			createdAt: Date.now(),
		})
		res.json({
			message: 'uploadId generado exitosamente, listo para recibir partes',
			uploadId,
			fileName: sanitizedFileName,
		})
	} catch (e) {
		console.error('Error al iniciar subida multipart:', e)
		res.status(500).json({ error: 'Error al iniciar subida multipart.' })
	}
}

export const uploadPartHandler = async (req: Request, res: Response) => {
	const buffer = req.file?.buffer
	const { mimeType, uploadId, partNumber } = req.body
	const fileName = uploadIdMap.get(uploadId)?.filename
	if (!fileName || !mimeType || !buffer || !uploadId || !partNumber) {
		return res.status(400).json({
			error:
				'Faltan datos requeridos para subir la parte (fileName, mimeType, buffer, uploadId o partNumber).',
		})
	}

	try {
		const partData = await storageService.uploadPart(
			fileName,
			uploadId,
			parseInt(partNumber),
			buffer,
		)
		res.json({
			message: `Parte ${partNumber} subida exitosamente`,
			etag: partData.etag, // Devolver el etag de la parte para su uso en la finalización de la subida
		})
	} catch (e) {
		console.error('Error al procesar parte de subida multipart:', e)
		res
			.status(500)
			.json({ error: 'Error al procesar parte de subida multipart' })
	}
}

export const abortMultipartHandler = async (req: Request, res: Response) => {
	const { uploadId } = req.body
	const fileName = uploadIdMap.get(uploadId)?.filename
	if (!fileName || !uploadId) {
		return res.status(400).json({ error: 'fileName y uploadId son requeridos' })
	}
	try {
		await storageService.abortMultipart(fileName, uploadId)
		uploadIdMap.delete(uploadId) // Limpiar el map para evitar memory leaks
		res.json({ message: 'Subida cancelada' })
	} catch (e) {
		res.status(500).json({ error: 'Error al cancelar subida' })
	}
}

export const completeMultipartHandler = async (req: Request, res: Response) => {
	const { uploadId, parts } = req.body
	const fileName = uploadIdMap.get(uploadId)?.filename
	if (!fileName || !uploadId || !parts || !Array.isArray(parts)) {
		return res
			.status(400)
			.json({ error: 'Faltan datos requeridos (fileName, uploadId o parts)' })
	}
	try {
		await storageService.completeMultipart(fileName, uploadId, parts)
		uploadIdMap.delete(uploadId) // Limpiar el map para evitar memory leaks
		// Proporcionar URL de acceso al fichero subido
		res.json({
			message: 'Subida multipart completada',
			assetUrl: assetUrlTemplate(fileName),
		})
	} catch (e) {
		console.error('Error al completar subida multipart:', e)
		res.status(500).json({ error: 'Error al completar subida multipart' })
	}
}

export const getFileHandler = async (req: Request, res: Response) => {
	const fileName = req.params.fileName as string
	if (!fileName) {
		return res.status(400).json({ error: 'fileName es requerido' })
	}
	try {
		const { stream, contentType, size } =
			await storageService.getImageStream(fileName)

		// Configurar headers de respuesta
		res.setHeader('Content-Type', contentType)
		res.setHeader('Content-Length', size)

		// Indicar que el nombre del fichero es immutable
		res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

		// Manejar errores para evitar leaks de memoria si el stream falla (cerrar socket de red hacia MinIO)
		stream.on('error', (err) => {
			console.error('Error en el stream de MinIO:', err)
			if (!res.headersSent) {
				res.status(500).send('Error al transmitir la imagen')
			}
		})

		// Enviar el stream al cliente
		stream.pipe(res)
	} catch (e) {
		console.error('Error al obtener imagen:', e)
		res.status(404).json({ error: 'Imagen no encontrada' })
	}
}
