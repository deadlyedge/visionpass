import { z } from 'zod'

export const OrbFeaturePayloadSchema = z.object({
	version: z.literal(1),
	algorithm: z.literal('orb'),
	imageWidth: z.number().int().positive(),
	imageHeight: z.number().int().positive(),
	descriptorSize: z.literal(32),
	keypoints: z
		.array(
			z.object({
				x: z.number(),
				y: z.number(),
			}),
		)
		.min(1)
		.max(500),
	descriptorsBase64: z.string().min(1),
})

export type OrbFeaturePayloadV1 = z.infer<typeof OrbFeaturePayloadSchema>

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
	readUrl: string
}

export type CredentialMetaResponse = {
	exists: boolean
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
	MIN_GOOD_MATCHES: 25,
	MIN_KEYPOINTS_CLIENT: 20,
	MAX_KEYPOINTS: 500,
	TARGET_LONG_EDGE: 640,
	ORB_MAX_FEATURES: 500,
} as const
