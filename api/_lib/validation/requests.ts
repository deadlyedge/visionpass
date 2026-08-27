import { base64ToUint8Array } from '../feature-codec'
import {
	CreateCredentialRequestSchema,
	MATCH_CONFIG,
	OrbFeaturePayloadSchema,
	type OrbFeaturePayloadV1,
	VerifyRequestSchema,
} from '../feature-schema'

export {
	CreateCredentialRequestSchema,
	OrbFeaturePayloadSchema,
	VerifyRequestSchema,
}

export function validateFeaturePayloadStrict(feature: OrbFeaturePayloadV1) {
	// Validate with Zod
	const parsed = OrbFeaturePayloadSchema.parse(feature)

	// Validate Base64 decoding length matches keypoints.length * 32
	let decoded: Uint8Array
	try {
		decoded = base64ToUint8Array(parsed.descriptorsBase64)
	} catch (_err) {
		throw new Error('descriptorsBase64 不是合法的 Base64 字符串')
	}

	const expectedLength = parsed.keypoints.length * MATCH_CONFIG.DESCRIPTOR_SIZE
	if (decoded.length !== expectedLength) {
		throw new Error(
			`描述子数据长度错误: 实际 ${decoded.length} 字节，预期 ${expectedLength} 字节 (${parsed.keypoints.length} 点 × 32 字节)`,
		)
	}

	if (parsed.keypoints.length > MATCH_CONFIG.MAX_KEYPOINTS) {
		throw new Error(`特征点数量超过最大允许限制 ${MATCH_CONFIG.MAX_KEYPOINTS}`)
	}

	return { parsed, decodedDescriptors: decoded }
}
