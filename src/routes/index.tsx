import { createFileRoute } from '@tanstack/react-router'
import { CreatePage } from './create'

export const Route = createFileRoute('/')({
	component: CreatePage,
})
