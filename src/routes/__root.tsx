import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { Shield, Sparkles } from 'lucide-react'
import appCss from '../styles/globals.css?url'

export interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'VisionPass - 视觉密语' },
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', href: '/favicon.ico' },
		],
	}),
	component: RootLayout,
})

function RootLayout() {
	const { queryClient } = Route.useRouteContext()

	return (
		<html lang="zh-CN">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
				<QueryClientProvider client={queryClient}>
					{/* Navigation Header */}
					<header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
						<div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
							<Link
								to="/create"
								className="flex items-center gap-2 font-bold text-slate-100 hover:text-indigo-400 transition"
							>
								<div className="p-1.5 bg-indigo-600 rounded-lg text-white">
									<Shield className="w-4 h-4" />
								</div>
								<span>VisionPass</span>
								<span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
									v5.1
								</span>
							</Link>

							<nav className="flex items-center gap-3">
								<Link
									to="/create"
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition"
								>
									<Sparkles className="w-3.5 h-3.5" />
									创建凭证
								</Link>
							</nav>
						</div>
					</header>

					{/* Main Content Area */}
					<main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-center">
						<Outlet />
					</main>

					{/* Footer */}
					<footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
						VisionPass v5.1 · Web Worker 视觉特征提取与 RANSAC 几何一致性检验
					</footer>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	)
}
