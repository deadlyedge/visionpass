import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
	handleCreateCredential,
	handleGetCredentialMeta,
	handleVerifyCredential,
} from '../src/server/functions/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const url = req.url || ''
		const pathname = url.split('?')[0]

		// 1. Credentials (POST create, GET meta)
		if (
			pathname === '/_server/credentials' ||
			pathname.startsWith('/_server/credentials')
		) {
			if (req.method === 'POST') {
				const result = await handleCreateCredential(req.body, req.headers)
				return res.status(result.status).json(result.data)
			}
			if (req.method === 'GET') {
				const token = (req.query.token as string) || (req.query.id as string)
				const result = await handleGetCredentialMeta(token)
				return res.status(result.status).json(result.data)
			}
			res.setHeader('Allow', 'GET, POST')
			return res.status(405).json({ error: 'Method Not Allowed' })
		}

		// 2. Verify
		if (
			pathname === '/_server/verify' ||
			pathname.startsWith('/_server/verify')
		) {
			if (req.method === 'POST') {
				const result = await handleVerifyCredential(req.body)
				return res.status(result.status).json(result.data)
			}
			res.setHeader('Allow', 'POST')
			return res.status(405).json({ error: 'Method Not Allowed' })
		}

		// 3. Health
		if (pathname === '/_server/health') {
			return res
				.status(200)
				.json({ status: 'ok', time: new Date().toISOString() })
		}

		return res.status(404).json({ error: 'Server function not found' })
	} catch (err: any) {
		console.error('Server function error:', err)
		return res.status(500).json({
			error: '内部服务器错误',
			message: err?.message || String(err),
		})
	}
}
