import {
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const credentials = pgTable('credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	token: varchar('token', { length: 64 }).notNull().unique(),
	secret: text('secret').notNull(),
	featurePayload: jsonb('feature_payload').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})
