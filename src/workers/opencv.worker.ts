import { CONSTANTS } from '../lib/constants'
import { uint8ArrayToBase64 } from '../lib/feature-codec'
import type { FeaturePayloadV1 } from '../lib/feature-schema'
import type {
	WorkerExtractOptions,
	WorkerRequest,
	WorkerResponse,
} from './worker-types'

// OpenCV.js types in Web Worker global scope
declare let cv: any
declare let Module: any
declare let importScripts: (...urls: string[]) => void

let cvReadyPromise: Promise<any> | null = null

function postResp(resp: WorkerResponse) {
	self.postMessage(resp)
}

function postProgress(id: string, stage: string) {
	postResp({ type: 'PROGRESS', id, stage })
}

/**
 * 加载 OpenCV.js WASM 运行时 (支持 jsdelivr 与 unpkg 容灾降级)
 */
function initOpenCVWorker(): Promise<any> {
	if (cvReadyPromise) return cvReadyPromise

	cvReadyPromise = new Promise((resolve, reject) => {
		// 检查全局变量
		if (cv?.Mat && cv.ORB) {
			return resolve(cv)
		}

		let initialized = false

		self.Module = {
			onRuntimeInitialized: () => {
				if (initialized) return
				initialized = true
				console.log('[OpenCV Worker] WASM Runtime initialized')
				resolve(typeof cv !== 'undefined' ? cv : self.Module)
			},
		}

		try {
			// 优先从 jsDelivr CDN 加载
			importScripts(
				'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js',
			)
		} catch (err1) {
			console.warn('[OpenCV Worker] jsdelivr failed, fallback to unpkg', err1)
			try {
				importScripts(
					'https://unpkg.com/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js',
				)
			} catch (_err2) {
				return reject(new Error('无法在 Worker 中加载 OpenCV.js 脚本'))
			}
		}

		// 某些环境 Module.onRuntimeInitialized 已就绪
		if (typeof cv !== 'undefined' && typeof cv.Mat === 'function') {
			initialized = true
			return resolve(cv)
		}

		// 设定 30 秒超时
		setTimeout(() => {
			if (!initialized) {
				reject(new Error('OpenCV.js Worker 初始化超时'))
			}
		}, 30000)
	})

	return cvReadyPromise
}

/**
 * 处理单张图像数据，执行 EXIF/尺寸归一化、灰度、CLAHE、QR Mask 与 ORB 特征提取
 */
