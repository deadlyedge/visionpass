import { randomBytes } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'

// 1. Database Schema & Connection
const credentials = pgTable('credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	token: varchar('token', { length: 64 }).notNull().unique(),
	secret: text('secret').notNull(),
	featurePayload: jsonb('feature_payload').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString || '', {
	prepare: false,
	max: 1,
	ssl: connectionString?.includes('localhost') ? false : 'require',
	connect_timeout: 10,
})
const db = drizzle(client, { schema: { credentials } })

// 2. Feature Schema & Validation
const OrbFeaturePayloadSchema = z.object({
	version: z.literal(1),
	algorithm: z.literal('orb'),
	imageWidth: z.number().int().positive(),
	imageHeight: z.number().int().positive(),
	descriptorSize: z.literal(32),
	keypoints: z
		.array(
			z.object({
				x: z.number(),
				y: z.number(),
			}),
		)
		.min(1)
		.max(500),
	descriptorsBase64: z.string().min(1),
})

const CreateCredentialRequestSchema = z.object({
	secret: z
		.string()
		.min(1, '密语不能为空')
		.max(1000, '密语长度不能超过1000字符'),
	feature: OrbFeaturePayloadSchema,
})

function validateFeaturePayloadStrict(
	feature: z.infer<typeof OrbFeaturePayloadSchema>,
) {
	const parsed = OrbFeaturePayloadSchema.parse(feature)
	let decoded: Uint8Array
	try {
		const binaryString = atob(parsed.descriptorsBase64)
		decoded = new Uint8Array(binaryString.length)
		for (let i = 0; i < binaryString.length; i++) {
			decoded[i] = binaryString.charCodeAt(i)
		}
	} catch (_err) {
		throw new Error('descriptorsBase64 不是合法的 Base64 字符串')
	}

	const expectedLength = parsed.keypoints.length * 32
	if (decoded.length !== expectedLength) {
		throw new Error(
			`描述子数据长度错误: 实际 ${decoded.length} 字节，预期 ${expectedLength} 字节 (${parsed.keypoints.length} 点 × 32 字节)`,
		)
	}

	if (parsed.keypoints.length > 500) {
		throw new Error('特征点数量超过最大允许限制 500')
	}

	return { parsed, decodedDescriptors: decoded }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	try {
		if (!process.env.DATABASE_URL) {
			console.error('DATABASE_URL is not defined in environment variables')
			return res.status(500).json({
				error:
					'数据库连接未配置：环境变量 DATABASE_URL 缺失，请在 Vercel 中添加。',
			})
		}

		const parsedBody = CreateCredentialRequestSchema.safeParse(req.body)
		if (!parsedBody.success) {
			return res.status(400).json({
				error: '无效的请求参数',
				details: parsedBody.error.flatten(),
			})
		}

		const { secret, feature } = parsedBody.data

		try {
			validateFeaturePayloadStrict(feature)
		} catch (err: any) {
			return res.status(400).json({ error: err.message || '特征数据校验失败' })
		}

		let token = ''
		let inserted = false
		let attempts = 0

		while (!inserted && attempts < 5) {
			attempts++
			token = randomBytes(16).toString('base64url')

			try {
				await db.insert(credentials).values({
					token,
					secret,
					featurePayload: feature,
				})
				inserted = true
			} catch (dbErr: any) {
				if (dbErr.code === '23505' || dbErr.message?.includes('unique')) {
					continue
				}
				throw dbErr
			}
		}

		if (!inserted) {
			return res.status(500).json({ error: '生成唯一凭证失败，请重试' })
		}

		const appOrigin =
			process.env.APP_ORIGIN ||
			(req.headers.host
				? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
				: 'http://localhost:5173')

		const readUrl = `${appOrigin.replace(/\/+$/, '')}/r/${token}`

		return res.status(201).json({
			token,
			readUrl,
		})
	} catch (err: any) {
		console.error('创建凭证错误详细信息:', err)
		return res.status(500).json({
			error: '内部服务器错误',
			message: err?.message || String(err),
		})
	}
}
