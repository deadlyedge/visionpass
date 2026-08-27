import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { defineConfig, type Plugin } from 'vite'

dotenv.config()

/**
 * Vite Plugin: 自动在本地开发时代理 /_server/* 到 src/server/functions/handlers
 */
function serverFnDevPlugin(): Plugin {
	return {
		name: 'server-fn-dev-server',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url?.split('?')[0] || ''
				if (!url.startsWith('/_server/')) {
					return next()
				}

				try {
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

					const urlObj = new URL(req.url || '', `http://${req.headers.host}`)
					const queryParams: Record<string, string> = {}
					urlObj.searchParams.forEach((value, key) => {
						queryParams[key] = value
					})

					const {
						handleCreateCredential,
						handleGetCredentialMeta,
						handleVerifyCredential,
					} = await server.ssrLoadModule('/src/server/functions/handlers.ts')

					res.setHeader('Content-Type', 'application/json')

					if (url === '/_server/credentials') {
						if (req.method === 'POST') {
							const result = await handleCreateCredential(
								parsedBody,
								req.headers,
							)
							res.statusCode = result.status
							res.end(JSON.stringify(result.data))
							return
						}
						if (req.method === 'GET') {
							const token = queryParams.token || queryParams.id || ''
							const result = await handleGetCredentialMeta(token)
							res.statusCode = result.status
							res.end(JSON.stringify(result.data))
							return
						}
					}

					if (url === '/_server/verify' && req.method === 'POST') {
						const result = await handleVerifyCredential(parsedBody)
						res.statusCode = result.status
						res.end(JSON.stringify(result.data))
						return
					}

					res.statusCode = 404
					res.end(JSON.stringify({ error: 'Not Found' }))
				} catch (err: any) {
					console.error('[ServerFn Dev Error]:', err)
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
	plugins: [
		TanStackRouterVite({ autoCodeSplitting: true }),
		serverFnDevPlugin(),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
