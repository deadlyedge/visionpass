import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { KeyRound, Shield, Sparkles } from 'lucide-react'
import { z } from 'zod'
import { CreateSection } from '../components/playground/create-section'
import { ReadSection } from '../components/playground/read-section'
import { useI18n } from '../i18n'

const playgroundSearchSchema = z.object({
	tab: z.enum(['create', 'verify']).optional().default('create'),
	passcode: z.string().optional(),
})

export const Route = createFileRoute('/playground')({
	validateSearch: (search) => playgroundSearchSchema.parse(search),
	component: PlaygroundPage,
})

export function PlaygroundPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const { t } = useI18n()
	const activeTab = search.tab || 'create'

	const handleTabChange = (newTab: 'create' | 'verify') => {
		navigate({
			search: (prev) => ({
				...prev,
				tab: newTab,
			}),
		})
	}

	return (
		<div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
			{/* Page Header */}
			<div className="text-center space-y-3">
				<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400">
					<Shield className="w-3.5 h-3.5" />
					<span>VisionPass · {t('playground.title')}</span>
				</div>
				<h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
					{t('playground.title')}
				</h1>
				<p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
					{t('playground.subtitle')}
				</p>
			</div>

			{/* Tab Switcher */}
			<div className="flex justify-center">
				<div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
					<button
						type="button"
						onClick={() => handleTabChange('create')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
							activeTab === 'create'
								? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
						}`}
					>
						<Sparkles className="w-4 h-4" />
						<span>{t('playground.tabs.create')}</span>
					</button>

					<button
						type="button"
						onClick={() => handleTabChange('verify')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
							activeTab === 'verify'
								? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
						}`}
					>
						<KeyRound className="w-4 h-4" />
						<span>{t('playground.tabs.verify')}</span>
					</button>
				</div>
			</div>

			{/* Content Container */}
			<div className="transition-all duration-300">
				{activeTab === 'create' ? (
					<CreateSection onSwitchToVerify={() => handleTabChange('verify')} />
				) : (
					<ReadSection initialPasscode={search.passcode} />
				)}
			</div>
		</div>
	)
}
