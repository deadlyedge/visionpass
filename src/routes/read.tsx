import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	AlertCircle,
	ArrowRight,
	Camera,
	CheckCircle2,
	KeyRound,
	QrCode,
	RefreshCw,
	Shield,
	Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CameraSourceSelect } from '../components/scanner/camera-source-select'
import { KeypointsCanvas } from '../components/viewer/keypoints-canvas'
import { SecretViewer } from '../components/viewer/secret-viewer'
import { useBarcodeScanner } from '../hooks/use-barcode-scanner'
import { useCameraStream } from '../hooks/use-camera-stream'
import { useLiveOrbMatcher } from '../hooks/use-live-orb-matcher'
import type { FeaturePayloadV1 } from '../lib/feature-schema'
import {
	getCredentialMetaFn,
	verifyCredentialFn,
} from '../server/functions/credentials'

export const Route = createFileRoute('/read')({
	component: ReadIndexPage,
})

// 流水线状态机
type WorkflowState =
	| 'scanning_qr' // 阶段 1: 扫描二维码寻找口令
	| 'verifying_passcode' // 阶段 2: 正在后端验证口令是否有效 (视频流保持开启)
	| 'matching_features' // 阶段 3: 口令匹配成功，持续对准画面进行 RANSAC 特征比对
	| 'unlocked' // 阶段 4: 密语解锁成功

