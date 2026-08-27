import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				staleTime: 1000 * 60 * 5,
			},
		},
	})

	return createTanStackRouter({
		routeTree,
		context: {
			queryClient,
		},
		defaultPreload: 'intent',
		scrollRestoration: true,
	})
}

export const createRouter = getRouter

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
