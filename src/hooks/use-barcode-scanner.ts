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
	scanIntervalMs = 250,
}: UseBarcodeScannerOptions) {
	const [isScanning, setIsScanning] = useState(false)
	const [scannerEngine, setScannerEngine] = useState<
		'native' | 'canvas-fallback' | 'unsupported'
	>('unsupported')

	const detectorRef = useRef<any>(null)
	const timerRef = useRef<any>(null)
	const isProcessingRef = useRef(false)
	const detectedRef = useRef(false)

	// 初始化检测器
	useEffect(() => {
		if (typeof window !== 'undefined' && window.BarcodeDetector) {
			try {
				detectorRef.current = new window.BarcodeDetector({
					formats: ['qr_code'],
				})
				setScannerEngine('native')
			} catch (_e) {
				setScannerEngine('canvas-fallback')
			}
		} else {
			setScannerEngine('canvas-fallback')
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
				if (detectorRef.current) {
					// 原生 BarcodeDetector 检测
					const barcodes = await detectorRef.current.detect(video)
					if (barcodes && barcodes.length > 0 && !detectedRef.current) {
						const rawValue = barcodes[0].rawValue
						if (rawValue) {
							detectedRef.current = true
							onDetected(rawValue)
						}
					}
				}
			} catch (err) {
				console.debug('[useBarcodeScanner] Native scan frame skipped:', err)
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
