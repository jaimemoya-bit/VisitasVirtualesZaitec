import { Router } from 'express'
import multer from 'multer'
import hasRole from '../middlewares/hasRole.ts'
import {
	abortMultipartHandler,
	completeMultipartHandler,
	getFileHandler,
	simpleUploadHandler,
	startMultipartHandler,
	uploadPartHandler,
} from '../controllers/storageController.ts'

const router = Router()
// Configurar multer para guardar partes de ficheros en memoria antes de subirlas a MinIO
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB por parte
})

/**
 * @openapi
 * /api/v1/upload:
 *   post:
 *     summary: Subir un fichero completo a MinIO
 *     tags:
 *       - Assets
 *     description: Sube un fichero completo a MinIO utilizando Multer para manejar la recepción del fichero. Este endpoint es adecuado para ficheros pequeños (hasta 10MB) y no requiere manejo de partes.
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
 *                 description: Fichero a subir (Máximo 10MB)
 *     responses:
 *       200:
 *         description: Fichero subido exitosamente, devuelve la URL de acceso al fichero
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito indicando que el fichero ha sido subido exitosamente
 *                 fileUrl:
 *                   type: string
 *                   description: URL pública para acceder al fichero subido (ej. "https://frontend.example.com/assets/550e8400-e29b-41d4-a716-446655440000.jpg")
 *       400:
 *         description: Fichero no proporcionado o inválido
 *       500:
 *         description: Error al subir el fichero
 */
router.post(
	'/upload',
	hasRole(['admin', 'teacher']),
	upload.single('file'),
	simpleUploadHandler,
)

/**
 * /api/v1/upload/init:
 *   post:
 *     summary: Iniciar subida multipart a MinIO
 *     tags:
 *       - Assets
 *     description: Solicita un uploadId para iniciar una subida multipart. El cliente debe proporcionar el nombre del fichero y su tipo MIME.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Nombre del fichero a subir (sin path)
 *               mimeType:
 *                 type: string
 *                 description: Tipo MIME del fichero (ej. image/jpeg)
 *     responses:
 *       200:
 *         description: uploadId generado correctamente, listo para recibir partes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito indicando que el uploadId se ha generado y la subida multipart está lista para recibir partes
 *                 uploadId:
 *                   type: string
 *                   description: Identificador de la subida multipart en curso
 *                 fileName:
 *                   type: string
 *                   description: Nombre del fichero limpiado para evitar colisiones o problemas de seguridad
 *       400:
 *         description: Faltan datos requeridos para iniciar subida multipart (fileName o mimeType)
 *       500:
 *         description: Error al iniciar la subida multipart
 */
router.post(
	'/upload/init',
	hasRole(['admin', 'teacher']),
	startMultipartHandler,
)

/**
 * /api/v1/upload/part:
 *   post:
 *     summary: Subir parte de un fichero a MinIO
 *     tags:
 *       - Upload
 *     description: Sube una parte de un fichero utilizando el uploadId generado previamente. El cliente debe proporcionar el nombre del fichero, el uploadId, el número de parte y el contenido de la parte. fileName es obtenido mediante uploadId gracias al map uploadIdSanitizedFileNameMap.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Identificador de la subida multipart en curso
 *               partNumber:
 *                 type: integer
 *                 description: Número de parte (comenzando en 1)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Contenido de la parte (Máximo 10MB)
 *     responses:
 *       200:
 *         description: Parte ${partNumber} subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 etag:
 *                   type: string
 *                   description: eTag de la parte subida, necesario para completar la subida multipart
 *       400:
 *         description: Faltan datos requeridos para subir la parte (fileName, mimeType, buffer, uploadId o partNumber)
 *       500:
 *         description: Error al procesar parte de subida multipart
 */
// Subir parte (multer intercepta la parte y la pone en req.file.buffer)
router.post(
	'/upload/part',
	hasRole(['admin', 'teacher']),
	upload.single('file'),
	uploadPartHandler,
)

/**
 * /api/v1/upload/abort:
 *   post:
 *     summary: Cancelar una subida multipart en curso
 *     tags:
 *       - Upload
 *     description: Cancela una subida multipart utilizando el uploadId. Esto eliminará cualquier parte subida y limpiará los recursos asociados a esa subida multipart en MinIO. fileName es obtenido mediante uploadId gracias al map uploadIdSanitizedFileNameMap.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Identificador de la subida multipart en curso que se desea cancelar
 *     responses:
 *       200:
 *         description: Subida multipart cancelada y recursos limpiados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito indicando que la subida multipart ha sido cancelada y los recursos asociados han sido limpiados
 *       400:
 *         description: Faltan datos requeridos (fileName o uploadId)
 *       500:
 *         description: Error al cancelar la subida multipart
 */
router.post(
	'/upload/abort',
	hasRole(['admin', 'teacher']),
	abortMultipartHandler,
)

/**
 * /api/v1/upload/complete:
 *   post:
 *     summary: Completar una subida multipart
 *     tags:
 *       - Upload
 *     description: Completa una subida multipart utilizando el uploadId y la lista de partes subidas. Esto unirá todas las partes en MinIO y hará que el fichero esté disponible para su acceso. fileName es obtenido mediante uploadId gracias al map uploadIdSanitizedFileNameMap
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Identificador de la subida multipart en curso que se desea completar
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     partNumber:
 *                       type: integer
 *                       description: Número de parte (comenzando en 1)
 *                     etag:
 *                       type: string
 *                       description: eTag de la parte subida, obtenido al subir cada parte, necesario para completar la subida multipart
 *     responses:
 *       200:
 *         description: Subida multipart completada y fichero disponible para acceso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito indicando que la subida multipart ha sido completada y el fichero está disponible para acceso
 *                 url:
 *                   type: string
 *                   example: "https://frontend.example.com/api/v1/assets/550e8400-e29b-41d4-a716-446655440000.jpg"
 *       400:
 *         description: Faltan datos requeridos (fileName, uploadId o parts)
 *       500:
 *         description: Error al completar subida multipart
 */
router.post(
	'/upload/complete',
	hasRole(['admin', 'teacher']),
	completeMultipartHandler,
)

/**
 * @openapi
 * /api/v1/assets/{fileName}:
 *   get:
 *     summary: Obtener imagen desde MinIO (proxy)
 *     tags:
 *       - Assets
 *     description: Obtiene una imagen almacenada en MinIO y la transmite al cliente.
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del fichero a obtener (ej. "550e8400-e29b-41d4-a716-446655440000.jpg")
 *     responses:
 *       200:
 *         description: Imagen obtenida exitosamente, se transmite el contenido de la imagen con los headers adecuados
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagen no encontrada en MinIO
 *       500:
 *         description: Error al obtener la imagen desde MinIO
 */
// Obtener imagen (proxy)
router.get('/assets/:fileName', getFileHandler)

export default router
