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
	plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
	build: {
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
