import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { db } from '../db/db.ts'
import { generateAccessToken, generateRefreshToken } from '../helpers/jwt.ts'
import { userInsertSchema, users } from '../db/schema.ts'
import type {
	UserRegisterType,
	UserLoginType,
	UserProfileType,
	TokenResponseType,
	UpdateCurrUserProfileType,
} from '../db/schema.ts'
import { env } from '../env.ts'
import { ApiError } from '../middlewares/errorHandler.ts'

const register = async (
	userRegisterRequest: UserRegisterType['body'],
): Promise<void> => {
	const { email, username, password, role } = userRegisterRequest

	const [existingUser] = await db
		.select()
		.from(users)
		.where(or(eq(users.email, email), eq(users.username, username)))
		.limit(1)

	if (existingUser) {
		throw new ApiError(409, 'El email o el nombre de usuario ya están en uso')
	}

	const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

	const userToInsert = userInsertSchema.omit({ id: true }).parse({
		email,
		username,
		password: hashedPassword,
		role: role || 'guest',
	})

	const [newUser] = await db.insert(users).values(userToInsert).returning()

	if (!newUser) {
		throw new ApiError(500, 'Error al registrar el usuario')
	}
}

const login = async (
	userLoginRequest: UserLoginType['body'],
): Promise<TokenResponseType> => {
	const { email, username, password } = userLoginRequest

	const [existingUser] = await db
		.select()
		.from(users)
		.where(email ? eq(users.email, email) : eq(users.username, username!))
		.limit(1)

	if (!existingUser) {
		throw new ApiError(401, 'Credenciales inválidas')
	}

	const passwordMatch = await bcrypt.compare(password, existingUser.password)

	if (!passwordMatch) {
		throw new ApiError(401, 'Credenciales inválidas')
	}

	const tokenPair = {
		accessToken: await generateAccessToken(existingUser.id, existingUser.role),
		refreshToken: await generateRefreshToken(
			existingUser.id,
			existingUser.role,
		),
	}

	if (!tokenPair.accessToken || !tokenPair.refreshToken) {
		throw new ApiError(500, 'Error al generar los tokens de autenticación')
	}

	return tokenPair
}

const getUserProfile = async (sub: number): Promise<UserProfileType> => {
	const [userProfile] = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			role: users.role,
			imageUrl: users.imageUrl,
			centerPreferenceId: users.centerPreferenceId,
		})
		.from(users)
		.where(eq(users.id, sub))
		.limit(1)

	if (!userProfile) {
		throw new ApiError(404, 'Usuario no encontrado')
	}

	return userProfile
}

const updateUser = async (
	userId: number,
	updateData: UpdateCurrUserProfileType['body'],
): Promise<UserProfileType> => {
	const { currentPassword, newPassword, ...dataToUpdate } = updateData
	let newPasswordHash: string | undefined

	if (dataToUpdate.imageUrl === '') {
		dataToUpdate.imageUrl = null
	}

	// Si se proporciona una nueva contraseña sin la contraseña actual, se lanza un error de validación
	if (newPassword && !currentPassword) {
		throw new ApiError(
			400,
			'Se requiere la contraseña actual para establecer una nueva',
		)
	}

	// Si se proporciona una nueva contraseña, se verifica que la contraseña actual sea correcta antes de actualizar
	if (newPassword) {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (!user) throw new ApiError(404, 'Usuario no encontrado')

		const isMatch = await bcrypt.compare(currentPassword!, user.password)
		if (!isMatch) throw new ApiError(401, 'La contraseña actual es incorrecta')

		// Hashear la nueva contraseña antes de actualizar el registro del usuario
		newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)
	}
	const dataToUpdateWithPassword = newPasswordHash
		? { ...dataToUpdate, password: newPasswordHash }
		: dataToUpdate

	const [updatedUser] = await db
		.update(users)
		.set(dataToUpdateWithPassword)
		.where(eq(users.id, userId))
		.returning({
			id: users.id,
			email: users.email,
			username: users.username,
			role: users.role,
			imageUrl: users.imageUrl,
			centerPreferenceId: users.centerPreferenceId,
		})

	if (!updatedUser) {
		throw new ApiError(404, 'Usuario no encontrado')
	}

	return updatedUser
}

export default {
	register,
	login,
	getUserProfile,
	updateUser,
}
