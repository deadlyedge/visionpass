import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseCameraStreamOptions {
	idealFacingMode?: 'user' | 'environment'
	aspectRatio?: number
}

export function useCameraStream(options: UseCameraStreamOptions = {}) {
	const { idealFacingMode = 'environment', aspectRatio } = options
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(
		undefined,
	)
	const [isStreaming, setIsStreaming] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// 枚举视频输入设备
	const refreshDevices = useCallback(async () => {
		if (
			typeof navigator === 'undefined' ||
			!navigator.mediaDevices?.enumerateDevices
		) {
			return
		}
		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
			setDevices(videoDevices)
			if (!activeDeviceId && videoDevices.length > 0) {
				// 优先查找环境/后置摄像头
				const backCam = videoDevices.find(
					(d) =>
						d.label.toLowerCase().includes('back') ||
						d.label.toLowerCase().includes('environment') ||
						d.label.toLowerCase().includes('后置'),
				)
				setActiveDeviceId(
					backCam ? backCam.deviceId : videoDevices[0]?.deviceId,
				)
			}
		} catch (err: any) {
			console.warn('[useCameraStream] 设备枚举失败:', err)
		}
	}, [activeDeviceId])

	// 停止视频流
	const stopStream = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop()
			}
			streamRef.current = null
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null
		}
		setIsStreaming(false)
	}, [])

	// 将当前活跃的 streamRef 绑定并播放到 videoRef DOM
	const attachStreamToVideo = useCallback(async () => {
		const video = videoRef.current
		const stream = streamRef.current
		if (!video || !stream) return false

		// 检查 stream 中是否有活跃的 track
		const activeTracks = stream
			.getVideoTracks()
			.filter((t) => t.readyState === 'live')
		if (activeTracks.length === 0) return false

		if (video.srcObject !== stream) {
			video.srcObject = stream
		}

		try {
			await video.play()
			setIsStreaming(true)
			return true
		} catch (e) {
			console.warn('[useCameraStream] video play catch:', e)
			setIsStreaming(true)
			return true
		}
	}, [])

	// 启动视频流
	const startStream = useCallback(async () => {
		if (
			typeof navigator === 'undefined' ||
			!navigator.mediaDevices?.getUserMedia
		) {
			setError('当前浏览器不支持或已禁用摄像头访问')
			return
		}

		// 1. 如果当前已有活着的 stream，且 video 元素挂载了，直接重新 attach
		if (streamRef.current) {
			const activeTracks = streamRef.current
				.getVideoTracks()
				.filter((t) => t.readyState === 'live')
			if (activeTracks.length > 0) {
				const attached = await attachStreamToVideo()
				if (attached) {
					return
				}
			}
		}

		stopStream()
		setError(null)

		try {
			const constraints: MediaStreamConstraints = {
				video: activeDeviceId
					? { deviceId: { exact: activeDeviceId } }
					: {
							facingMode: idealFacingMode,
							aspectRatio: aspectRatio || { ideal: 4 / 3 },
							width: { ideal: 1280 },
							height: { ideal: 720 },
						},
				audio: false,
			}

			const stream = await navigator.mediaDevices.getUserMedia(constraints)
			streamRef.current = stream

			if (videoRef.current) {
				videoRef.current.srcObject = stream
				await videoRef.current.play().catch((e) => {
					console.warn('[useCameraStream] video play interrupted:', e)
				})
			}

			setIsStreaming(true)
			await refreshDevices()
		} catch (err: any) {
			const msg =
				err.name === 'NotAllowedError'
					? '摄像头权限已被拒绝，请在浏览器设置中开启'
					: `无法启动摄像头: ${err.message || err.name}`
			setError(msg)
			setIsStreaming(false)
		}
	}, [
		activeDeviceId,
		idealFacingMode,
		aspectRatio,
		stopStream,
		refreshDevices,
		attachStreamToVideo,
	])

	// 监听设备切换
	useEffect(() => {
		if (isStreaming && activeDeviceId) {
			startStream()
		}
	}, [activeDeviceId, startStream, isStreaming])

	// 组件卸载时释放媒体流
	useEffect(() => {
		return () => {
			stopStream()
		}
	}, [stopStream])

	return {
		videoRef,
		devices,
		activeDeviceId,
		setActiveDeviceId,
		isStreaming,
		startStream,
		stopStream,
		attachStreamToVideo,
		error,
	}
}
