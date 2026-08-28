import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

dotenv.config()

// TanStack Start + Nitro 生产全栈流水线配置
export default defineConfig({
	resolve: {
		alias: {
			'@': import.meta.dirname ? `${import.meta.dirname}/src` : './src',
		},
	},
	plugins: [
		nitro({
			// 当在 Vercel 平台或设置了 NITRO_PRESET=vercel 时自动启用 vercel 预设，否则使用 node-server
			preset:
				process.env.NITRO_PRESET ||
				(process.env.VERCEL ? 'vercel' : 'node-server'),
			routeRules: {
				'/**': {
					headers: {
						'X-Content-Type-Options': 'nosniff',
						'X-Frame-Options': 'DENY',
						'X-XSS-Protection': '1; mode=block',
						'Referrer-Policy': 'strict-origin-when-cross-origin',
					},
				},
			},
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	build: {
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			onwarn(warning, warn) {
				if (
					warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
					warning.exporter?.includes('@tanstack')
				) {
					return
				}
				warn(warning)
			},
		},
	},
})
