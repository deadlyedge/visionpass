import { useEffect, useRef, useState } from 'react'
import { CONSTANTS } from '@/lib/constants'
import type { FeaturePayloadV1 } from '@/lib/feature-schema'
import { visionWorkerClient } from '@/lib/vision-worker-client'

export interface UseLiveOrbMatcherOptions {
	videoRef: React.RefObject<HTMLVideoElement | null>
	active: boolean
	intervalMs?: number // 默认 800ms
	onKeypointsExtracted?: (
		keypoints: Array<{ x: number; y: number }>,
		width: number,
		height: number,
	) => void
	onFeatureReady: (payload: FeaturePayloadV1) => Promise<boolean> // 返回 true 表示比对成功
}

export function useLiveOrbMatcher({
	videoRef,
	active,
	intervalMs = 800,
	onKeypointsExtracted,
	onFeatureReady,
}: UseLiveOrbMatcherOptions) {
	const [isProcessingFrame, setIsProcessingFrame] = useState(false)
	const [lastExtractedCount, setLastExtractedCount] = useState(0)

	const timerRef = useRef<any>(null)
	const isFlightLockedRef = useRef(false)
	const isMatchedRef = useRef(false)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		if (!active) {
			if (timerRef.current) clearInterval(timerRef.current)
			setIsProcessingFrame(false)
			return
		}

		isMatchedRef.current = false
		isFlightLockedRef.current = false

		const captureAndExtract = async () => {
			const video = videoRef.current
			if (
				!video ||
				video.readyState < 2 ||
				isFlightLockedRef.current ||
				isMatchedRef.current
			) {
				return
			}

			isFlightLockedRef.current = true
			setIsProcessingFrame(true)

			try {
				const width = video.videoWidth
				const height = video.videoHeight
				if (!width || !height) return

				// 等比缩放到 640px
				const maxEdge = CONSTANTS.MATCH.TARGET_LONG_EDGE
				let targetW = width
				let targetH = height
				if (width > maxEdge || height > maxEdge) {
					if (width >= height) {
						targetH = Math.round((height * maxEdge) / width)
						targetW = maxEdge
					} else {
						targetW = Math.round((width * maxEdge) / height)
						targetH = maxEdge
					}
				}

				if (!canvasRef.current) {
					canvasRef.current = document.createElement('canvas')
				}
				const canvas = canvasRef.current
				canvas.width = targetW
				canvas.height = targetH
				const ctx = canvas.getContext('2d')
				if (!ctx) return

				ctx.drawImage(video, 0, 0, targetW, targetH)
				const imageData = ctx.getImageData(0, 0, targetW, targetH)

				// 提交给 Web Worker
				const reqId = `live_${Date.now()}`
				const worker = (visionWorkerClient as any).getWorker()

				const payload = await new Promise<FeaturePayloadV1>(
					(resolve, reject) => {
						const onMsg = (e: MessageEvent) => {
							if (e.data?.id === reqId) {
								if (e.data.type === 'EXTRACT_SUCCESS') {
									worker.removeEventListener('message', onMsg)
									resolve(e.data.payload)
								} else if (e.data.type === 'ERROR') {
									worker.removeEventListener('message', onMsg)
									reject(new Error(e.data.error))
								}
							}
						}
						worker.addEventListener('message', onMsg)
						worker.postMessage({
							type: 'EXTRACT',
							id: reqId,
							imageData,
						})
					},
				)

				const count = payload.keypoints.count
				setLastExtractedCount(count)

				if (onKeypointsExtracted) {
					onKeypointsExtracted(payload.keypoints.xy, targetW, targetH)
				}

				// 若特征点充足，触发服务端比对
				if (count >= CONSTANTS.MATCH.MIN_KEYPOINTS_CLIENT) {
					const matched = await onFeatureReady(payload)
					if (matched) {
						isMatchedRef.current = true
						if (timerRef.current) clearInterval(timerRef.current)
					}
				}
			} catch (err) {
				console.debug('[useLiveOrbMatcher] 抽帧比对跳过/异常:', err)
			} finally {
				setIsProcessingFrame(false)
				isFlightLockedRef.current = false
			}
		}

		timerRef.current = setInterval(captureAndExtract, intervalMs)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
			isFlightLockedRef.current = false
		}
	}, [active, videoRef, intervalMs, onKeypointsExtracted, onFeatureReady])

	return {
		isProcessingFrame,
		lastExtractedCount,
	}
}
