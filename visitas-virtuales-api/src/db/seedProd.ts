import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { users, centers, pois } from './schema.ts'
import type { UserInsertType, PoiInsertType } from './schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'
import { env } from '../env.ts'
import bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle({ client: pool })

async function main() {
	try {
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

		// Insertar centros solo si no existen, para poder ejecutar el seed múltiples veces sin duplicados
		let insertedCenters = await db.select().from(centers)
		if (insertedCenters.length === 0) {
			insertedCenters = await db.insert(centers).values(mockCenters).returning()
			console.log('Centros de demo insertados correctamente.')
		} else {
			console.log(
				'Los centros de demo ya existen. No se han insertado duplicados.',
			)
		}

		let insertedUsers: { id: number; username: string }[] = []

		// Insertar primer usuario admin solo si no existe, usando las credenciales definidas en las variables de entorno
		const existingAdmin = await db
			.select()
			.from(users)
			.where(eq(users.email, env.ADMIN_EMAIL))
			.limit(1)
		if (existingAdmin.length === 0) {
			const adminPassword = await bcrypt.hash(
				env.ADMIN_PASSWORD,
				env.BCRYPT_ROUNDS,
			)
			const mockUserData: UserInsertType[] = [
				{
					email: env.ADMIN_EMAIL,
					username: env.ADMIN_EMAIL.split('@')[0]!,
					password: adminPassword,
					role: 'admin',
					imageUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${env.ADMIN_EMAIL}`,
					centerPreferenceId: insertedCenters[0]?.id,
				},
			]
			insertedUsers = await db
				.insert(users)
				.values(mockUserData)
				.returning({ id: users.id, username: users.username })
		} else {
			// Reutilizar el admin existente para asignar los POIs
			insertedUsers = existingAdmin.map((u) => ({
				id: u.id,
				username: u.username,
			}))
			console.log(
				`El usuario admin con email ${env.ADMIN_EMAIL} ya existe. No se ha insertado un duplicado.`,
			)
		}

		// Insertar POIs de demo (P1-P8) para cada centro, asignados al admin
		// Solo se insertan si el centro no tiene POIs todavía
		const adminUser = insertedUsers[0]
		if (!adminUser) {
			throw new Error(
				'No se pudo obtener el usuario admin para asignar los POIs.',
			)
		}

		const mockPois: PoiInsertType[] = []
		for (const center of insertedCenters) {
			const existingPois = await db
				.select()
				.from(pois)
				.where(eq(pois.centerId, center.id))
				.limit(1)
			if (existingPois.length > 0) {
				console.log(
					`El centro "${center.name}" ya tiene POIs. No se han insertado duplicados.`,
				)
				continue
			}
			for (let j = 1; j <= 8; j++) {
				mockPois.push({
					name: `P${j}`,
					details: { description: `Descripción de P${j}` },
					centerId: center.id,
					userId: adminUser.id,
				})
			}
		}

		if (mockPois.length > 0) {
			await db.insert(pois).values(mockPois)
		}

		console.log(
			`Seed completado. Puedes iniciar sesión con el email ${env.ADMIN_EMAIL} y la contraseña definida en ADMIN_PASSWORD.`,
		)
		process.exit(0)
	} catch (error) {
		console.error('Error al ejecutar el seed:', error)
		process.exit(1)
	}
}

void main()
