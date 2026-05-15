import { relations } from 'drizzle-orm'
import {
	pgTable,
	integer,
	text,
	serial,
	timestamp,
	jsonb,
	pgEnum,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'

export const centers = pgTable('centers', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description'),
	location: text('location').notNull(),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
})

export const userRolesArray = ['admin', 'teacher', 'guest'] as const
export const userRoles = pgEnum('user_roles', userRolesArray)

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: text('email').notNull().unique(),
	username: text('username').notNull().unique(),
	password: text('password').notNull(),
	role: userRoles('role').notNull().default('guest'),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	centerPreferenceId: integer('center_preference_id').references(
		() => centers.id,
		{ onDelete: 'set null' },
	),
})

export const pois = pgTable(
	'pois',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull(),
		details: jsonb('details').notNull(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		centerId: integer('center_id')
			.notNull()
			.references(() => centers.id, { onDelete: 'cascade' }),
	},
	(t) => [uniqueIndex('pois_name_center_unique').on(t.name, t.centerId)],
)

export const stats = pgTable('stats', {
	id: serial('id').primaryKey(),
	event_type: text('event_type').notNull(),
	event_count: integer('event_count').notNull().default(0),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
})

export const statsUsers = pgTable('stats_users', {
	id: serial('id').primaryKey(),
	stat_id: integer('stat_id')
		.notNull()
		.references(() => stats.id, { onDelete: 'cascade' }),
	user_id: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
})

export const statsPois = pgTable('stats_pois', {
	id: serial('id').primaryKey(),
	stat_id: integer('stat_id')
		.notNull()
		.references(() => stats.id, { onDelete: 'cascade' }),
	poi_id: integer('poi_id')
		.notNull()
		.references(() => pois.id, { onDelete: 'cascade' }),
})

//tabla de trazabilidad
export type PoiDetails = {
	oldValue?: any
	newValue?: any
	reason?: string
}
export const poiHistory = pgTable('poi_history', {
	id: serial('id').primaryKey(),
	poiId: integer('poi_id').notNull(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	action: text('action').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	details: jsonb('details').$type<PoiDetails>().notNull(),
})

/* Definir relaciones entre tablas para permitir a Drizzle simplificar 
   consultas con joins */

// Un centro tiene muchos usuarios y muchos POIs
export const centerRelations = relations(centers, ({ many }) => ({
	pois: many(pois),
}))

// Un usuario puede tener muchos POIs y estadísticas
export const userRelations = relations(users, ({ many }) => ({
	pois: many(pois),
	stats: many(statsUsers),
}))

// Un POI pertenece a un centro y a un usuario, y puede tener muchas estadísticas
export const poiRelations = relations(pois, ({ one, many }) => ({
	center: one(centers, {
		fields: [pois.centerId],
		references: [centers.id],
	}),
	user: one(users, {
		fields: [pois.userId],
		references: [users.id],
	}),
	stats: many(statsPois),
}))

// Una estadística puede estar relacionada con muchos usuarios y muchos POIs
export const statRelations = relations(stats, ({ many }) => ({
	users: many(statsUsers),
	pois: many(statsPois),
}))

// Cada entrada en stats_users relaciona una estadística con un usuario específico
export const statsUsersRelations = relations(statsUsers, ({ one }) => ({
	stat: one(stats, {
		fields: [statsUsers.stat_id],
		references: [stats.id],
	}),
	user: one(users, {
		fields: [statsUsers.user_id],
		references: [users.id],
	}),
}))

// Cada entrada en stats_pois relaciona una estadística con un POI específico
export const statsPoisRelations = relations(statsPois, ({ one }) => ({
	stat: one(stats, {
		fields: [statsPois.stat_id],
		references: [stats.id],
	}),
	poi: one(pois, {
		fields: [statsPois.poi_id],
		references: [pois.id],
	}),
}))

export const poiHistoryRelations = relations(poiHistory, ({ one }) => ({
	poi: one(pois, {
		fields: [poiHistory.poiId],
		references: [pois.id],
	}),
	user: one(users, {
		fields: [poiHistory.userId],
		references: [users.id],
	}),
}))

/* Derivar tipos a partir de las tablas */
export type Center = typeof centers.$inferSelect
export type User = typeof users.$inferSelect
export type Poi = typeof pois.$inferSelect
export type Stat = typeof stats.$inferSelect

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{6,24}$/
const PASSWORD_PATTERN =
	/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,32}$/

/* Exportar schemas para validación datos recibido en endpoints */
export const userSelectSchema = createSelectSchema(users)
export type UserSelectType = z.infer<typeof userSelectSchema>

export const userInsertSchema = createInsertSchema(users)
export type UserInsertType = z.infer<typeof userInsertSchema>

export const poiHistorySelectSchema = createSelectSchema(poiHistory)
export type PoiHistorySelectType = z.infer<typeof poiHistorySelectSchema>

