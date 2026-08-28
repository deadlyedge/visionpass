import type { FeaturePayloadV1 } from '@/lib/feature-schema'

export type WorkerExtractOptions = {
	applyClahe?: boolean
	qrMask?: {
		x: number // 归一化坐标 0~1
		y: number
		width: number
		height: number
	}
}

export type WorkerRequest =
	| {
			type: 'INIT'
			id: string
	  }
	| {
			type: 'EXTRACT'
			id: string
			imageData: ImageData
			options?: WorkerExtractOptions
	  }

export type WorkerResponse =
	| {
			type: 'INIT_SUCCESS'
			id: string
	  }
	| {
			type: 'PROGRESS'
			id: string
			stage: string
	  }
	| {
			type: 'EXTRACT_SUCCESS'
			id: string
			payload: FeaturePayloadV1
	  }
	| {
			type: 'ERROR'
			id: string
			error: string
	  }
