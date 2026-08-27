import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

import { defineConfig, type Plugin } from 'vite'

dotenv.config()

/**
 * Custom Vite Plugin to simulate Vercel Serverless Functions (/api/*) in local development.
 */
function apiDevServerPlugin(): Plugin {
	return {
		name: 'api-dev-server',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url?.split('?')[0] || ''
				if (!url.startsWith('/api/')) {
					return next()
				}

				try {
					// Parse request body for POST/PUT requests
					const buffers: Buffer[] = []
					for await (const chunk of req) {
						buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
					}
					const rawBody = Buffer.concat(buffers).toString('utf-8')
					let parsedBody: any
					if (
						rawBody &&
						req.headers['content-type']?.includes('application/json')
					) {
						try {
							parsedBody = JSON.parse(rawBody)
						} catch {
							parsedBody = rawBody
						}
					}

					// Mock VercelRequest / VercelResponse
					const urlObj = new URL(req.url || '', `http://${req.headers.host}`)
					const queryParams: Record<string, string> = {}
					urlObj.searchParams.forEach((value, key) => {
						queryParams[key] = value
					})

					const vercelReq: any = req
					vercelReq.body = parsedBody
					vercelReq.query = queryParams

					// Add helpers to vercelRes
					const vercelRes: any = res
					vercelRes.status = (code: number) => {
						res.statusCode = code
						return vercelRes
					}
					vercelRes.json = (jsonBody: any) => {
						res.setHeader('Content-Type', 'application/json')
						res.end(JSON.stringify(jsonBody))
						return vercelRes
					}

					// Route matching
					if (url === '/api/health') {
						const mod = await server.ssrLoadModule('/api/health.ts')
						return mod.default(vercelReq, vercelRes)
					}

					if (url === '/api/credentials') {
						const mod = await server.ssrLoadModule('/api/credentials.ts')
						return mod.default(vercelReq, vercelRes)
					}

					if (url === '/api/verify') {
						const mod = await server.ssrLoadModule('/api/verify.ts')
						return mod.default(vercelReq, vercelRes)
					}

					// Dynamic route: /api/credentials/:token
					const credMatch = url.match(/^\/api\/credentials\/([^/]+)$/)
					if (credMatch) {
						vercelReq.query.token = credMatch[1]
						const mod = await server.ssrLoadModule(
							'/api/credentials/[token].ts',
						)
						return mod.default(vercelReq, vercelRes)
					}

					return next()
				} catch (err: any) {
					console.error('[API Dev Server Error]:', err)
					res.statusCode = 500
					res.setHeader('Content-Type', 'application/json')
					res.end(
						JSON.stringify({ error: err?.message || 'Internal Server Error' }),
					)
				}
			})
		},
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), apiDevServerPlugin()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
