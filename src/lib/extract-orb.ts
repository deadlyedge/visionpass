import type { FeaturePayloadV1 } from './feature-schema'
import { visionWorkerClient } from './vision-worker-client'

export async function extractOrbFeatures(
	file: File,
	onProgress?: (msg: string) => void,
): Promise<{ payload: FeaturePayloadV1; previewUrl: string }> {
	return visionWorkerClient.extractFeatures(file, {}, onProgress)
}
