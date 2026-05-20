export const UPLOAD_TTL_MS = 60 * 60 * 1000

export default function uploadCleanupJob(
	minioServiceParam: any,
	uploadIdMap: Map<string, { filename: string; createdAt: number }>,
	ttl_ms: number,
) {
	let intervalId: NodeJS.Timeout | null = null

	return {
		start: () => {
			intervalId = setInterval(() => {
				const now = Date.now()
				for (const [uploadId, entry] of uploadIdMap) {
					if (now - entry.createdAt > ttl_ms) {
						uploadIdMap.delete(uploadId)
						minioServiceParam
							.abortMultipart(entry.filename, uploadId)
							.catch((e: Error) => {
								console.error(
									`Error al cancelar subida multipart para uploadId ${uploadId} durante limpieza periódica:`,
									e,
								)
							})
					}
				}
			}, ttl_ms)
			console.log('Iniciado job de limpieza de subidas');
		},
		stop: () => {
			if (intervalId) clearInterval(intervalId)
			console.log('Deteniendo job de limpieza de subidas');
		},
	}
}
