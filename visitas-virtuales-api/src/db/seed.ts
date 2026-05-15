import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { users, centers, pois } from './schema.ts'
import type { UserInsertType, PoiInsertType } from './schema.ts'
import 'dotenv/config'
import { env } from '../env.ts'
import bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle({ client: pool })

async function main() {
	try {
		// Limpiar datos previos para poder ejecutar seed múltiples veces sin conflictos
		await db.delete(pois)
		await db.delete(users)
		await db.delete(centers)
		await db.execute('ALTER SEQUENCE users_id_seq RESTART WITH 1')
		await db.execute('ALTER SEQUENCE centers_id_seq RESTART WITH 1')
		await db.execute('ALTER SEQUENCE pois_id_seq RESTART WITH 1')

		// Insertar centros de prueba primero
		const mockCenters = [
			{
				name: 'Instituto Madrid',
				description: 'Centro educativo en Madrid',
				location: 'Madrid, España',
				imageUrl: 'https://img.rtve.es/v/16750785/',
			},
			{
				name: 'Instituto Pacífico',
				description: 'Centro educativo en Málaga',
				location: 'Málaga, España',
				imageUrl:
					'https://medac.es/sites/default/files/images/centro/img_centros_pacifico_hero_XL%402x.jpg',
			},
			{
				name: 'Instituto Jerez',
				description: 'Centro educativo en Jerez',
				location: 'Jerez, España',
				imageUrl:
					'https://www.rivasciudad.es/wp-content/uploads/2023/04/EUROPA.png',
			},
			{
				name: 'Instituto Córdoba',
				description: 'Centro educativo en Córdoba',
				location: 'Córdoba, España',
				imageUrl:
					'https://s1.ppllstatics.com/leonoticias/www/multimedia/2025/01/24/giner-kLOI-U230657693664b3D-1200x840@Leonoticias.jpg',
			},
		]
		const insertedCenters = await db
			.insert(centers)
			.values(mockCenters)
			.returning()

		// Insertar usuarios de prueba
		const adminPassword = await bcrypt.hash('Admin123!', env.BCRYPT_ROUNDS)
		const teacherPassword = await bcrypt.hash('Profe123!', env.BCRYPT_ROUNDS)

		const mockUserData: UserInsertType[] = [
			{
				email: 'admin_pac@instituto.es',
				username: 'admin_pac',
				password: adminPassword,
				role: 'admin',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=admin_pac@instituto.es',
				centerPreferenceId: insertedCenters[0]?.id,
			},
			{
				email: 'admin_jer@instituto.es',
				username: 'admin_jer',
				password: adminPassword,
				role: 'admin',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=admin_jer@instituto.es',
				centerPreferenceId: insertedCenters[1]?.id,
			},
			{
				email: 'admin_cor@instituto.es',
				username: 'admin_cor',
				password: adminPassword,
				role: 'admin',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=admin_cor@instituto.es',
				centerPreferenceId: insertedCenters[2]?.id,
			},
			{
				email: 'admin_mad@instituto.es',
				username: 'admin_mad',
				password: adminPassword,
				role: 'admin',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=admin_mad@instituto.es',
				centerPreferenceId: insertedCenters[3]?.id,
			},
			{
				email: 'profesor_pac@instituto.es',
				username: 'prof_pac',
				password: teacherPassword,
				role: 'teacher',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=profesor_pac@instituto.es',
				centerPreferenceId: insertedCenters[0]?.id,
			},
			{
				email: 'profesor_jer@instituto.es',
				username: 'prof_jer',
				password: teacherPassword,
				role: 'teacher',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=profesor_jer@instituto.es',
				centerPreferenceId: insertedCenters[1]?.id,
			},
			{
				email: 'profesor_cor@instituto.es',
				username: 'prof_cor',
				password: teacherPassword,
				role: 'teacher',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=profesor_cor@instituto.es',
				centerPreferenceId: insertedCenters[2]?.id,
			},
			{
				email: 'profesor_mad@instituto.es',
				username: 'prof_mad',
				password: teacherPassword,
				role: 'teacher',
				imageUrl:
					'https://api.dicebear.com/9.x/identicon/svg?seed=profesor_mad@instituto.es',
				centerPreferenceId: insertedCenters[3]?.id,
			},
		]
		const insertedUsers: { id: number; username: string }[] = await db
			.insert(users)
			.values(mockUserData)
			.returning({ id: users.id, username: users.username })

		const usersByUsername = Object.fromEntries(
			insertedUsers.map((u) => [u.username, u]),
		)

		// Insertar POIs de prueba: P1-P8 para cada centro
		const centerUsernames = [
			{ admin: 'admin_pac', teacher: 'prof_pac' },
			{ admin: 'admin_jer', teacher: 'prof_jer' },
			{ admin: 'admin_cor', teacher: 'prof_cor' },
			{ admin: 'admin_mad', teacher: 'prof_mad' },
		]
		const mockPois: PoiInsertType[] = []
		for (let i = 0; i < insertedCenters.length; i++) {
			const center = insertedCenters[i]!
			const usernames = centerUsernames[i]
			for (let j = 1; j <= 8; j++) {
				mockPois.push({
					name: `P${j}`,
					details: { description: `Descripción de P${j}` },
					centerId: center.id,
					userId:
						j === 1
							? usersByUsername[usernames!.teacher]!.id
							: usersByUsername[usernames!.admin]!.id,
				})
			}
		}
		await db.insert(pois).values(mockPois)

		console.log('Datos de prueba insertados correctamente.')
		process.exit(0)
	} catch (error) {
		console.error('Error al insertar datos de prueba:', error)
		process.exit(1)
	}
}

void main()
