import { createServerFn } from '@tanstack/react-start'
import { and, eq, or } from 'drizzle-orm'
import { CONSTANTS } from '@/lib/constants'
import { base64ToUint8Array } from '@/lib/feature-codec'
import {
	CreateCredentialRequestSchema,
	MATCH_CONFIG,
	normalizeFeaturePayload,
	OrbFeaturePayloadSchema,
	type OrbFeaturePayloadV1,
	VerifyRequestSchema,
} from '@/lib/feature-schema'
import { decryptSecret, encryptSecret } from '../crypto/secrets'
import { generateTokenPair, hashToken } from '../crypto/tokens'
import { db } from '../db/client'
import { credentials, verificationAttempts } from '../db/schema'
import { orbHammingRansacMatcherV1 } from '../matcher/orb-hamming-ransac-v1'
import { serverLogger } from '../utils/logger'

function validateFeaturePayloadStrict(rawFeature: OrbFeaturePayloadV1) {
	OrbFeaturePayloadSchema.parse(rawFeature)
	const feature = normalizeFeaturePayload(rawFeature)

	let decoded: Uint8Array
	try {
		decoded = base64ToUint8Array(feature.descriptor.bytesBase64)
	} catch (_err) {
		throw new Error('descriptor bytesBase64 不是合法的 Base64 字符串')
	}

	const expectedLength = feature.keypoints.count * MATCH_CONFIG.DESCRIPTOR_SIZE
	if (decoded.length !== expectedLength) {
		throw new Error(
			`描述子数据长度错误: 实际 ${decoded.length} 字节，预期 ${expectedLength} 字节 (${feature.keypoints.count} 点 × 32 字节)`,
		)
	}

	if (feature.keypoints.count > MATCH_CONFIG.MAX_KEYPOINTS) {
		throw new Error(`特征点数量超过最大允许限制 ${MATCH_CONFIG.MAX_KEYPOINTS}`)
	}

	return { feature, decodedDescriptors: decoded }
}

/**
 * 1. 创建凭证 Server Function (原生 createServerFn)
 * 生成双 Token 与密语加密存储
 */
export const createCredentialFn = createServerFn({ method: 'POST' })
	.validator((data: unknown) => CreateCredentialRequestSchema.parse(data))
	.handler(async ({ data }) => {
		if (!process.env.DATABASE_URL) {
			throw new Error('数据库连接未配置：环境变量 DATABASE_URL 缺失。')
		}

		const { secret, feature } = data
		validateFeaturePayloadStrict(feature)

		// 1. 生成双 Token 组合与哈希
		const {
			publicToken,
			displayPasscode,
			publicTokenHash,
			passcodeHash,
			passcodeHint,
		} = generateTokenPair()

		// 2. AES-256-GCM 加密密语
		const encrypted = encryptSecret(secret)

		const now = new Date()
		const expiresAt = new Date(
			now.getTime() + CONSTANTS.CRYPTO.DEFAULT_EXPIRES_DAYS * 24 * 3600 * 1000,
		)

		let inserted = false
		let attempts = 0

		while (!inserted && attempts < 5) {
			attempts++
			try {
				await db.insert(credentials).values({
					publicTokenHash,
					passcodeHash,
					passcodeHint,
					status: 'active',
					secretCiphertext: encrypted.ciphertext,
					secretIv: encrypted.iv,
					secretAuthTag: encrypted.authTag,
					secretVersion: encrypted.version,
					featurePayload: feature,
					matcherId: orbHammingRansacMatcherV1.id,
					expiresAt,
					activatedAt: now,
				})
				inserted = true
				serverLogger.info('createCredential', '凭证创建并激活成功', {
					publicTokenHash: publicTokenHash.slice(0, 8),
					passcodeHint,
				})
			} catch (dbErr: any) {
				if (dbErr.code === '23505' || dbErr.message?.includes('unique')) {
					serverLogger.warn('createCredential', 'Token 哈希冲突，重试生成')
					continue
				}
				serverLogger.error('createCredential', '凭证入库异常', dbErr)
				throw dbErr
			}
		}

		if (!inserted) {
			throw new Error('生成唯一凭证失败，请重试')
		}

		const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000'
		const readUrl = `${appOrigin.replace(/\/+$/, '')}/r/${publicToken}`

		return {
			token: publicToken,
			displayPasscode,
			readUrl,
		}
	})

