import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, KeyRound, QrCode, Shield } from 'lucide-react'
import { useState } from 'react'
import { QrScannerView } from '../components/scanner/qr-scanner-view'
import { getCredentialMetaFn } from '../server/functions/credentials'

export const Route = createFileRoute('/read')({
	component: ReadIndexPage,
})

export function ReadIndexPage() {
	const navigate = useNavigate()
	const [tab, setTab] = useState<'scan' | 'passcode'>('scan')
	const [passcode, setPasscode] = useState('')
	const [isQuerying, setIsQuerying] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// 处理扫码命中
	const handleQrDetected = (tokenOrUrl: string) => {
		setError(null)
		try {
			let token = tokenOrUrl.trim()
			// 如果是完整 URL 形如 http.../r/:token
			if (token.includes('/r/')) {
				const parts = token.split('/r/')
				token = parts[1]?.split('?')[0]?.split('#')[0] || ''
			}

			if (token) {
				navigate({ to: '/r/$token', params: { token } })
			} else {
				setError('未识别到有效的视觉凭证链接')
			}
		} catch (_err) {
			setError('解析二维码内容失败，请重试')
		}
	}

	// 处理手动 Passcode 查询
	const handlePasscodeSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const formattedPasscode = passcode.trim().toUpperCase()
		if (!formattedPasscode) return

		setIsQuerying(true)
		setError(null)

		try {
			const res = await getCredentialMetaFn({
				data: { token: formattedPasscode },
			})

			if (res.exists) {
				// 跳转至凭证读取页（支持 Passcode 作为索引）
				navigate({ to: '/r/$token', params: { token: formattedPasscode } })
			} else {
				setError('未找到该口令对应的有效凭证，请核对后重试')
			}
		} catch (err: any) {
			setError(err.message || '查询口令凭证失败')
		} finally {
			setIsQuerying(false)
		}
	}

	return (
		<div className="max-w-md mx-auto py-8 px-4 space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400 mb-1">
					<Shield className="w-3.5 h-3.5" />
					<span>视觉凭证检索通道</span>
				</div>
				<h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
					读取视觉密语
				</h1>
				<p className="text-slate-400 text-xs">
					扫描凭证二维码直接进入，或输入展示口令进行检索。
				</p>
			</div>

			{/* Tab 切换 */}
			<div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
				<button
					type="button"
					onClick={() => {
						setTab('scan')
						setError(null)
					}}
					className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
						tab === 'scan'
							? 'bg-indigo-600 text-white shadow'
							: 'text-slate-400 hover:text-slate-200'
					}`}
				>
					<QrCode className="w-4 h-4" />
					<span>相机扫码识别</span>
				</button>
				<button
					type="button"
					onClick={() => {
						setTab('passcode')
						setError(null)
					}}
					className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
						tab === 'passcode'
							? 'bg-indigo-600 text-white shadow'
							: 'text-slate-400 hover:text-slate-200'
					}`}
				>
					<KeyRound className="w-4 h-4" />
					<span>输入展示口令</span>
				</button>
			</div>

			{/* 错误提示 */}
			{error && (
				<div className="flex items-start gap-3 p-3.5 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
					<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
					<span>{error}</span>
				</div>
			)}

			{/* Tab 1: 扫码识别 */}
			{tab === 'scan' && (
				<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
					<QrScannerView onDetected={handleQrDetected} />
				</div>
			)}

			{/* Tab 2: 口令输入 */}
			{tab === 'passcode' && (
				<form
					onSubmit={handlePasscodeSubmit}
					className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-sm"
				>
					<div className="space-y-2">
						<label
							htmlFor="passcode-input"
							className="block text-xs font-medium text-slate-300"
						>
							10~12 位展示口令 (Base32 格式)
						</label>
						<input
							id="passcode-input"
							type="text"
							value={passcode}
							onChange={(e) =>
								setPasscode(e.target.value.toUpperCase().replace(/\s+/g, ''))
							}
							placeholder="例如: 8A2B3C4D5E"
							className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base font-mono tracking-widest text-slate-100 uppercase placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<p className="text-[11px] text-slate-500">
							可向凭证创建者索取卡片底部附带的备用展示口令。
						</p>
					</div>

					<button
						type="submit"
						disabled={!passcode.trim() || isQuerying}
						className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
					>
						{isQuerying ? (
							<span>正在检索凭证...</span>
						) : (
							<>
								<span>检索凭证并开始验证</span>
								<ArrowRight className="w-4 h-4" />
							</>
						)}
					</button>
				</form>
			)}
		</div>
	)
}
