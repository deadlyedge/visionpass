import { z } from 'zod'

// Preprocessing Configuration
export const PreprocessingConfigSchema = z.object({
	grayscale: z.literal(true).default(true),
	resizeLongEdge: z.number().int().positive().default(640),
	claheApplied: z.boolean().optional(),
	qrMask: z
		.object({
			x: z.number().min(0).max(1), // 归一化比例 0~1
			y: z.number().min(0).max(1),
			width: z.number().min(0).max(1),
			height: z.number().min(0).max(1),
		})
		.optional(),
})

export type PreprocessingConfig = z.infer<typeof PreprocessingConfigSchema>

// ORB 特征 Payload 标准定义 (FeaturePayloadV1)
export const FeaturePayloadSchemaV1 = z.object({
	version: z.literal(1),
	algorithm: z.literal('orb'),
	image: z.object({
		width: z.number().int().positive(),
		height: z.number().int().positive(),
		exifNormalized: z.boolean().default(true),
	}),
	preprocessing: PreprocessingConfigSchema,
	orbConfig: z.object({
		nFeatures: z.number().int().positive().default(500),
		scaleFactor: z.number().positive().default(1.2),
		nLevels: z.number().int().positive().default(8),
		descriptorSize: z.literal(32).default(32),
	}),
	descriptor: z.object({
		count: z.number().int().nonnegative(),
		cols: z.literal(32).default(32),
		bytesBase64: z.string().min(1), // Base64 编码的紧凑描述子
	}),
	keypoints: z.object({
		count: z.number().int().nonnegative(),
		xy: z.array(
			z.object({
				x: z.number(),
				y: z.number(),
			}),
		),
	}),
})

export type FeaturePayloadV1 = z.infer<typeof FeaturePayloadSchemaV1>

// 兼容别名与旧版转换
export const OrbFeaturePayloadSchema = z.union([
	FeaturePayloadSchemaV1,
	// 向后兼容基础结构
	z.object({
		version: z.literal(1),
		algorithm: z.literal('orb'),
		imageWidth: z.number().int().positive(),
		imageHeight: z.number().int().positive(),
		descriptorSize: z.literal(32),
		keypoints: z.array(
			z.object({
				x: z.number(),
				y: z.number(),
			}),
		),
		descriptorsBase64: z.string().min(1),
	}),
])

export type OrbFeaturePayloadV1 = z.infer<typeof OrbFeaturePayloadSchema>

/**
 * 格式标准化工具：确保任意输入的 Feature 统一转换为标准结构
 */
export function normalizeFeaturePayload(
	raw: OrbFeaturePayloadV1,
): FeaturePayloadV1 {
	if ('image' in raw && 'descriptor' in raw && 'keypoints' in raw) {
		return raw as FeaturePayloadV1
	}

	// 转换旧版平面结构
	const legacy = raw as {
		version: 1
		algorithm: 'orb'
		imageWidth: number
		imageHeight: number
		descriptorSize: 32
		keypoints: Array<{ x: number; y: number }>
		descriptorsBase64: string
	}

	return {
		version: 1,
		algorithm: 'orb',
		image: {
			width: legacy.imageWidth,
			height: legacy.imageHeight,
			exifNormalized: true,
		},
		preprocessing: {
			grayscale: true,
			resizeLongEdge: 640,
		},
		orbConfig: {
			nFeatures: 500,
			scaleFactor: 1.2,
			nLevels: 8,
			descriptorSize: 32,
		},
		descriptor: {
			count: legacy.keypoints.length,
			cols: 32,
			bytesBase64: legacy.descriptorsBase64,
		},
		keypoints: {
			count: legacy.keypoints.length,
			xy: legacy.keypoints,
		},
	}
}

export const CreateCredentialRequestSchema = z.object({
	secret: z
		.string()
		.min(1, '密语不能为空')
		.max(1000, '密语长度不能超过1000字符'),
	feature: OrbFeaturePayloadSchema,
})

export type CreateCredentialRequest = z.infer<
	typeof CreateCredentialRequestSchema
>

export type CreateCredentialResponse = {
	token: string
	displayPasscode?: string
	readUrl: string
}

export type CredentialMetaResponse = {
	exists: boolean
	valid?: boolean
}

export const VerifyRequestSchema = z.object({
	token: z.string().min(1),
	feature: OrbFeaturePayloadSchema,
})

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>

export type VerifyResponse =
	| {
			matched: true
			secret: string
	  }
	| {
			matched: false
	  }

export const MATCH_CONFIG = {
	DESCRIPTOR_SIZE: 32 as const,
	MAX_HAMMING_DISTANCE: 50,
	MIN_GOOD_MATCHES: 20,
	MIN_KEYPOINTS_CLIENT: 20,
	MAX_KEYPOINTS: 500,
	TARGET_LONG_EDGE: 640,
	ORB_MAX_FEATURES: 500,
} as const
