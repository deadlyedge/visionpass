import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const readSearchSchema = z.object({
	passcode: z.string().optional(),
})

export const Route = createFileRoute('/read')({
	validateSearch: (search) => readSearchSchema.parse(search),
	beforeLoad: ({ search }) => {
		throw redirect({
			to: '/playground',
			search: {
				tab: 'verify',
				passcode: search.passcode,
			},
		})
	},
})
