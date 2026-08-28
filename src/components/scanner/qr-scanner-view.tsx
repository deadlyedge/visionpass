import { AlertCircle, QrCode } from 'lucide-react'
import { useEffect } from 'react'
import { useBarcodeScanner } from '../../hooks/use-barcode-scanner'
import { useCameraStream } from '../../hooks/use-camera-stream'
import { CameraSourceSelect } from './camera-source-select'

export interface QrScannerViewProps {
	onDetected: (tokenOrUrl: string) => void
	onCancel?: () => void
}

export function QrScannerView({ onDetected }: QrScannerViewProps) {
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

	useBarcodeScanner({
		videoRef,
		enabled: isStreaming,
		onDetected: (code) => {
			stopStream()
			onDetected(code)
		},
	})

	useEffect(() => {
		startStream()
		return () => {
			stopStream()
		}
	}, [startStream, stopStream])

	return (
		<div className="space-y-4">
			{/* 取景器容器 */}
			<div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
				<video
					ref={videoRef}
					playsInline
					muted
					className="w-full h-full object-cover"
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

				{/* 扫描框 & 激光扫描动效 */}
				{isStreaming && (
					<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
						<div className="w-56 h-56 border-2 border-indigo-500/80 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.25)]">
							{/* 四角定位图标饰 */}
							<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
							<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
							<div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white" />
							<div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white" />

							{/* 激光扫描线动画 */}
							<div className="w-full h-0.5 bg-linear-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] animate-[scan_2s_ease-in-out_infinite]" />
						</div>
					</div>
				)}

				{/* 未开始或权限提示 */}
				{!isStreaming && !cameraError && (
					<div className="flex flex-col items-center gap-2 text-slate-400 text-sm">
						<QrCode className="w-8 h-8 text-indigo-400 animate-pulse" />
						<span>正在唤起摄像头...</span>
					</div>
				)}

				{cameraError && (
					<div className="p-6 text-center space-y-2 max-w-xs">
						<AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
						<p className="text-xs text-amber-300">{cameraError}</p>
					</div>
				)}
			</div>

			<p className="text-center text-xs text-slate-400">
				将视觉凭证上的二维码放入框内，即可自动识别跳转
			</p>
		</div>
	)
}
