import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleVerifyCredential } from '../../src/server/functions/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method === 'POST') {
		const result = await handleVerifyCredential(req.body)
		return res.status(result.status).json(result.data)
	}

	res.setHeader('Allow', 'POST')
	return res.status(405).json({ error: 'Method Not Allowed' })
}
