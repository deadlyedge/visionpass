import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db/client'
import { credentials } from '../../server/db/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET')
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	const { token } = req.query

	if (!token || typeof token !== 'string') {
		return res.status(400).json({ error: '缺少 token 参数' })
	}

	try {
		if (!process.env.DATABASE_URL) {
			console.error('DATABASE_URL is not defined in environment variables')
			return res.status(500).json({
				error: '数据库连接未配置：环境变量 DATABASE_URL 缺失。',
			})
		}

		const result = await db
			.select({ id: credentials.id })
			.from(credentials)
			.where(eq(credentials.token, token))
			.limit(1)

		if (result.length === 0) {
			return res.status(404).json({ exists: false })
		}

		return res.status(200).json({ exists: true })
	} catch (err: any) {
		console.error('查询凭证元数据错误详细信息:', err)
		return res.status(500).json({
			error: '内部服务器错误',
			message: err?.message || String(err),
		})
	}
}
