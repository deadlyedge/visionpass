import {
	Check,
	Copy,
	Download,
	ExternalLink,
	Palette,
	QrCode,
	RotateCcw,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { PosterGenerator } from './poster/poster-generator'

export interface QrResultProps {
	readUrl: string
	displayPasscode?: string
	referenceImageUrl?: string | null
	onReset: () => void
}

export function QrResult({
	readUrl,
	displayPasscode,
	referenceImageUrl,
	onReset,
}: QrResultProps) {
	const { t } = useI18n()
	const [qrDataUrl, setQrDataUrl] = useState<string>('')
	const [copied, setCopied] = useState(false)
	const [showPosterMode, setShowPosterMode] = useState(false)

	// 二维码仅包含口令 (displayPasscode)，抗封阻、去中心化且矩阵稀疏易扫描
	useEffect(() => {
		const qrContent = displayPasscode || readUrl
		QRCode.toDataURL(qrContent, {
			width: 512,
			margin: 2,
			color: {
				dark: '#0f172a',
				light: '#ffffff',
			},
		})
			.then((url) => setQrDataUrl(url))
			.catch((err) => console.error('生成二维码失败:', err))
	}, [displayPasscode, readUrl])

	const handleCopyPasscode = async () => {
		if (!displayPasscode) return
		try {
			await navigator.clipboard.writeText(displayPasscode)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('复制口令失败:', err)
		}
	}

	const handleDownloadQr = () => {
		if (!qrDataUrl) return
		const a = document.createElement('a')
		a.href = qrDataUrl
		a.download = `VisionPass-${displayPasscode || Date.now()}.png`
		a.click()
	}

	return (
		<div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
			{/* 模式切换 Tab */}
			{referenceImageUrl && (
				<div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
					<button
						type="button"
						onClick={() => setShowPosterMode(false)}
						className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
							!showPosterMode
								? 'bg-indigo-600 text-white shadow'
								: 'text-slate-400 hover:text-slate-200'
						}`}
					>
						<QrCode className="w-3.5 h-3.5" />
						<span>{t('playground.result.directUrl')}</span>
					</button>
					<button
						type="button"
						onClick={() => setShowPosterMode(true)}
						className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
							showPosterMode
								? 'bg-indigo-600 text-white shadow'
								: 'text-slate-400 hover:text-slate-200'
						}`}
					>
						<Palette className="w-3.5 h-3.5" />
						<span>{t('playground.result.qrPosterBtn')}</span>
					</button>
				</div>
			)}

			{showPosterMode && referenceImageUrl ? (
				<PosterGenerator
					referenceImageUrl={referenceImageUrl}
					readUrl={readUrl}
					displayPasscode={displayPasscode}
				/>
			) : (
				<>
					<div className="text-center space-y-1">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
							{t('playground.create.extractSuccess')}
						</div>
						<h2 className="text-xl font-bold text-slate-100">
							{t('playground.result.title')}
						</h2>
						<h2 className="text-xl font-bold text-slate-100">
							{t('playground.result.title')}
						</h2>
						<p className="text-xs text-slate-400 max-w-sm mx-auto">
							{t('playground.result.passcodeDesc')}
						</p>
					</div>

					{/* QR 码展示 (1:1 纯口令正方形二维码) */}
					<div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner max-w-xs mx-auto">
						{qrDataUrl ? (
							<img
								src={qrDataUrl}
								alt="凭证二维码"
								className="w-56 h-56 object-contain rounded-lg"
							/>
						) : (
							<div className="w-56 h-56 flex items-center justify-center text-slate-400">
								<QrCode className="w-8 h-8 animate-pulse text-indigo-500" />
							</div>
						)}
						{displayPasscode && (
							<div className="mt-3 text-xs font-mono font-bold tracking-widest text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-300 select-all">
								{displayPasscode}
							</div>
						)}
					</div>

					{/* 口令与直达链接卡片 */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-slate-400">
							<label htmlFor="passcode-display" className="font-medium">
								{t('playground.result.passcodeTitle')}
							</label>
							<span className="text-slate-500">
								{t('playground.result.passcodeDesc')}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<input
								id="passcode-display"
								type="text"
								readOnly
								value={displayPasscode || readUrl}
								className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono tracking-wider select-all focus:outline-none"
							/>
							<button
								type="button"
								onClick={handleCopyPasscode}
								className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0"
							>
								{copied ? (
									<>
										<Check className="w-3.5 h-3.5 text-emerald-400" />
										<span className="text-emerald-400">
											{t('common.copied')}
										</span>
									</>
								) : (
									<>
										<Copy className="w-3.5 h-3.5 text-slate-400" />
										<span>{t('playground.result.copyPasscode')}</span>
									</>
								)}
							</button>
						</div>
					</div>

					{/* 快捷操作区 */}
					<div className="grid grid-cols-2 gap-3 pt-2">
						<button
							type="button"
							onClick={handleDownloadQr}
							className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 border border-slate-700"
						>
							<Download className="w-3.5 h-3.5 text-indigo-400" />
							{t('common.download')} QR
						</button>
						<a
							href={readUrl}
							target="_blank"
							rel="noreferrer"
							className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 border border-slate-700"
						>
							<ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
							{t('playground.result.directUrl')}
						</a>
					</div>
				</>
			)}

			{/* 重置返回按钮 */}
			<div className="pt-4 border-t border-slate-800/80">
				<button
					type="button"
					onClick={onReset}
					className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
				>
					<RotateCcw className="w-3.5 h-3.5" />
					{t('playground.result.createNew')}
				</button>
			</div>
		</div>
	)
}
