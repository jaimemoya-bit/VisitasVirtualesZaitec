import * as Minio from 'minio'
import { env } from '../env.ts'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const minioClient = new Minio.Client({
	endPoint: env.MINIO_ENDPOINT,
	port: env.MINIO_PORT,
	useSSL: env.MINIO_USE_SSL,
	accessKey: env.MINIO_ROOT_USER,
	secretKey: env.MINIO_ROOT_PASSWORD,
	pathStyle: true,
})

// Una sola región y bucket para toda la app, gestionados por este servicio
class MinioService {
	private bucketName: string

	constructor() {
		this.bucketName = env.MINIO_BUCKET_NAME
	}

	async verifyConnection() {
		try {
			await minioClient.bucketExists(this.bucketName)
		} catch (error) {
			throw new Error(
				`Error de conexión al almacenamiento (MinIO)`,
			)
		}
	}

	async init() {
		console.log('Inicializando MinIO blob storage...')
		await this.ensureBucketExists()
		console.log('MinIO inicializado y listo para usar')
	}

	// Verificar que el bucket existe, si no, crearlo
	// Usamos arrow functions para preservar el contexto de "this"
	ensureBucketExists = async () => {
		const exists = await minioClient.bucketExists(this.bucketName)
		if (!exists) {
			await minioClient.makeBucket(this.bucketName, 'default')
			console.log(`Bucket "${this.bucketName}" creado exitosamente`)
		} else {
			console.log(`Bucket "${this.bucketName}" encontrado`)
		}
	}

	// Iniciar subida simple de un fichero completo (Multer proporciona el buffer completo del fichero en memoria)
	simpleUpload = async (fileName: string, mimeType: string, buffer: Buffer) => {
		const sanitizedFileName = await this.sanitizeFileName(fileName)
		await minioClient.putObject(
			this.bucketName,
			sanitizedFileName,
			buffer,
			buffer.length,
			{
				'Content-Type': mimeType,
			},
		)
		return sanitizedFileName
	}

	// Iniciar subida de fichero por partes. El frontend necesita enviar el nombre y tipo MIME del fichero
	startMultipart = async (fileName: string, mimeType: string) => {
		const uploadId = await minioClient.initiateNewMultipartUpload(
			this.bucketName,
			fileName,
			{ 'Content-Type': mimeType },
		)
		return uploadId
	}

	// Subir una parte del fichero. El frontend envía el uploadId obtenido en startMultipart, el número de parte (1...n)
	// Multer se encarga de recibir la parte como buffer en memoria (req.file.buffer)
	uploadPart = async (
		fileName: string,
		uploadId: string,
		partNumber: number,
		buffer: Buffer,
	) => {
		const result = await minioClient.uploadPart(
			{
				bucketName: this.bucketName,
				objectName: fileName,
				uploadID: uploadId,
				partNumber: partNumber,
				headers: {},
			},
			buffer,
		)

		return {
			etag: result.etag,
			partNumber: result.part,
		}
	}

	// Unir partes (usando lista de etags) y finalizar la subida
	completeMultipart = async (
		fileName: string,
		uploadId: string,
		parts: { partNumber: number; etag: string }[],
	) => {
		if (!parts || parts.length === 0) {
			throw new Error('No se proporcionaron partes para completar la subida.')
		}

		const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber)

		try {
			const result = await minioClient.completeMultipartUpload(
				this.bucketName,
				fileName,
				uploadId,
				sortedParts.map((p) => ({ part: p.partNumber, etag: p.etag })),
			)
			return result
		} catch (e) {
			console.error('Error al completar subida multipart:', e)
			throw e
		}
	}

	// Cancelar subida multipart
	abortMultipart = async (fileName: string, uploadId: string) => {
		await minioClient.abortMultipartUpload(this.bucketName, fileName, uploadId)
	}

	// Limpiar nombre de fichero
	sanitizeFileName = async (fileName: string) => {
		const ext = path.extname(fileName)
		const uniqueId = randomUUID()
		return `${uniqueId}${ext}`
	}

	// Obtener stream de imagen para servir al cliente
	getImageStream = async (fileName: string) => {
		const stat = await minioClient.statObject(this.bucketName, fileName)
		const stream = await minioClient.getObject(this.bucketName, fileName)

		return {
			stream,
			contentType: stat.metaData['content-type'] || 'image/jpeg',
			size: stat.size,
		}
	}
}

const storageService = new MinioService()
export default storageService
