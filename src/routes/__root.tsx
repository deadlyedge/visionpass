import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Shield, Sparkles } from 'lucide-react'

export const Route = createRootRoute({
	component: RootLayout,
})

function RootLayout() {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
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
							v5.0
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
				VisionPass v5.0 · TanStack Start 全栈架构与纯位运算视觉匹配
			</footer>
		</div>
	)
}
