import {
	customType,
	integer,
	jsonb,
	numeric,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

// PostgreSQL BYTEA column custom type
const bytea = customType<{ data: Buffer; default: false }>({
	dataType() {
		return 'bytea'
	},
})

// 1. 凭证核心表（集成单张参考图特征与双 Token 哈希存储）
export const credentials = pgTable('credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	publicTokenHash: varchar('public_token_hash', { length: 64 })
		.notNull()
		.unique(),
	passcodeHash: varchar('passcode_hash', { length: 64 }).notNull().unique(),
	passcodeHint: varchar('passcode_hint', { length: 32 }),
	status: varchar('status', { length: 20 }).notNull().default('reserved'), // reserved | active | revoked | expired
	secretCiphertext: bytea('secret_ciphertext'),
	secretIv: bytea('secret_iv'),
	secretAuthTag: bytea('secret_auth_tag'),
	secretVersion: integer('secret_version').default(1),

	// 单参考图特征 Payload 与元数据
	featurePayload: jsonb('feature_payload'),
	matcherId: varchar('matcher_id', { length: 64 }).default(
		'orb-hamming-ransac-v1',
	),

	reserveExpiresAt: timestamp('reserve_expires_at', { withTimezone: true }),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	activatedAt: timestamp('activated_at', { withTimezone: true }),
})

// 2. 验证审计日志表
export const verificationAttempts = pgTable('verification_attempts', {
	id: uuid('id').defaultRandom().primaryKey(),
	credentialId: uuid('credential_id').references(() => credentials.id, {
		onDelete: 'set null',
	}),
	result: varchar('result', { length: 30 }).notNull(), // matched | failed | invalid_token | rate_limited
	matcherId: varchar('matcher_id', { length: 64 }),
	score: numeric('score'),
	goodMatchCount: integer('good_match_count'),
	inlierCount: integer('inlier_count'),
	inlierRatio: numeric('inlier_ratio'),
	ipHash: varchar('ip_hash', { length: 64 }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert
export type VerificationAttempt = typeof verificationAttempts.$inferSelect
export type NewVerificationAttempt = typeof verificationAttempts.$inferInsert
