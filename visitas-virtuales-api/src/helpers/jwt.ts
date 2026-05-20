import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '../env.ts'

interface TokenPayload extends JWTPayload {
	sub: string
	role: string
}

const secret = new TextEncoder().encode(env.JWT_SECRET)
const alg = 'HS256'

const generateToken = async (
	sub: string | number,
	role: string,
	ttl: string,
): Promise<string> => {
	const payload = {
		sub: String(sub),
		role,
	}

	return await new SignJWT(payload)
		.setProtectedHeader({ alg })
		.setIssuer(env.JWT_ISSUER)
		.setIssuedAt()
		.setAudience(env.JWT_AUDIENCE)
		.setExpirationTime(ttl)
		.sign(secret)
}

export const generateAccessToken = (sub: string | number, role: string) => {
	return generateToken(sub, role, env.JWT_ACCESS_TOKEN_TTL)
}

export const generateRefreshToken = (sub: string | number, role: string) => {
	return generateToken(sub, role, env.JWT_REFRESH_TOKEN_TTL)
}

export const verifyToken = async (token: string) => {
	try {
		const { payload } = await jwtVerify(token, secret, {
			issuer: env.JWT_ISSUER,
			audience: env.JWT_AUDIENCE,
		})
		return { payload: payload as TokenPayload }
	} catch (e: any) {
		console.error('Error verificando token JWT:', e)
		throw new Error('Token inválido o expirado: ' + e.message)
	}
}

export const getGuestUser = (): TokenPayload => ({
	sub: '0',
	role: 'guest',
})
