import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
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

type OrbFeaturePayloadV1 = z.infer<typeof OrbFeaturePayloadSchema>

const VerifyRequestSchema = z.object({
	token: z.string().min(1),
	feature: OrbFeaturePayloadSchema,
})

function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64)
	const len = binaryString.length
	const bytes = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	return bytes
}

function validateFeaturePayloadStrict(feature: OrbFeaturePayloadV1) {
	const parsed = OrbFeaturePayloadSchema.parse(feature)
	let decoded: Uint8Array
	try {
		decoded = base64ToUint8Array(parsed.descriptorsBase64)
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

function hammingDistanceDirect(
	a: Uint8Array,
	aOffset: number,
	b: Uint8Array,
	bOffset: number,
): number {
	let dist = 0
	for (let i = 0; i < 32; i++) {
		let xor = a[aOffset + i] ^ b[bOffset + i]
		while (xor !== 0) {
			xor &= xor - 1
			dist++
		}
	}
	return dist
}

function matchOrbBasic(
	query: OrbFeaturePayloadV1,
	reference: OrbFeaturePayloadV1,
) {
	const queryBytes = base64ToUint8Array(query.descriptorsBase64)
	const refBytes = base64ToUint8Array(reference.descriptorsBase64)

	const queryCount = query.keypoints.length
	const refCount = reference.keypoints.length

	if (queryCount === 0 || refCount === 0) {
		return { matched: false, goodMatchCount: 0 }
	}

	let goodMatchCount = 0

	for (let q = 0; q < queryCount; q++) {
		const qOffset = q * 32
		let minDistance = 256

		for (let r = 0; r < refCount; r++) {
			const rOffset = r * 32
			const d = hammingDistanceDirect(queryBytes, qOffset, refBytes, rOffset)
			if (d < minDistance) {
				minDistance = d
			}
			if (minDistance === 0) {
				break
			}
		}

		if (minDistance <= 50) {
			goodMatchCount++
		}
	}

	const matched = goodMatchCount >= 25

	return {
		matched,
		goodMatchCount,
	}
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
				error: '数据库连接未配置：环境变量 DATABASE_URL 缺失。',
			})
		}

		const parsedBody = VerifyRequestSchema.safeParse(req.body)
		if (!parsedBody.success) {
			return res.status(400).json({
				error: '无效的请求参数',
				details: parsedBody.error.flatten(),
			})
		}

		const { token, feature: queryFeature } = parsedBody.data

		try {
			validateFeaturePayloadStrict(queryFeature)
		} catch (err: any) {
			return res.status(400).json({ error: err.message || '特征数据校验失败' })
		}

		const rows = await db
			.select({
				secret: credentials.secret,
				featurePayload: credentials.featurePayload,
			})
			.from(credentials)
			.where(eq(credentials.token, token))
			.limit(1)

		if (rows.length === 0) {
			return res.status(404).json({ error: '凭证不存在' })
		}

		const { secret, featurePayload } = rows[0]
		const referenceFeature = featurePayload as OrbFeaturePayloadV1

		const matchResult = matchOrbBasic(queryFeature, referenceFeature)

		if (matchResult.matched) {
			return res.status(200).json({
				matched: true,
				secret,
			})
		} else {
			return res.status(200).json({
				matched: false,
			})
		}
	} catch (err: any) {
		console.error('验证凭证错误详细信息:', err)
		return res.status(500).json({
			error: '内部服务器错误',
			message: err?.message || String(err),
		})
	}
}
