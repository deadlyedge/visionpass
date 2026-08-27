import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
	handleCreateCredential,
	handleGetCredentialMeta,
} from '../../src/server/functions/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method === 'POST') {
		const result = await handleCreateCredential(req.body, req.headers)
		return res.status(result.status).json(result.data)
	}

	if (req.method === 'GET') {
		const token = (req.query.token as string) || (req.query.id as string) || ''
		const result = await handleGetCredentialMeta(token)
		return res.status(result.status).json(result.data)
	}

	res.setHeader('Allow', 'GET, POST')
	return res.status(405).json({ error: 'Method Not Allowed' })
}
