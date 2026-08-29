import { useMutation, useQuery } from '@tanstack/react-query'
import {
	AlertCircle,
	Camera,
	KeyRound,
	Lock,
	RefreshCw,
	Sparkles,
	Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCameraStream } from '../../hooks/use-camera-stream'
import { useLiveOrbMatcher } from '../../hooks/use-live-orb-matcher'
import { extractOrbFeatures } from '../../lib/extract-orb'
import type { FeaturePayloadV1 } from '../../lib/feature-schema'
import {
	getCredentialMetaFn,
	verifyCredentialFn,
} from '../../server/functions/credentials'
import { ImagePicker } from '../image-picker'
import { ProcessingState } from '../processing-state'
import { CameraSourceSelect } from '../scanner/camera-source-select'
import { QrScannerView } from '../scanner/qr-scanner-view'
import { KeypointsCanvas } from '../viewer/keypoints-canvas'
import { SecretViewer } from '../viewer/secret-viewer'

interface ReadSectionProps {
	initialPasscode?: string
}

export function ReadSection({ initialPasscode = '' }: ReadSectionProps) {
	const [token, setToken] = useState(initialPasscode.trim())
	const [tokenLocked, setTokenLocked] = useState(!!initialPasscode.trim())
	const [inputMode, setInputMode] = useState<'camera' | 'photo'>('camera')
	const [file, setFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [progressMsg, setProgressMsg] = useState<string>('')
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
	const [verificationFailed, setVerificationFailed] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	// 实时特征点绘制状态
	const [liveKeypoints, setLiveKeypoints] = useState<
		Array<{ x: number; y: number }>
	>([])
	const [liveCanvasSize, setLiveCanvasSize] = useState<{
		w: number
		h: number
	}>({ w: 640, h: 480 })

	// 音频提示音与播放防重锁
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

	// 1. 凭证元数据有效性查询
	const { data: meta } = useQuery({
		queryKey: ['credentialMeta', token],
		queryFn: () => getCredentialMetaFn({ data: { token } }),
		enabled: !!token && tokenLocked,
		retry: false,
	})

	// 2. 摄像头媒体流
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

	// 3. 实时视频流 ORB 自动抽帧比对 Hook
	const handleFeatureReady = async (
		payload: FeaturePayloadV1,
	): Promise<boolean> => {
		if (isMatchedFinishedRef.current) return true

		try {
			const result = await verifyCredentialFn({
				data: {
					token,
					feature: payload,
				},
			})

			if (result.matched && !isMatchedFinishedRef.current) {
				isMatchedFinishedRef.current = true
				playSuccessBeep()
				setRevealedSecret(result.secret)
				stopStream()
				return true
			}
			setVerificationFailed(true)
			return false
		} catch (err: any) {
			console.error('实时抽帧比对异常:', err)
			return false
		}
	}

	const { isProcessingFrame, lastExtractedCount } = useLiveOrbMatcher({
		videoRef,
		active:
			isStreaming &&
			inputMode === 'camera' &&
			tokenLocked &&
			!!meta?.exists &&
			!revealedSecret,
		onFeatureReady: handleFeatureReady,
		onKeypointsExtracted: (xy: any, w: number, h: number) => {
			setLiveCanvasSize({ w, h })
			const pts: Array<{ x: number; y: number }> = []
			for (let i = 0; i < xy.length; i += 2) {
				pts.push({ x: xy[i] as number, y: xy[i + 1] as number })
			}
			setLiveKeypoints(pts)
		},
	})

	// 切换模式管理流
	useEffect(() => {
		if (
			inputMode === 'camera' &&
			!revealedSecret &&
			tokenLocked &&
			meta?.exists
		) {
			startStream()
		} else if (inputMode === 'photo') {
			stopStream()
		}
	}, [
		inputMode,
		revealedSecret,
		tokenLocked,
		meta?.exists,
		startStream,
		stopStream,
	])

	// 4. 照片单张提交验证
	const photoMutation = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error('请先选取一张验证图片')
			setErrorMessage(null)
			setVerificationFailed(false)

			const { payload } = await extractOrbFeatures(file, (msg) =>
				setProgressMsg(msg),
			)

			setProgressMsg('正在与服务端进行几何一致性比对...')
			const result = await verifyCredentialFn({
				data: {
					token,
					feature: payload,
				},
			})

			if (result.matched) {
				playSuccessBeep()
				return result.secret
			}
			setVerificationFailed(true)
			throw new Error('未识别到匹配的主体，几何一致性未达标')
		},
		onSuccess: (secret) => {
			setProgressMsg('')
			setRevealedSecret(secret)
		},
		onError: (err: any) => {
			setProgressMsg('')
			setErrorMessage(err.message || '比对未通过，请调整角度与光线后重试')
		},
	})

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile)
		setPreviewUrl(URL.createObjectURL(selectedFile))
		setErrorMessage(null)
		setVerificationFailed(false)
	}

	const handleScanDetected = (detectedToken: string) => {
		let clean = detectedToken.trim()
		if (clean.includes('/r/')) {
			const parts = clean.split('/r/')
			clean = parts[parts.length - 1].split('?')[0].split('#')[0]
		}
		if (clean) {
			setToken(clean)
			setTokenLocked(true)
			setErrorMessage(null)
			setVerificationFailed(false)
		}
	}

	const handleResetAll = () => {
		setRevealedSecret(null)
		setToken('')
		setTokenLocked(false)
		setFile(null)
		setPreviewUrl(null)
		setErrorMessage(null)
		setVerificationFailed(false)
		setProgressMsg('')
		isMatchedFinishedRef.current = false
		hasPlayedBeepRef.current = false
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{revealedSecret ? (
				<div className="space-y-4">
					<SecretViewer secret={revealedSecret} />
					<div className="text-center pt-2">
						<button
							type="button"
							onClick={handleResetAll}
							className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition inline-flex items-center gap-1.5"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							验证下一份凭证
						</button>
					</div>
				</div>
			) : (
				<div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
					{/* Step 1: Token 输入或扫码锁定 */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
								1. 凭证 Token (扫码自动填入或手动输入)
							</span>
							{tokenLocked && (
								<button
									type="button"
									onClick={() => {
										setTokenLocked(false)
										setVerificationFailed(false)
									}}
									className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
								>
									<RefreshCw className="w-3 h-3" />
									更换 Token
								</button>
							)}
						</div>

						{!tokenLocked ? (
							<div className="space-y-4">
								<div className="flex gap-2">
									<div className="relative flex-1">
										<KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
										<input
											type="text"
											value={token}
											onChange={(e) => {
												setToken(e.target.value)
												setErrorMessage(null)
											}}
											placeholder="输入凭证 Token 或粘贴完整链接"
											className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
										/>
									</div>
									<button
										type="button"
										onClick={() => {
											if (token.trim()) {
												let clean = token.trim()
												if (clean.includes('/r/')) {
													clean = clean.split('/r/')[1].split('?')[0]
												}
												setToken(clean)
												setTokenLocked(true)
											}
										}}
										disabled={!token.trim()}
										className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl text-xs sm:text-sm transition whitespace-nowrap"
									>
										锁定并查询
									</button>
								</div>

								{/* 扫码快速填入组件 */}
								<div className="pt-2">
									<div className="text-[11px] text-slate-400 mb-2">
										或者通过摄像头直接扫描凭证二维码：
									</div>
									<QrScannerView onDetected={handleScanDetected} />
								</div>
							</div>
						) : (
							<div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
								<div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
									<Lock className="w-3.5 h-3.5 text-indigo-400" />
									<span>Token: {token}</span>
								</div>
								<span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
									凭证已锁定
								</span>
							</div>
						)}
					</div>

					{/* Step 2: 验证方式 (当锁定 Token 后开放) */}
					{tokenLocked && (
						<div className="space-y-4 pt-4 border-t border-slate-800/80">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
									2. 视觉特征比对解锁
								</span>
								<div className="inline-flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
									<button
										type="button"
										onClick={() => setInputMode('camera')}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
											inputMode === 'camera'
												? 'bg-indigo-600 text-white'
												: 'text-slate-400 hover:text-slate-200'
										}`}
									>
										<Camera className="w-3.5 h-3.5" />
										摄像头实时流
									</button>
									<button
										type="button"
										onClick={() => setInputMode('photo')}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
											inputMode === 'photo'
												? 'bg-indigo-600 text-white'
												: 'text-slate-400 hover:text-slate-200'
										}`}
									>
										<Upload className="w-3.5 h-3.5" />
										相册/拍照上传
									</button>
								</div>
							</div>

							{/* Mode A: 摄像头取景与特征实时散点 */}
							{inputMode === 'camera' && (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<CameraSourceSelect
											devices={devices}
											activeDeviceId={activeDeviceId}
											onSelectDevice={setActiveDeviceId}
										/>
										<div className="flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
											<Sparkles className="w-3 h-3 animate-spin" />
											<span>正在抽帧几何校验</span>
										</div>
									</div>

									<div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
										<video
											ref={videoRef}
											playsInline
											muted
											autoPlay
											className="w-full h-full object-cover"
										/>

										{/* 星空特征点渲染 */}
										<KeypointsCanvas
											keypoints={liveKeypoints}
											sourceWidth={liveCanvasSize.w}
											sourceHeight={liveCanvasSize.h}
										/>

										{/* 底部特征提取状态小药丸 */}
										<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 bg-slate-950/80 backdrop-blur-md rounded-xl text-[11px] text-slate-300 border border-slate-800">
											<div className="flex items-center gap-2">
												<div
													className={`w-2 h-2 rounded-full ${
														isProcessingFrame
															? 'bg-indigo-400 animate-ping'
															: 'bg-emerald-400'
													}`}
												/>
												<span>特征点数: {lastExtractedCount}</span>
											</div>
											<span className="text-slate-400">
												{lastExtractedCount < 15
													? '请对准主体并保持光线充足'
													: '自动几何单应性比对中'}
											</span>
										</div>
									</div>

									{cameraError && (
										<div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
											<AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
											<span>{cameraError}</span>
										</div>
									)}
								</div>
							)}

							{/* Mode B: 相册/单张上传 */}
							{inputMode === 'photo' && (
								<form
									onSubmit={(e) => {
										e.preventDefault()
										photoMutation.mutate()
									}}
									className="space-y-4"
								>
									<ImagePicker
										label="选择需要比对验证的物理画面"
										previewUrl={previewUrl}
										onFileSelect={handleFileSelect}
										disabled={photoMutation.isPending}
									/>

									<button
										type="submit"
										disabled={!file || photoMutation.isPending}
										className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
									>
										<KeyRound className="w-4 h-4" />
										{photoMutation.isPending
											? '正在比对几何特征...'
											: '执行比对并解锁密语'}
									</button>
								</form>
							)}
						</div>
					)}

					{/* Feedback Alerts */}
					{verificationFailed && (
						<div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
							<AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
							<div>
								<div className="font-semibold">特征比对未通过</div>
								<p className="text-amber-400/80 mt-0.5">
									未能匹配到足够的几何一致性内点。请确保光线充足、将镜头正对目标画面并避免严重反光。
								</p>
							</div>
						</div>
					)}

					{errorMessage && (
						<div className="p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
							<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
							<span>{errorMessage}</span>
						</div>
					)}

					{photoMutation.isPending && (
						<ProcessingState message={progressMsg || '正在处理中...'} />
					)}
				</div>
			)}
		</div>
	)
}