export function ReadIndexPage() {
	const navigate = useNavigate()
	const [tab, setTab] = useState<'scan' | 'passcode'>('scan')
	const [passcode, setPasscode] = useState('')
	const [activeToken, setActiveToken] = useState<string | null>(null)
	const [workflowState, setWorkflowState] =
		useState<WorkflowState>('scanning_qr')

	const [isQuerying, setIsQuerying] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [featureMatchFailed, setFeatureMatchFailed] = useState(false)
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

	// 实时特征点绘制状态
	const [liveKeypoints, setLiveKeypoints] = useState<
		Array<{ x: number; y: number }>
	>([])
	const [liveCanvasSize, setLiveCanvasSize] = useState<{
		w: number
		h: number
	}>({ w: 640, h: 480 })

	// 音频提示与播放防重锁
	const beepAudioRef = useRef<HTMLAudioElement | null>(null)
	const hasPlayedBeepRef = useRef(false)
	const isMatchedFinishedRef = useRef(false)

	useEffect(() => {
		if (typeof window !== 'undefined') {
			beepAudioRef.current = new Audio('/audio/beep.mp3')
		}
	}, [])

	const playSuccessBeep = () => {
		if (hasPlayedBeepRef.current) return
		hasPlayedBeepRef.current = true
		try {
			if (beepAudioRef.current) {
				beepAudioRef.current.currentTime = 0
				beepAudioRef.current.play().catch(() => {})
			}
		} catch (_err) {}
	}

	// 1. 全程复用单条摄像头流
	const {
		videoRef,
		devices,
		activeDeviceId,
		setActiveDeviceId,
		isStreaming,
		startStream,
		stopStream,
		error: cameraError,
	} = useCameraStream({ idealFacingMode: 'environment' })

	// 2. 扫码引擎 (仅在 scanning_qr 阶段激活抽帧)
	useBarcodeScanner({
		videoRef,
		enabled: isStreaming && tab === 'scan' && workflowState === 'scanning_qr',
		scanIntervalMs: 120,
		onDetected: (tokenOrUrl) => {
			handleQrCodeDetected(tokenOrUrl)
		},
	})

	// 3. 视觉特征比对回调 (仅在 matching_features 阶段触发)
	const handleFeatureReady = async (
		payload: FeaturePayloadV1,
	): Promise<boolean> => {
		if (!activeToken || isMatchedFinishedRef.current) return true

		try {
			const result = await verifyCredentialFn({
				data: {
					token: activeToken,
					feature: payload,
				},
			})

			if (result.matched && !isMatchedFinishedRef.current) {
				isMatchedFinishedRef.current = true
				playSuccessBeep()
				setRevealedSecret(result.secret)
				setWorkflowState('unlocked')
				stopStream() // 解密完成后关闭摄像头节省资源
				return true
			}
			setFeatureMatchFailed(true)
			return false
		} catch (err: any) {
			console.debug('[Live Matcher] 抽帧比对异常:', err)
			return false
		}
	}

	const { isProcessingFrame, lastExtractedCount } = useLiveOrbMatcher({
		videoRef,
		active:
			isStreaming && tab === 'scan' && workflowState === 'matching_features',
		intervalMs: 800,
		onKeypointsExtracted: (kps, w, h) => {
			setLiveKeypoints(kps)
			setLiveCanvasSize({ w, h })
		},
		onFeatureReady: handleFeatureReady,
	})

	// 开启/绑定摄像头：只要处于扫码 Tab 且未解锁，确保视频已连接
	useEffect(() => {
		if (tab === 'scan' && workflowState !== 'unlocked') {
			startStream()
		} else if (workflowState === 'unlocked' || tab !== 'scan') {
			stopStream()
		}
	}, [tab, workflowState, startStream, stopStream])

	// 处理扫码命中 (不关闭摄像头，直接在画面上浮动状态)
	const handleQrCodeDetected = async (tokenOrUrl: string) => {
		let token = tokenOrUrl.trim()
		if (token.includes('/r/')) {
			const parts = token.split('/r/')
			token = parts[1]?.split('?')[0]?.split('#')[0] || ''
		}

		if (!token) return

		setActiveToken(token)
		setWorkflowState('verifying_passcode')
		setError(null)
		setFeatureMatchFailed(false)

		try {
			// 后端静默快速校验口令凭证有效性
			const meta = await getCredentialMetaFn({ data: { token } })
			if (meta.exists) {
				// 口令匹配成功，立即无缝转入视觉对准比对，摄像头完全不中断！
				setWorkflowState('matching_features')
			} else {
				setError('扫描到的口令无效或已过期，请重新扫描')
				setWorkflowState('scanning_qr')
			}
		} catch (err: any) {
			setError(err.message || '凭证校验失败')
			setWorkflowState('scanning_qr')
		}
	}

	// 处理手动 Passcode 输入提交
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

	// 重新开始扫码
	const handleRestartScan = () => {
		setActiveToken(null)
		setRevealedSecret(null)
		setError(null)
		setFeatureMatchFailed(false)
		setLiveKeypoints([])
		setWorkflowState('scanning_qr')
		// 确保重新挂载并播放视频流
		setTimeout(() => {
			startStream()
		}, 0)
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
					{workflowState === 'matching_features'
						? '对准画面解锁密语'
						: '读取视觉密语'}
				</h1>
				<p className="text-slate-400 text-xs">
					{workflowState === 'matching_features'
						? '已锁定口令，将镜头对准参考画面即可完成解密。'
						: '扫描凭证二维码直接进入，或输入展示口令进行检索。'}
				</p>
			</div>

			{/* 如果已经解锁，展示密语卡片 */}
			{workflowState === 'unlocked' && revealedSecret ? (
				<div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
					<SecretViewer secret={revealedSecret} />
					<button
						type="button"
						onClick={handleRestartScan}
						className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						<span>继续扫描下一个视觉密语</span>
					</button>
				</div>
			) : (
				<>
					{/* Tab 切换 (在特征匹配中隐藏 Tab 避免误触) */}
					{workflowState === 'scanning_qr' && (
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
					)}

					{/* 错误提示 */}
					{error && (
						<div className="flex items-start gap-3 p-3.5 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
							<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
							<span>{error}</span>
						</div>
					)}

					{/* Tab 1: 一体化沉浸式扫码与特征比对视图 (摄像头全程不中断) */}
					{tab === 'scan' && (
						<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm space-y-4">
							{/* 取景器容器 */}
							<div
								className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border transition-all duration-300 ${
									workflowState === 'matching_features'
										? featureMatchFailed
											? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
											: 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
										: 'border-slate-800'
								}`}
							>
								<video
									ref={videoRef}
									playsInline
									muted
									className="w-full h-full object-cover"
								/>

								{/* 阶段 3: 实时 ORB 散点星空图 */}
								{workflowState === 'matching_features' && (
									<KeypointsCanvas
										keypoints={liveKeypoints}
										sourceWidth={liveCanvasSize.w}
										sourceHeight={liveCanvasSize.h}
									/>
								)}

								{/* 摄像头多设备切换浮层 */}
								{devices.length > 1 && (
									<div className="absolute top-3 right-3 z-30">
										<CameraSourceSelect
											devices={devices}
											activeDeviceId={activeDeviceId}
											onSelectDevice={setActiveDeviceId}
										/>
									</div>
								)}

								{/* 阶段 1 动效: QR 激光扫描框 */}
								{workflowState === 'scanning_qr' && isStreaming && (
									<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
										<div className="w-52 h-52 border-2 border-indigo-500/80 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.25)]">
											<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
											<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
											<div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white" />
											<div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white" />
											<div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] animate-[scan_2s_ease-in-out_infinite]" />
										</div>
									</div>
								)}

								{/* 阶段 2 悬浮指示: 识别到口令，正在连接凭证 (视频不中断) */}
								{workflowState === 'verifying_passcode' && (
									<div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-20">
										<div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl px-5 py-4 text-center space-y-2 shadow-2xl animate-in fade-in zoom-in-95">
											<div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-spin">
												<RefreshCw className="w-4 h-4" />
											</div>
											<div className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1.5 font-mono">
												<span>已识别口令:</span>
												<span className="text-indigo-400">{activeToken}</span>
											</div>
											<p className="text-[11px] text-slate-400">
												正在连接安全凭证...
											</p>
										</div>
									</div>
								)}

								{/* 阶段 3 顶部常驻状态条: 口令已锁定，保持对准 */}
								{workflowState === 'matching_features' && (
									<div className="absolute top-3 left-3 right-16 z-20 flex items-center gap-2">
										<div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
											<span className="text-[11px] font-mono text-emerald-300 font-semibold truncate">
												{activeToken}
											</span>
											<span className="text-[10px] text-slate-400">
												· 视觉对准中
											</span>
										</div>
									</div>
								)}

								{/* 阶段 3 底部特征点统计徽标 */}
								{workflowState === 'matching_features' && (
									<div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none z-20">
										<span
											className={`w-2 h-2 rounded-full ${
												lastExtractedCount >= 20
													? 'bg-emerald-400 animate-pulse'
													: 'bg-amber-400'
											}`}
										/>
										<span>
											检测到特征点: {lastExtractedCount}
											{lastExtractedCount < 20
												? ' (请靠近主体)'
												: isProcessingFrame
													? ' (比对中)'
													: ' (对准中)'}
										</span>
									</div>
								)}

								{/* 摄像头加载或异常提示 */}
								{!isStreaming && !cameraError && (
									<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
										<Camera className="w-8 h-8 text-indigo-400 animate-pulse" />
										<span>正在调起摄像头取景器...</span>
									</div>
								)}

								{cameraError && (
									<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 bg-slate-950/90">
										<AlertCircle className="w-8 h-8 text-amber-400" />
										<p className="text-xs text-amber-300">{cameraError}</p>
										<button
											type="button"
											onClick={() => setTab('passcode')}
											className="mt-2 text-xs text-indigo-400 underline"
										>
											切换为手动输入口令
										</button>
									</div>
								)}
							</div>

							{/* 底部交互指引与切换 */}
							<div className="text-center space-y-2">
								{workflowState === 'scanning_qr' && (
									<p className="text-xs text-slate-400">
										对准凭证上的二维码，识别后将直接开启图像比对
									</p>
								)}

								{workflowState === 'matching_features' && (
									<div className="space-y-2">
										{featureMatchFailed && (
											<div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-center gap-2">
												<AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
												<span>
													未识别到匹配的主体，请将镜头保持平稳、对准画面中心
												</span>
											</div>
										)}
										<div className="flex items-center justify-between text-xs pt-1">
											<span className="text-slate-400 flex items-center gap-1">
												<Sparkles className="w-3.5 h-3.5 text-emerald-400" />
												保持镜头正对参考画面
											</span>
											<button
												type="button"
												onClick={handleRestartScan}
												className="text-indigo-400 hover:text-indigo-300 transition underline"
											>
												重新扫码
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Tab 2: 手动输入口令 */}
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
										setPasscode(
											e.target.value.toUpperCase().replace(/\s+/g, ''),
										)
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
				</>
			)}
		</div>
	)
}