export const userRegisterBaseSchema = createInsertSchema(users).pick({
	email: true,
	username: true,
	password: true,
	role: true,
})

export const userRegisterSchema = z.object({
	body: userRegisterBaseSchema.extend({
		username: z.string().min(6).max(24).regex(USERNAME_PATTERN),
		password: z.string().min(8).max(32).regex(PASSWORD_PATTERN),
	}),
})
export type UserRegisterType = z.infer<typeof userRegisterSchema>

const userLoginBaseSchema = createSelectSchema(users)
	.partial({ email: true, username: true })
	.omit({ id: true, role: true })

export const userLoginSchema = z.object({
	body: userLoginBaseSchema
		.omit({
			imageUrl: true,
			createdAt: true,
			updatedAt: true,
			centerPreferenceId: true,
		})
		.refine((data) => data.email || data.username),
})

const userUpdateBaseSchema = createInsertSchema(users).omit({ password: true })

export const updateCurrUserProfileSchema = z.object({
	body: userUpdateBaseSchema
		.omit({ id: true, role: true })
		.extend({
			email: z.email().optional(),
			username: z.string().min(6).max(24).regex(USERNAME_PATTERN).optional(),
			currentPassword: z
				.string()
				.min(8)
				.max(32)
				.regex(PASSWORD_PATTERN)
				.optional(),
			newPassword: z.string().min(8).max(32).regex(PASSWORD_PATTERN).optional(),
			centerPreferenceId: z.coerce.number().int().positive().optional(),
		})
		.partial()
		.refine((data) => !(data.newPassword && !data.currentPassword), {
			message: 'Se requiere la contraseña actual para establecer una nueva',
			path: ['currentPassword'],
		}),
})
export type UpdateCurrUserProfileType = z.infer<
	typeof updateCurrUserProfileSchema
>

export const updateUserSchema = z.object({
	params: z.object({
		id: z.coerce.number().int().positive(),
	}),
	body: userUpdateBaseSchema.omit({ id: true }).partial(),
})
export type UpdateUserType = z.infer<typeof updateUserSchema>

export type UserLoginType = z.infer<typeof userLoginSchema>

export const TokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
})
export type TokenResponseType = z.infer<typeof TokenResponseSchema>

export const UserProfileSchema = createSelectSchema(users).omit({
	password: true,
	createdAt: true,
	updatedAt: true,
})
export type UserProfileType = z.infer<typeof UserProfileSchema>

export const UserRoleSchema = z.enum([...userRolesArray])
export type UserRoleType = z.infer<typeof UserRoleSchema>

export const UserRoleEditSchema = z.object({
	params: updateUserSchema.shape.params,
	body: updateUserSchema.shape.body.omit({
		email: true,
		username: true,
	}),
})

export type UserRoleEditType = z.infer<typeof UserRoleEditSchema>

export const userImageUpdateSchema = z.object({
	params: z.object({
		id: z.coerce.number().int().positive(),
	}),
})

export const poiInsertSchema = createInsertSchema(pois)
export type PoiInsertType = z.infer<typeof poiInsertSchema>

export const createPoiSchema = z.object({
	params: z.object({
		centerId: z.coerce.number().int().positive(),
	}),
	body: poiInsertSchema.omit({
		id: true,
		userId: true,
		centerId: true,
	}),
})
export type CreatePoiType = z.infer<typeof createPoiSchema>

export const poiByCenterSchema = z.object({
	params: z.object({
		centerId: z.coerce.number().int().positive(),
	}),
	query: z.object({
		limit: z.coerce.number().int().positive().max(100).default(20),
		lastId: z.coerce.number().int().positive().optional(),
	}),
})

export const updatePoiSchema = z.object({
	params: z.object({
		centerId: z.coerce.number().int().positive(),
		id: z.coerce.number().int().positive(),
	}),
	body: z.object({
		name: z.string().min(1).optional(),
		details: z.any().optional(),
	}),
})

export const deletePoiSchema = z.object({
	params: z.object({
		centerId: z.coerce.number().int().positive(),
		id: z.coerce.number().int().positive(),
	}),
})

export const centerUpdateSchema = z.object({
	params: z.object({
		id: z.coerce.number().int().positive(),
	}),
	body: z.object({
		name: z.string().min(1).optional(),
		description: z.string().optional(),
		location: z.string().optional(),
		imageUrl: z.string().url().optional(),
	}),
})

export const centerImageUpdateSchema = z.object({
	params: z.object({
		id: z.coerce.number().int().positive(),
	}),
})

export type CenterUpdateType = z.infer<typeof centerUpdateSchema>

export type PoiHistoryItemType = typeof poiHistory.$inferSelect

export const allCenterSchema = z.object({
	query: z.object({
		limit: z.coerce.number().int().positive().max(100).default(10),
		lastId: z.coerce.number().int().positive().optional(),
	}),
})
