import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useLocation,
} from '@tanstack/react-router'
import { BookOpen, ExternalLink, Menu, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import appCss from '../styles/globals.css?url'

export interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{
				title:
					'VisionPass · 视觉密语 - 基于端侧视觉特征与几何一致性检验的物理密语系统',
			},
			{
				name: 'description',
				content:
					'让现实万物成为数字密钥。基于端侧 ORB 特征提取与服务端 RANSAC 几何单应性校验，实现零隐私上云的现代视觉密语系统。',
			},
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', type: 'image/svg+xml', href: '/visionpass_logo_white.svg' },
		],
	}),
	component: RootLayout,
})

const GITHUB_REPO_URL = 'https://github.com/deadlyedge/visionpass'

function VisionPassLogo({ className = 'w-4 h-4' }: { className?: string }) {
	return (
		<img
			src="/visionpass_logo_white.svg"
			alt="VisionPass Logo"
			className={className}
		/>
	)
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
			/>
		</svg>
	)
}

function RootLayout() {
	const { queryClient } = Route.useRouteContext()
	const location = useLocation()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	const closeMobileMenu = () => setMobileMenuOpen(false)

	return (
		<html lang="zh-CN">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden">
				<QueryClientProvider client={queryClient}>
					{/* Navigation Header */}
					<header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
						<div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
							{/* Brand */}
							<Link
								to="/"
								onClick={closeMobileMenu}
								className="flex items-center gap-2.5 font-bold text-slate-100 hover:text-indigo-400 transition group"
							>
								<div className="p-2 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
									<VisionPassLogo className="w-4.5 h-4.5 object-contain" />
								</div>
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<span className="tracking-tight text-base sm:text-lg">
											VisionPass
										</span>
										<span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
											v0.6.1
										</span>
									</div>
									<span className="text-[10px] text-slate-400 hidden sm:inline -mt-1 font-normal">
										视觉密语系统
									</span>
								</div>
							</Link>

							{/* Desktop Navigation */}
							<nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
								<Link
									to="/"
									activeProps={{
										className: 'bg-slate-800 text-white font-semibold',
									}}
									className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
								>
									愿景与概述
								</Link>

								<Link
									to="/playground"
									search={{ tab: 'create' }}
									activeProps={{
										className:
											'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold',
									}}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-indigo-300 hover:bg-slate-800/60 transition"
								>
									<Sparkles className="w-3.5 h-3.5 text-indigo-400" />
									Playground (演练场)
								</Link>

								<Link
									to="/docs"
									search={{ section: 'vision' }}
									activeProps={{
										className: 'bg-slate-800 text-white font-semibold',
									}}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
								>
									<BookOpen className="w-3.5 h-3.5 text-slate-400" />
									开发与算法文档
								</Link>

								<div className="h-4 w-px bg-slate-800 mx-1" />

								{/* GitHub Link */}
								<a
									href={GITHUB_REPO_URL}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition shadow-sm"
								>
									<GithubIcon className="w-3.5 h-3.5" />
									<span>GitHub</span>
									<ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
								</a>
							</nav>

							{/* Mobile Menu Button */}
							<div className="flex items-center gap-2 md:hidden">
								<a
									href={GITHUB_REPO_URL}
									target="_blank"
									rel="noreferrer"
									className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
									aria-label="GitHub"
								>
									<GithubIcon className="w-4 h-4" />
								</a>
								<button
									type="button"
									onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
									className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none"
									aria-label="Toggle menu"
								>
									{mobileMenuOpen ? (
										<X className="w-5 h-5" />
									) : (
										<Menu className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>

						{/* Mobile Dropdown Menu */}
						{mobileMenuOpen && (
							<div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
								<Link
									to="/"
									onClick={closeMobileMenu}
									className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition ${
										location.pathname === '/'
											? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20'
											: 'text-slate-300 hover:bg-slate-900'
									}`}
								>
									<VisionPassLogo className="w-4 h-4 object-contain opacity-90" />
									愿景与概述
								</Link>

								<Link
									to="/playground"
									search={{ tab: 'create' }}
									onClick={closeMobileMenu}
									className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition ${
										location.pathname.startsWith('/playground')
											? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20'
											: 'text-slate-300 hover:bg-slate-900'
									}`}
								>
									<Sparkles className="w-4 h-4 text-indigo-400" />
									Playground (演练场)
								</Link>

								<Link
									to="/docs"
									search={{ section: 'vision' }}
									onClick={closeMobileMenu}
									className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition ${
										location.pathname.startsWith('/docs')
											? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20'
											: 'text-slate-300 hover:bg-slate-900'
									}`}
								>
									<BookOpen className="w-4 h-4 text-indigo-400" />
									开发与算法文档
								</Link>

								<div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-1">
									<span>开源协议: MIT License</span>
									<a
										href={GITHUB_REPO_URL}
										target="_blank"
										rel="noreferrer"
										className="text-indigo-400 flex items-center gap-1 hover:underline"
									>
										Star on GitHub
										<ExternalLink className="w-3 h-3" />
									</a>
								</div>
							</div>
						)}
					</header>

					{/* Main Content Area */}
					<main className="flex-1 w-full flex flex-col">
						<Outlet />
					</main>

					{/* Footer */}
					<footer className="border-t border-slate-900 bg-slate-950/80 py-10 text-xs text-slate-500">
						<div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
							<div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
								<div className="flex items-center gap-2 font-semibold text-slate-300">
									<VisionPassLogo className="w-4 h-4 object-contain opacity-80" />
									<span>VisionPass v0.6.1</span>
								</div>
								<span className="hidden sm:inline text-slate-700">|</span>
								<span>让现实世界的万物，成为你的数字密钥 · 零隐私上云</span>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-5 text-slate-400">
								<Link
									to="/playground"
									search={{ tab: 'create' }}
									className="hover:text-slate-200 transition"
								>
									演练场
								</Link>
								<Link
									to="/docs"
									search={{ section: 'vision' }}
									className="hover:text-slate-200 transition"
								>
									技术白皮书
								</Link>
								<a
									href={GITHUB_REPO_URL}
									target="_blank"
									rel="noreferrer"
									className="hover:text-slate-200 transition flex items-center gap-1"
								>
									<GithubIcon className="w-3.5 h-3.5" />
									GitHub
								</a>
							</div>
						</div>
						<div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-slate-900/60 text-center text-slate-600 text-[11px]">
							Powered by TanStack Start, Web Worker OpenCV.js WASM & TypeScript
							RANSAC Homography Engine.
						</div>
					</footer>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	)
}
