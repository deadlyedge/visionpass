import type {
	WorkerExtractOptions,
	WorkerRequest,
	WorkerResponse,
} from '../workers/worker-types'
import { CONSTANTS } from './constants'
import type { FeaturePayloadV1 } from './feature-schema'

class VisionWorkerClient {
	private worker: Worker | null = null
	private initPromise: Promise<void> | null = null
	private requestCallbacks = new Map<
		string,
		{
			resolve: (val: FeaturePayloadV1) => void
			reject: (err: Error) => void
			onProgress?: (stage: string) => void
		}
	>()

	/**
	 * 获取或初始化 Web Worker 实例
	 */
	public getWorker(): Worker {
		if (typeof window === 'undefined') {
			throw new Error('Web Worker 仅可在浏览器环境中运行')
		}

		if (!this.worker) {
			// 使用 Vite 原生 Worker 构造语法
			this.worker = new Worker(
				new URL('../workers/opencv.worker.ts', import.meta.url),
				{ type: 'module' },
			)

			this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
				const resp = e.data
				if (!resp?.id) return

				const cb = this.requestCallbacks.get(resp.id)
				if (!cb) return

				if (resp.type === 'PROGRESS') {
					cb.onProgress?.(resp.stage)
					return
				}

				if (resp.type === 'EXTRACT_SUCCESS') {
					this.requestCallbacks.delete(resp.id)
					cb.resolve(resp.payload)
					return
				}

				if (resp.type === 'ERROR') {
					this.requestCallbacks.delete(resp.id)
					cb.reject(new Error(resp.error))
					return
				}
			}

			this.worker.onerror = (err) => {
				console.error('[VisionWorkerClient] Worker error:', err)
			}
		}

		return this.worker
	}

	/**
	 * 预热加载 OpenCV WASM
	 */
	public async preWarm(): Promise<void> {
		if (typeof window === 'undefined') return
		if (this.initPromise) return this.initPromise

		this.initPromise = new Promise<void>((resolve, reject) => {
			const worker = this.getWorker()
			const reqId = `init_${Date.now()}`

			const onMessage = (e: MessageEvent<WorkerResponse>) => {
				if (e.data?.id === reqId) {
					worker.removeEventListener('message', onMessage)
					if (e.data.type === 'INIT_SUCCESS') {
						resolve()
					} else if (e.data.type === 'ERROR') {
						reject(new Error(e.data.error))
					}
				}
			}

			worker.addEventListener('message', onMessage)
			worker.postMessage({ type: 'INIT', id: reqId } as WorkerRequest)
		})

		return this.initPromise
	}

	/**
	 * 将 File 解码为 ImageData 并进行等比缩放
	 */
	public async fileToImageData(
		file: File,
		maxEdge: number = CONSTANTS.MATCH.TARGET_LONG_EDGE,
	): Promise<{ imageData: ImageData; previewUrl: string }> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const img = new Image()
				img.onload = () => {
					let width = img.naturalWidth || img.width
					let height = img.naturalHeight || img.height

					if (width > maxEdge || height > maxEdge) {
						if (width >= height) {
							height = Math.round((height * maxEdge) / width)
							width = maxEdge
						} else {
							width = Math.round((width * maxEdge) / height)
							height = maxEdge
						}
					}

					const canvas = document.createElement('canvas')
					canvas.width = width
					canvas.height = height
					const ctx = canvas.getContext('2d')
					if (!ctx) {
						return reject(new Error('无法创建 Canvas 2D 上下文'))
					}

					ctx.drawImage(img, 0, 0, width, height)
					const imageData = ctx.getImageData(0, 0, width, height)
					const previewUrl = canvas.toDataURL('image/jpeg', 0.85)

					resolve({ imageData, previewUrl })
				}
				img.onerror = (err) => reject(new Error(`图片解码失败: ${err}`))
				img.src = e.target?.result as string
			}
			reader.onerror = (err) => reject(new Error(`读取文件异常: ${err}`))
			reader.readAsDataURL(file)
		})
	}

	/**
	 * 异步提交特征提取任务到 Web Worker
	 */
	public async extractFeatures(
		file: File,
		options: WorkerExtractOptions = {},
		onProgress?: (stage: string) => void,
	): Promise<{ payload: FeaturePayloadV1; previewUrl: string }> {
		onProgress?.('正在读取并缩放图像...')
		const { imageData, previewUrl } = await this.fileToImageData(
			file,
			CONSTANTS.MATCH.TARGET_LONG_EDGE,
		)

		const worker = this.getWorker()
		const reqId = `extract_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

		const payload = await new Promise<FeaturePayloadV1>((resolve, reject) => {
			this.requestCallbacks.set(reqId, {
				resolve,
				reject,
				onProgress,
			})

			worker.postMessage({
				type: 'EXTRACT',
				id: reqId,
				imageData,
				options,
			} as WorkerRequest)
		})

		return { payload, previewUrl }
	}
}

export const visionWorkerClient = new VisionWorkerClient()

// 浏览器端启动时后台静默预热 Worker
if (typeof window !== 'undefined') {
	visionWorkerClient.preWarm().catch((e) => {
		console.debug('[VisionWorkerClient] Pre-warm note:', e?.message)
	})
}