/**
 * 2. 查询凭证状态 Server Function (原生 createServerFn)
 * 支持通过 publicToken 或 displayPasscode 哈希查询凭证有效性
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

		const inputHash = hashToken(token)

		const result = await db
			.select({ id: credentials.id, status: credentials.status })
			.from(credentials)
			.where(
				and(
					or(
						eq(credentials.publicTokenHash, inputHash),
						eq(credentials.passcodeHash, inputHash),
					),
					eq(credentials.status, 'active'),
				),
			)
			.limit(1)

		return { exists: result.length > 0 }
	})

/**
 * 3. 验证比对凭证 Server Function (原生 createServerFn)
 * 支持双 Token 哈希索引、ORB RANSAC 几何内点比对、AES-256-GCM 解密与审计日志
 */
export const verifyCredentialFn = createServerFn({ method: 'POST' })
	.validator((data: unknown) => VerifyRequestSchema.parse(data))
	.handler(async ({ data }) => {
		if (!process.env.DATABASE_URL) {
			throw new Error('数据库连接未配置：环境变量 DATABASE_URL 缺失。')
		}

		const { token, feature: queryFeature } = data
		validateFeaturePayloadStrict(queryFeature)

		const inputHash = hashToken(token)

		const rows = await db
			.select({
				id: credentials.id,
				status: credentials.status,
				secretCiphertext: credentials.secretCiphertext,
				secretIv: credentials.secretIv,
				secretAuthTag: credentials.secretAuthTag,
				featurePayload: credentials.featurePayload,
			})
			.from(credentials)
			.where(
				and(
					or(
						eq(credentials.publicTokenHash, inputHash),
						eq(credentials.passcodeHash, inputHash),
					),
					eq(credentials.status, 'active'),
				),
			)
			.limit(1)

		if (rows.length === 0) {
			serverLogger.warn('verifyCredential', '未找到有效凭证', {
				inputHash: inputHash.slice(0, 8),
			})
			return { matched: false as const }
		}

		const row = rows[0]
		if (
			!row?.secretCiphertext ||
			!row.secretIv ||
			!row.secretAuthTag ||
			!row.featurePayload
		) {
			return { matched: false as const }
		}

		const referenceFeature = row.featurePayload as OrbFeaturePayloadV1
		const matchResult = orbHammingRansacMatcherV1.match({
			query: queryFeature,
			reference: referenceFeature,
		})

		serverLogger.info('verifyCredential', '特征比对完成', {
			credentialId: row.id,
			matched: matchResult.matched,
			score: matchResult.score,
			goodMatchCount: matchResult.goodMatchCount,
			inlierCount: matchResult.inlierCount,
			inlierRatio: matchResult.inlierRatio,
			reason: matchResult.reason,
		})

		// 记录验证审计日志
		try {
			await db.insert(verificationAttempts).values({
				credentialId: row.id,
				result: matchResult.matched ? 'matched' : 'failed',
				matcherId: orbHammingRansacMatcherV1.id,
				score: String(matchResult.score),
				goodMatchCount: matchResult.goodMatchCount,
				inlierCount: matchResult.inlierCount,
				inlierRatio: String(matchResult.inlierRatio),
			})
		} catch (auditErr) {
			serverLogger.warn('verifyCredential', '记录审计日志失败', {
				error: auditErr,
			})
		}

		if (matchResult.matched) {
			// 解密密语
			const decryptedSecret = decryptSecret({
				ciphertext: row.secretCiphertext,
				iv: row.secretIv,
				authTag: row.secretAuthTag,
			})

			return {
				matched: true as const,
				secret: decryptedSecret,
			}
		}

		return {
			matched: false as const,
		}
	})
