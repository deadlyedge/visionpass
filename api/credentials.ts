import { randomBytes } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './_lib/db/client'
import { credentials } from './_lib/db/schema'
import {
	CreateCredentialRequestSchema,
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

		// Strict validation of ORB feature payload and base64 length
		try {
			validateFeaturePayloadStrict(feature)
		} catch (err: any) {
			return res.status(400).json({ error: err.message || '特征数据校验失败' })
		}

		// Generate cryptographically secure token
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
				// Retry on unique constraint collision
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
