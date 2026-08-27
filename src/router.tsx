import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	Outlet,
	useParams,
} from '@tanstack/react-router'
import { Shield, Sparkles } from 'lucide-react'
import { CreatePage } from './routes/create'
import { ReadPage } from './routes/read'

const RootLayout = () => {
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
							MVP
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
				VisionPass v4.1.1 MVP · 浏览器端视觉特征提取与服务端比对
			</footer>
		</div>
	)
}

const rootRoute = createRootRoute({
	component: RootLayout,
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: CreatePage,
})

const createRoutePath = createRoute({
	getParentRoute: () => rootRoute,
	path: '/create',
	component: CreatePage,
})

function ReadRouteComponent() {
	const params = useParams({ from: '/r/$token' })
	return <ReadPage token={params.token} />
}

const readRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/r/$token',
	component: ReadRouteComponent,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	createRoutePath,
	readRoute,
])

export const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
