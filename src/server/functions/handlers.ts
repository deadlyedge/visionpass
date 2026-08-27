import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { base64ToUint8Array } from '../../lib/feature-codec'
import {
	CreateCredentialRequestSchema,
	MATCH_CONFIG,
	OrbFeaturePayloadSchema,
	type OrbFeaturePayloadV1,
	VerifyRequestSchema,
} from '../../lib/feature-schema'
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

export async function handleCreateCredential(
	body: unknown,
	headers: Record<string, string | string[] | undefined>,
) {
	const parsedBody = CreateCredentialRequestSchema.safeParse(body)
	if (!parsedBody.success) {
		return {
			status: 400,
			data: {
				error: '无效的请求参数',
				details: parsedBody.error.flatten(),
			},
		}
	}

	const { secret, feature } = parsedBody.data
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
		return { status: 500, data: { error: '生成唯一凭证失败，请重试' } }
	}

	const appOrigin =
		process.env.APP_ORIGIN ||
		(headers.host
			? `${headers['x-forwarded-proto'] || 'http'}://${headers.host}`
			: 'http://localhost:3000')

	const readUrl = `${appOrigin.replace(/\/+$/, '')}/r/${token}`

	return {
		status: 201,
		data: {
			token,
			readUrl,
		},
	}
}

export async function handleGetCredentialMeta(token: string) {
	if (!token) {
		return { status: 400, data: { error: '缺少 token 参数' } }
	}

	const result = await db
		.select({ id: credentials.id })
		.from(credentials)
		.where(eq(credentials.token, token))
		.limit(1)

	if (result.length === 0) {
		return { status: 404, data: { exists: false } }
	}

	return { status: 200, data: { exists: true } }
}

export async function handleVerifyCredential(body: unknown) {
	const parsedBody = VerifyRequestSchema.safeParse(body)
	if (!parsedBody.success) {
		return {
			status: 400,
			data: {
				error: '无效的请求参数',
				details: parsedBody.error.flatten(),
			},
		}
	}

	const { token, feature: queryFeature } = parsedBody.data
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
		return { status: 404, data: { error: '凭证不存在' } }
	}

	const { secret, featurePayload } = rows[0]
	const referenceFeature = featurePayload as OrbFeaturePayloadV1

	const matchResult = matchOrbBasic(queryFeature, referenceFeature)

	if (matchResult.matched) {
		return {
			status: 200,
			data: {
				matched: true,
				secret,
			},
		}
	}

	return {
		status: 200,
		data: {
			matched: false,
		},
	}
}
