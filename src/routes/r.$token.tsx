import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
	AlertCircle,
	Camera,
	FileImage,
	KeyRound,
	Lock,
	ShieldAlert,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ImagePicker } from '../components/image-picker'
import { ProcessingState } from '../components/processing-state'
import { CameraSourceSelect } from '../components/scanner/camera-source-select'
import { KeypointsCanvas } from '../components/viewer/keypoints-canvas'
import { SecretViewer } from '../components/viewer/secret-viewer'
import { useCameraStream } from '../hooks/use-camera-stream'
import { useLiveOrbMatcher } from '../hooks/use-live-orb-matcher'
import { useI18n } from '../i18n'
import { extractOrbFeatures } from '../lib/extract-orb'
import type { FeaturePayloadV1 } from '../lib/feature-schema'
import {
	getCredentialMetaFn,
	verifyCredentialFn,
} from '../server/functions/credentials'

export const Route = createFileRoute('/r/$token')({
	component: ReadRouteComponent,
})

function ReadRouteComponent() {
	const { token } = Route.useParams()
	return <ReadPage token={token} />
}

export function ReadPage({ token }: { token: string }) {
	const { t } = useI18n()
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
	const {
		data: meta,
		isLoading: isCheckingMeta,
		error: metaError,
	} = useQuery({
		queryKey: ['credentialMeta', token],
		queryFn: () => getCredentialMetaFn({ data: { token } }),
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
			console.debug('[Live Matcher] Verify request error:', err)
			return false
		}
	}

	const { isProcessingFrame, lastExtractedCount } = useLiveOrbMatcher({
		videoRef,
		active: isStreaming && inputMode === 'camera' && !revealedSecret,
		intervalMs: 800,
		onKeypointsExtracted: (kps, w, h) => {
			setLiveKeypoints(kps)
			setLiveCanvasSize({ w, h })
		},
		onFeatureReady: handleFeatureReady,
	})

	// 模式切换
	useEffect(() => {
		if (inputMode === 'camera' && !revealedSecret && meta?.exists) {
			startStream()
		} else {
			stopStream()
		}
		return () => {
			stopStream()
		}
	}, [inputMode, revealedSecret, meta?.exists, startStream, stopStream])

	// 4. 照片文件单次上传比对 Mutation
	const photoMutation = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error('请先选择验证图片')
			setErrorMessage(null)
			setVerificationFailed(false)
			setRevealedSecret(null)

			// Step 1: Web Worker 提取特征
			const { payload, previewUrl: scaledPreview } = await extractOrbFeatures(
				file,
				(msg) => setProgressMsg(msg),
			)
			setPreviewUrl(scaledPreview)

			// Step 2: 服务端几何比对
			setProgressMsg('正在进行 RANSAC 单应性几何一致性校验...')
			const result = await verifyCredentialFn({
				data: {
					token,
					feature: payload,
				},
			})

			return result
		},
		onSuccess: (result) => {
			setProgressMsg('')
			if (result.matched) {
				playSuccessBeep()
				setRevealedSecret(result.secret)
			} else {
				setVerificationFailed(true)
			}
		},
		onError: (err: any) => {
			setProgressMsg('')
			setErrorMessage(err.message || '验证过程发生错误，请重试')
		},
	})

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile)
		setPreviewUrl(URL.createObjectURL(selectedFile))
		setErrorMessage(null)
		setVerificationFailed(false)
	}

	if (isCheckingMeta) {
		return (
			<div className="max-w-xl mx-auto py-20 px-4 text-center">
				<ProcessingState message={t('r.statusChecking')} />
			</div>
		)
	}

	if (metaError || !meta?.exists) {
		return (
			<div className="max-w-xl mx-auto py-16 px-4">
				<div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
					<div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
						<ShieldAlert className="w-8 h-8" />
					</div>
					<h2 className="text-xl font-bold text-slate-100">
						{t('r.notFound')}
					</h2>
					<p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
						{t('r.notFoundDesc')}
					</p>
					<div className="pt-2">
						<a
							href="/playground?tab=verify"
							className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition border border-slate-700"
						>
							{t('r.goToPlayground')}
						</a>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-xl mx-auto py-8 px-4 space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400 mb-1">
					<Lock className="w-3.5 h-3.5" />
					<span>VisionPass · {t('r.title')}</span>
				</div>
				<h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
					{t('r.title')}
				</h1>
				<p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
					{t('r.subtitle')}
				</p>
			</div>

			{revealedSecret ? (
				<SecretViewer secret={revealedSecret} />
			) : (
				<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
					{/* 验证模式切换 */}
					<div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
						<button
							type="button"
							onClick={() => {
								setInputMode('camera')
								setVerificationFailed(false)
							}}
							className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
								inputMode === 'camera'
									? 'bg-indigo-600 text-white shadow'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							<Camera className="w-3.5 h-3.5" />
							<span>{t('r.inputModeCamera')}</span>
						</button>
						<button
							type="button"
							onClick={() => {
								setInputMode('photo')
								setVerificationFailed(false)
							}}
							className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
								inputMode === 'photo'
									? 'bg-indigo-600 text-white shadow'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							<FileImage className="w-3.5 h-3.5" />
							<span>{t('r.inputModeImage')}</span>
						</button>
					</div>

					{/* Mode A: 实时摄像头对准识别 */}
					{inputMode === 'camera' && (
						<div className="space-y-4">
							<div
								className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border transition-all duration-300 ${
									verificationFailed
										? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
										: isProcessingFrame
											? 'border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
											: 'border-slate-800'
								}`}
							>
								<video
									ref={videoRef}
									playsInline
									muted
									className="w-full h-full object-cover"
								/>

								{/* 实时 ORB 关键点散点图 */}
								<KeypointsCanvas
									keypoints={liveKeypoints}
									sourceWidth={liveCanvasSize.w}
									sourceHeight={liveCanvasSize.h}
								/>

								{/* 摄像头多设备切换浮层 */}
								{devices.length > 1 && (
									<div className="absolute top-3 right-3 z-20">
										<CameraSourceSelect
											devices={devices}
											activeDeviceId={activeDeviceId}
											onSelectDevice={setActiveDeviceId}
										/>
									</div>
								)}

								{/* 状态徽标 */}
								<div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
									<span
										className={`w-2 h-2 rounded-full ${
											lastExtractedCount >= 20
												? 'bg-emerald-400 animate-pulse'
												: 'bg-amber-400'
										}`}
									/>
									<span>
										{t('r.matchingLive', { count: lastExtractedCount })}
									</span>
								</div>

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
											onClick={() => setInputMode('photo')}
											className="mt-2 text-xs text-indigo-400 underline"
										>
											切换为相册选取图片
										</button>
									</div>
								)}
							</div>

							{verificationFailed && (
								<div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
									<AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
									<span>{t('r.alignPrompt')}</span>
								</div>
							)}
						</div>
					)}

					{/* Mode B: 相册选择验证 */}
					{inputMode === 'photo' && (
						<form
							onSubmit={(e) => {
								e.preventDefault()
								photoMutation.mutate()
							}}
							className="space-y-6"
						>
							<ImagePicker
								label={t('r.inputModeImage')}
								previewUrl={previewUrl}
								onFileSelect={handleFileSelect}
								disabled={photoMutation.isPending}
							/>

							{verificationFailed && (
								<div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
									<div className="font-semibold flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
										<span>{t('common.error')}</span>
									</div>
									<p className="text-amber-400/80">{t('r.alignPrompt')}</p>
								</div>
							)}

							{errorMessage && (
								<div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
									<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
									<span>{errorMessage}</span>
								</div>
							)}

							{photoMutation.isPending && (
								<ProcessingState
									message={progressMsg || t('common.processing')}
								/>
							)}

							<button
								type="submit"
								disabled={!file || photoMutation.isPending}
								className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
							>
								<KeyRound className="w-4 h-4" />
								{photoMutation.isPending
									? t('common.processing')
									: t('r.title')}
							</button>
						</form>
					)}
				</div>
			)}
		</div>
	)
}
