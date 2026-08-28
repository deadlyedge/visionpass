import { randomBytes } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { base64ToUint8Array } from '@/lib/feature-codec'
import {
	CreateCredentialRequestSchema,
	MATCH_CONFIG,
	OrbFeaturePayloadSchema,
	type OrbFeaturePayloadV1,
	VerifyRequestSchema,
} from '@/lib/feature-schema'
import { db } from '../db/client'
import { credentials } from '../db/schema'
import { matchOrbBasic } from '../matcher/orb-basic'

function validateFeaturePayloadStrict(feature: OrbFeaturePayloadV1) {
	const parsed = OrbFeaturePayloadSchema.parse(feature)

	let decoded: Uint8Array
	try {
		decoded = base64ToUint8Array(parsed.descriptorsBase64)
	} catch (_err) {
		throw new Error('descriptorsBase64 不是合法的 Base64 字符串')
	}

	const expectedLength = parsed.keypoints.length * MATCH_CONFIG.DESCRIPTOR_SIZE
	if (decoded.length !== expectedLength) {
		throw new Error(
			`描述子数据长度错误: 实际 ${decoded.length} 字节，预期 ${expectedLength} 字节 (${parsed.keypoints.length} 点 × 32 字节)`,
		)
	}

	if (parsed.keypoints.length > MATCH_CONFIG.MAX_KEYPOINTS) {
		throw new Error(`特征点数量超过最大允许限制 ${MATCH_CONFIG.MAX_KEYPOINTS}`)
	}

	return { parsed, decodedDescriptors: decoded }
}

/**
 * 1. 创建凭证 Server Function (原生 createServerFn)
 */
export const createCredentialFn = createServerFn({ method: 'POST' })
	.validator((data: unknown) => CreateCredentialRequestSchema.parse(data))
	.handler(async ({ data }) => {
		if (!process.env.DATABASE_URL) {
			throw new Error('数据库连接未配置：环境变量 DATABASE_URL 缺失。')
		}

		const { secret, feature } = data
		validateFeaturePayloadStrict(feature)

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
			throw new Error('生成唯一凭证失败，请重试')
		}

		const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000'
		const readUrl = `${appOrigin.replace(/\/+$/, '')}/r/${token}`

		return {
			token,
			readUrl,
		}
	})

/**
 * 2. 查询凭证状态 Server Function (原生 createServerFn)
 */
export const getCredentialMetaFn = createServerFn({ method: 'GET' })
	.validator((data: { token: string }) => data)
	.handler(async ({ data }) => {
		if (!process.env.DATABASE_URL) {
			throw new Error('数据库连接未配置：环境变量 DATABASE_URL 缺失。')
		}

		const { token } = data
		if (!token) {
			return { exists: false }
		}

		const result = await db
			.select({ id: credentials.id })
			.from(credentials)
			.where(eq(credentials.token, token))
			.limit(1)

		return { exists: result.length > 0 }
	})

/**
 * 3. 验证比对凭证 Server Function (原生 createServerFn)
 */
export const verifyCredentialFn = createServerFn({ method: 'POST' })
	.validator((data: unknown) => VerifyRequestSchema.parse(data))
	.handler(async ({ data }) => {
		if (!process.env.DATABASE_URL) {
			throw new Error('数据库连接未配置：环境变量 DATABASE_URL 缺失。')
		}

		const { token, feature: queryFeature } = data
		validateFeaturePayloadStrict(queryFeature)

		const rows = await db
			.select({
				secret: credentials.secret,
				featurePayload: credentials.featurePayload,
			})
			.from(credentials)
			.where(eq(credentials.token, token))
			.limit(1)

		if (rows.length === 0) {
			return { matched: false as const }
		}

		const { secret, featurePayload } = rows[0]
		const referenceFeature = featurePayload as OrbFeaturePayloadV1

		const matchResult = matchOrbBasic(queryFeature, referenceFeature)

		if (matchResult.matched) {
			return {
				matched: true as const,
				secret,
			}
		}

		return {
			matched: false as const,
		}
	})
