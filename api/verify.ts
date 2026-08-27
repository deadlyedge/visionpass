import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db } from './_lib/db/client'
import { credentials } from './_lib/db/schema'
import type { OrbFeaturePayloadV1 } from './_lib/feature-schema'
import { matchOrbBasic } from './_lib/matcher/orb-basic'
import {
	VerifyRequestSchema,
	validateFeaturePayloadStrict,
} from './_lib/validation/requests'

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

		// Strict validation of query feature
		try {
			validateFeaturePayloadStrict(queryFeature)
		} catch (err: any) {
			return res.status(400).json({ error: err.message || '特征数据校验失败' })
		}

		// Retrieve credential from DB
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

		// Perform ORB Hamming matching
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
