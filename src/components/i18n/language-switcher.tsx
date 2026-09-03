import { Globe } from 'lucide-react'
import { useState } from 'react'
import { SUPPORTED_LOCALES, useI18n } from '../../i18n'

export function LanguageSwitcher({
	variant = 'dropdown',
	className = '',
}: {
	variant?: 'dropdown' | 'segmented'
	className?: string
}) {
	const { locale, setLocale } = useI18n()
	const [isOpen, setIsOpen] = useState(false)

	if (variant === 'segmented') {
		return (
			<div
				className={`inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 ${className}`}
			>
				{SUPPORTED_LOCALES.map((item) => {
					const isActive = locale === item.code
					return (
						<button
							key={item.code}
							type="button"
							onClick={() => setLocale(item.code)}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
								isActive
									? 'bg-indigo-600 text-white shadow-xs'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							<span className="mr-1">{item.flag}</span>
							<span>{item.shortLabel}</span>
						</button>
					)
				})}
			</div>
		)
	}

	const currentItem =
		SUPPORTED_LOCALES.find((item) => item.code === locale) ||
		SUPPORTED_LOCALES[0]

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
				aria-label="Switch Language"
			>
				<Globe className="w-3.5 h-3.5 text-indigo-400" />
				<span className="mr-0.5">{currentItem.flag}</span>
				<span>{currentItem.shortLabel}</span>
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 mt-1.5 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-black/50 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
						{SUPPORTED_LOCALES.map((item) => {
							const isActive = locale === item.code
							return (
								<button
									key={item.code}
									type="button"
									onClick={() => {
										setLocale(item.code)
										setIsOpen(false)
									}}
									className={`w-full flex items-center justify-between px-3 py-2 text-xs transition ${
										isActive
											? 'bg-indigo-600/15 text-indigo-400 font-semibold'
											: 'text-slate-300 hover:bg-slate-800 hover:text-white'
									}`}
								>
									<span className="flex items-center gap-2">
										<span>{item.flag}</span>
										<span>{item.label}</span>
									</span>
									{isActive && <span className="text-indigo-400">✓</span>}
								</button>
							)
						})}
					</div>
				</>
			)}
		</div>
	)
}