async function processImage(
	id: string,
	imageData: ImageData,
	options?: WorkerExtractOptions,
): Promise<FeaturePayloadV1> {
	postProgress(id, '正在准备 OpenCV 计算核心...')
	const cvEngine = await initOpenCVWorker()

	postProgress(id, '正在进行图像灰度转换与预处理...')

	let src: any = null
	let gray: any = null
	let claheMat: any = null
	let claheObj: any = null
	let maskMat: any = null
	let keypoints: any = null
	let descriptors: any = null
	let orb: any = null

	try {
		// 1. 将 ImageData 写入 cv.Mat (RGBA)
		src = new cvEngine.Mat(imageData.height, imageData.width, cvEngine.CV_8UC4)
		src.data.set(imageData.data)

		// 2. 灰度化 (RGBA -> GRAY)
		gray = new cvEngine.Mat()
		cvEngine.cvtColor(src, gray, cvEngine.COLOR_RGBA2GRAY)

		// 3. 可选 CLAHE (自适应直方图均衡化)
		let processedGray = gray
		let claheApplied = false
		if (options?.applyClahe) {
			try {
				claheMat = new cvEngine.Mat()
				claheObj = new cvEngine.CLAHE(2.0, new cvEngine.Size(8, 8))
				claheObj.apply(gray, claheMat)
				processedGray = claheMat
				claheApplied = true
			} catch (claheErr) {
				console.warn('[OpenCV Worker] CLAHE failed, skip:', claheErr)
			}
		}

		// 4. 可选 QR 区域掩码置黑 (QR Masking)
		maskMat = new cvEngine.Mat.ones(gray.rows, gray.cols, cvEngine.CV_8UC1)
		if (options?.qrMask) {
			const { x, y, width, height } = options.qrMask
			const maskX = Math.floor(x * gray.cols)
			const maskY = Math.floor(y * gray.rows)
			const maskW = Math.floor(width * gray.cols)
			const maskH = Math.floor(height * gray.rows)

			const rect = new cvEngine.Rect(maskX, maskY, maskW, maskH)
			const maskRoi = maskMat.roi(rect)
			maskRoi.setTo(new cvEngine.Scalar(0))
			maskRoi.delete()
		}

		postProgress(id, '正在提取 ORB 关键点与紧凑描述子...')

		keypoints = new cvEngine.KeyPointVector()
		descriptors = new cvEngine.Mat()

		// 5. 创建 ORB 提取器并检测
		orb = new cvEngine.ORB(CONSTANTS.MATCH.ORB_MAX_FEATURES)
		orb.detectAndCompute(processedGray, maskMat, keypoints, descriptors)

		const numPoints = keypoints.size()
		if (numPoints < CONSTANTS.MATCH.MIN_KEYPOINTS_CLIENT) {
			throw new Error(
				`图片特征点不足（仅检测到 ${numPoints} 个，至少需 ${CONSTANTS.MATCH.MIN_KEYPOINTS_CLIENT} 个），请选择纹理更清晰的画面。`,
			)
		}

		// 6. 提取关键点坐标 (保留 1 位小数)
		const pointsArray: Array<{ x: number; y: number }> = []
		for (let i = 0; i < numPoints; i++) {
			const kp = keypoints.get(i)
			pointsArray.push({
				x: Math.round(kp.pt.x * 10) / 10,
				y: Math.round(kp.pt.y * 10) / 10,
			})
		}

		// 7. 提取描述子二进制并编码为 Base64
		if (
			descriptors.rows !== numPoints ||
			descriptors.cols !== CONSTANTS.MATCH.DESCRIPTOR_SIZE
		) {
			throw new Error('描述子矩阵维度异常')
		}

		const descriptorsBytes = new Uint8Array(descriptors.data)
		const bytesBase64 = uint8ArrayToBase64(descriptorsBytes)

		const payload: FeaturePayloadV1 = {
			version: 1,
			algorithm: 'orb',
			image: {
				width: gray.cols,
				height: gray.rows,
				exifNormalized: true,
			},
			preprocessing: {
				grayscale: true,
				resizeLongEdge: 640,
				claheApplied,
				qrMask: options?.qrMask,
			},
			orbConfig: {
				nFeatures: 500,
				scaleFactor: 1.2,
				nLevels: 8,
				descriptorSize: 32,
			},
			descriptor: {
				count: numPoints,
				cols: 32,
				bytesBase64,
			},
			keypoints: {
				count: numPoints,
				xy: pointsArray,
			},
		}

		return payload
	} finally {
		// 严格释放所有 cv.Mat / KeyPointVector / ORB 内存
		if (src) src.delete()
		if (gray) gray.delete()
		if (claheMat) claheMat.delete()
		if (claheObj) claheObj.delete()
		if (maskMat) maskMat.delete()
		if (keypoints) keypoints.delete()
		if (descriptors) descriptors.delete()
		if (orb) orb.delete()
	}
}

// Worker 消息监听
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
	const req = e.data
	if (!req) return

	if (req.type === 'INIT') {
		try {
			await initOpenCVWorker()
			postResp({ type: 'INIT_SUCCESS', id: req.id })
		} catch (err: any) {
			postResp({
				type: 'ERROR',
				id: req.id,
				error: err.message || 'Worker 初始化失败',
			})
		}
		return
	}

	if (req.type === 'EXTRACT') {
		try {
			const payload = await processImage(req.id, req.imageData, req.options)
			postResp({ type: 'EXTRACT_SUCCESS', id: req.id, payload })
		} catch (err: any) {
			postResp({
				type: 'ERROR',
				id: req.id,
				error: err.message || '特征提取失败',
			})
		}
	}
}
