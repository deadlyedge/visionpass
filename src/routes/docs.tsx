import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	BookOpen,
	Code2,
	Cpu,
	ExternalLink,
	Layers,
	Lock,
	Shield,
	Sparkles,
	Zap,
} from 'lucide-react'
import { z } from 'zod'
import { useI18n } from '../i18n'
import { CONSTANTS } from '../lib/constants'

const docsSearchSchema = z.object({
	section: z
		.enum(['vision', 'algorithm', 'tech-stack', 'architecture'])
		.optional()
		.default('vision'),
})

export const Route = createFileRoute('/docs')({
	validateSearch: (search) => docsSearchSchema.parse(search),
	component: DocsPage,
})

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

export function DocsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const { t } = useI18n()
	const currentSection = search.section || 'vision'

	const setSection = (
		section: 'vision' | 'algorithm' | 'tech-stack' | 'architecture',
	) => {
		navigate({
			search: (prev) => ({
				...prev,
				section,
			}),
		})
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
			{/* Docs Header */}
			<div className="border-b border-slate-800/80 pb-8 mb-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400">
							<BookOpen className="w-3.5 h-3.5" />
							<span>
								{CONSTANTS.APP.NAME} · {t('docs.headerBadge')} (
								{CONSTANTS.APP.VERSION})
							</span>
						</div>
						<h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
							{t('docs.title')}
						</h1>
						<p className="text-slate-400 text-sm max-w-2xl">
							{t('docs.subtitle')}
						</p>
					</div>

					<a
						href={CONSTANTS.APP.GITHUB_REPO_URL}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
					>
						<GithubIcon className="w-4 h-4" />
						<span>View on GitHub</span>
						<ExternalLink className="w-3 h-3 text-slate-400" />
					</a>
				</div>
			</div>

			{/* Main Layout: Sidebar & Content */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Sidebar Navigation */}
				<div className="lg:col-span-3 sticky top-20 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 space-y-1 z-10">
					<div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
						{t('docs.headerBadge')}
					</div>

					<button
						type="button"
						onClick={() => setSection('vision')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'vision'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Shield className="w-4 h-4 text-indigo-400 shrink-0" />
						<span>{t('docs.sections.vision.nav')}</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('algorithm')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'algorithm'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Zap className="w-4 h-4 text-amber-400 shrink-0" />
						<span>{t('docs.sections.algorithm.nav')}</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('tech-stack')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'tech-stack'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
						<span>{t('docs.sections.techStack.nav')}</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('architecture')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'architecture'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Layers className="w-4 h-4 text-emerald-400 shrink-0" />
						<span>{t('docs.sections.architecture.nav')}</span>
					</button>
				</div>

				{/* Content Body */}
				<div className="lg:col-span-9 space-y-10">
					{/* SECTION 1: VISION */}
					{currentSection === 'vision' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
									<span>{t('docs.sections.vision.chapter')}</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									{t('docs.sections.vision.title')}
								</h2>
							</div>

							<div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-6">
								<p>{t('docs.sections.vision.intro')}</p>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
									<div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
										<div className="text-red-400 font-semibold flex items-center gap-2 text-sm">
											<span>{t('docs.sections.vision.traditionTitle')}</span>
										</div>
										<p className="text-xs text-slate-400 leading-relaxed">
											{t('docs.sections.vision.traditionDesc')}
										</p>
									</div>

									<div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
										<div className="text-emerald-400 font-semibold flex items-center gap-2 text-sm">
											<span>{t('docs.sections.vision.physicalTitle')}</span>
										</div>
										<p className="text-xs text-slate-400 leading-relaxed">
											{t('docs.sections.vision.physicalDesc')}
										</p>
									</div>
								</div>

								<h3 className="text-lg font-bold text-white mt-8 mb-4">
									{t('docs.sections.vision.ruleTitle')}
								</h3>
								<p>{t('docs.sections.vision.ruleDesc1')}</p>
								<p>
									VisionPass 确立了不可动摇的
									<strong className="text-indigo-400 font-medium ml-1">
										{t('docs.sections.vision.ruleDesc2')}
									</strong>{' '}
									{t('docs.sections.vision.ruleDesc3')}
								</p>

								<div className="p-5 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3 mt-6">
									<h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
										<Lock className="w-4 h-4" />
										{t('docs.sections.vision.threatTitle')}
									</h4>
									<ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
										<li>
											<strong>{t('docs.sections.vision.threat1Title')}</strong>
											：{t('docs.sections.vision.threat1Desc')}
										</li>
										<li>
											<strong>{t('docs.sections.vision.threat2Title')}</strong>
											：{t('docs.sections.vision.threat2Desc')}
										</li>
										<li>
											<strong>{t('docs.sections.vision.threat3Title')}</strong>
											：{t('docs.sections.vision.threat3Desc')}
										</li>
									</ul>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 2: ALGORITHM */}
					{currentSection === 'algorithm' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
									<span>{t('docs.sections.algorithm.chapter')}</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									{t('docs.sections.algorithm.title')}
								</h2>
							</div>

							<div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-6">
								<p>{t('docs.sections.algorithm.intro')}</p>

								{/* Step 1: ORB */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
										<Sparkles className="w-4 h-4" />
										<span>{t('docs.sections.algorithm.orbTitle')}</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										{t('docs.sections.algorithm.orbDesc')}
									</p>
									<ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
										<li>
											<strong>
												{t('docs.sections.algorithm.orbStep1Title')}
											</strong>
											：{t('docs.sections.algorithm.orbStep1Desc')}
										</li>
										<li>
											<strong>
												{t('docs.sections.algorithm.orbStep2Title')}
											</strong>
											：{t('docs.sections.algorithm.orbStep2Desc')}
										</li>
									</ul>
								</div>

								{/* Step 2: Lowe's Ratio */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-amber-400 font-bold text-base">
										<Zap className="w-4 h-4" />
										<span>{t('docs.sections.algorithm.loweTitle')}</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										{t('docs.sections.algorithm.loweDesc')}
									</p>
									<div className="p-3 bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 text-amber-300">
										Condition: distance(dq, d1) &lt; 0.75 * distance(dq, d2)
									</div>
									<p className="text-xs text-slate-400">
										{t('docs.sections.algorithm.loweNote')}
									</p>
								</div>

								{/* Step 3: RANSAC Homography */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
										<Shield className="w-4 h-4" />
										<span>{t('docs.sections.algorithm.ransacTitle')}</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										{t('docs.sections.algorithm.ransacDesc1')}
									</p>
									<p className="text-xs text-slate-400">
										{t('docs.sections.algorithm.ransacDesc2')}
									</p>
									<div className="p-3 bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 text-emerald-300">
										s * [x', y', 1]^T = H * [x, y, 1]^T
									</div>
									<p className="text-xs text-slate-400">
										<strong>
											{t('docs.sections.algorithm.ransacStepsTitle')}
										</strong>
										<br />
										{t('docs.sections.algorithm.ransacStep1')}
										<br />
										{t('docs.sections.algorithm.ransacStep2')}
										<br />
										{t('docs.sections.algorithm.ransacStep3')}
										<br />
										{t('docs.sections.algorithm.ransacStep4')}
									</p>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 3: TECH STACK */}
					{currentSection === 'tech-stack' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
									<span>{t('docs.sections.techStack.chapter')}</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									{t('docs.sections.techStack.title')}
								</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
										<Code2 className="w-4 h-4" />
										<span>{t('docs.sections.techStack.tanstackTitle')}</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										{t('docs.sections.techStack.tanstackDesc')}
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
										<Zap className="w-4 h-4" />
										<span>{t('docs.sections.techStack.opencvTitle')}</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										{t('docs.sections.techStack.opencvDesc')}
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
										<Cpu className="w-4 h-4" />
										<span>{t('docs.sections.techStack.pureTsTitle')}</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										{t('docs.sections.techStack.pureTsDesc')}
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
										<Lock className="w-4 h-4" />
										<span>{t('docs.sections.techStack.dbTitle')}</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										{t('docs.sections.techStack.dbDesc')}
									</p>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 4: ARCHITECTURE */}
					{currentSection === 'architecture' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
									<span>{t('docs.sections.architecture.chapter')}</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									{t('docs.sections.architecture.title')}
								</h2>
							</div>

							{/* Directory Map */}
							<div className="space-y-3">
								<h3 className="text-sm font-bold text-white">
									{t('docs.sections.architecture.moduleTitle')}
								</h3>
								<pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">
									{`visionpass/
├── src/
│   ├── routes/              # TanStack Router (/, /playground, /docs, /r/$token)
│   ├── components/          # UI Components (Playground, ImagePicker, QrResult, Viewer)
│   ├── workers/             # OpenCV.js WASM ORB Feature Extraction Worker
│   ├── hooks/               # MediaStream, Barcode Scanner & Live ORB Hooks
│   ├── server/              # Nitro Server Functions
│   │   ├── crypto/          # CSPRNG Token, HMAC-SHA-256 & AES-256-GCM
│   │   ├── matcher/         # Pure TS Hamming KNN & RANSAC Homography Matcher
│   │   ├── db/              # PostgreSQL Drizzle Schema (credentials, audit logs)
│   │   └── functions/       # createServerFn Endpoints (create, verify, meta)
│   └── lib/                 # Shared Codecs, Constants & Zod Schemas`}
								</pre>
							</div>

							{/* Sequence Explanation */}
							<div className="space-y-4 pt-4 border-t border-slate-800">
								<h3 className="text-sm font-bold text-white">
									{t('docs.sections.architecture.sequenceTitle')}
								</h3>
								<div className="space-y-3 text-xs text-slate-300 leading-relaxed">
									<div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
										<div className="font-semibold text-indigo-300">
											{t('docs.sections.architecture.seq1Title')}
										</div>
										<p>{t('docs.sections.architecture.seq1Desc')}</p>
									</div>

									<div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
										<div className="font-semibold text-emerald-300">
											{t('docs.sections.architecture.seq2Title')}
										</div>
										<p>{t('docs.sections.architecture.seq2Desc')}</p>
									</div>
								</div>
							</div>
						</article>
					)}
				</div>
			</div>
		</div>
	)
}
