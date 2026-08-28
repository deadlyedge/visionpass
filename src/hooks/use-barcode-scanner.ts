import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'

export interface UseBarcodeScannerOptions {
	videoRef: React.RefObject<HTMLVideoElement | null>
	enabled: boolean
	onDetected: (tokenOrUrl: string) => void
	scanIntervalMs?: number
}

// 扩展 BarcodeDetector 类型
declare global {
	interface Window {
		BarcodeDetector?: any
	}
}

export function useBarcodeScanner({
	videoRef,
	enabled,
	onDetected,
	scanIntervalMs = 120, // 高频抽帧扫码 (约 8fps)
}: UseBarcodeScannerOptions) {
	const [isScanning, setIsScanning] = useState(false)
	const [scannerEngine, setScannerEngine] = useState<
		'native' | 'jsqr' | 'unsupported'
	>('unsupported')

	const detectorRef = useRef<any>(null)
	const timerRef = useRef<any>(null)
	const isProcessingRef = useRef(false)
	const detectedRef = useRef(false)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	// 初始化检测器
	useEffect(() => {
		if (typeof window !== 'undefined' && window.BarcodeDetector) {
			try {
				detectorRef.current = new window.BarcodeDetector({
					formats: ['qr_code'],
				})
				setScannerEngine('native')
			} catch (_e) {
				setScannerEngine('jsqr')
			}
		} else {
			setScannerEngine('jsqr')
		}
	}, [])

	useEffect(() => {
		if (!enabled) {
			setIsScanning(false)
			if (timerRef.current) clearInterval(timerRef.current)
			return
		}

		detectedRef.current = false
		setIsScanning(true)

		const scanFrame = async () => {
			const video = videoRef.current
			if (
				!video ||
				video.readyState < 2 ||
				isProcessingRef.current ||
				detectedRef.current
			) {
				return
			}

			isProcessingRef.current = true

			try {
				// 1. 优先尝试原生 BarcodeDetector (在 Chrome/Android/最新 Safari 上速度极快)
				if (detectorRef.current) {
					try {
						const barcodes = await detectorRef.current.detect(video)
						if (barcodes && barcodes.length > 0 && !detectedRef.current) {
							const rawValue = barcodes[0].rawValue
							if (rawValue) {
								detectedRef.current = true
								onDetected(rawValue)
								return
							}
						}
					} catch (nativeErr) {
						console.debug(
							'[useBarcodeScanner] Native detect failed, fallback to jsQR:',
							nativeErr,
						)
					}
				}

				// 2. jsQR 高性能 Canvas 帧扫描 (全浏览器兼容)
				if (!canvasRef.current) {
					canvasRef.current = document.createElement('canvas')
				}
				const canvas = canvasRef.current
				const videoW = video.videoWidth
				const videoH = video.videoHeight

				if (videoW > 0 && videoH > 0) {
					// 适度缩放以加快扫描计算 (最长边约 480px~640px)
					let scanW = videoW
					let scanH = videoH
					const maxScanEdge = 640
					if (scanW > maxScanEdge || scanH > maxScanEdge) {
						if (scanW >= scanH) {
							scanH = Math.round((scanH * maxScanEdge) / scanW)
							scanW = maxScanEdge
						} else {
							scanW = Math.round((scanW * maxScanEdge) / scanH)
							scanH = maxScanEdge
						}
					}

					canvas.width = scanW
					canvas.height = scanH
					const ctx = canvas.getContext('2d', { willReadFrequently: true })
					if (ctx) {
						ctx.drawImage(video, 0, 0, scanW, scanH)
						const imageData = ctx.getImageData(0, 0, scanW, scanH)
						const code = jsQR(imageData.data, scanW, scanH, {
							inversionAttempts: 'attemptBoth',
						})

						if (code?.data && !detectedRef.current) {
							detectedRef.current = true
							onDetected(code.data)
						}
					}
				}
			} catch (err) {
				console.debug('[useBarcodeScanner] Scan frame skipped:', err)
			} finally {
				isProcessingRef.current = false
			}
		}

		timerRef.current = setInterval(scanFrame, scanIntervalMs)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
			isProcessingRef.current = false
		}
	}, [enabled, videoRef, onDetected, scanIntervalMs])

	return {
		isScanning,
		scannerEngine,
	}
}
