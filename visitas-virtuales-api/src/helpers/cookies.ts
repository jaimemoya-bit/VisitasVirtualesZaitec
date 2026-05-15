import assert from 'node:assert'

/**
 * Convierte un token en opciones para una cookie HTTP-only
 * @param {string} token - El token que se va a almacenar en la cookie
 * @returns {object} Opciones para configurar la cookie HTTP-only
 */
export const getHttpOnlyCookieOptions = () => {
	return {
		httpOnly: true,
		// Permitir HTTP solo en desarrollo
		secure: process.env.NODE_ENV === 'production',
		// Proteger contra CSRF
		sameSite: 'strict',
		path: '/',
		maxAge:
			Number(process.env.JWT_REFRESH_TOKEN_TTL!.replace(/\D+$/, '')) *
			24 *
			60 *
			60 *
			1000,
	} as const
}
