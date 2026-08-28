import type { OrbFeaturePayloadV1 } from '@/lib/feature-schema'

export type MatchReason =
	| 'matched'
	| 'insufficient_features'
	| 'ratio_test_failed'
	| 'homography_failed'
	| 'below_threshold'

export type MatchResult = {
	matched: boolean
	score: number
	goodMatchCount: number
	inlierCount: number
	inlierRatio: number
	reason: MatchReason
}

export type Point2D = {
	x: number
	y: number
}

export type MatchPair = {
	queryIndex: number
	refIndex: number
	queryPoint: Point2D
	refPoint: Point2D
	distance: number
}

export interface MatcherStrategy {
	readonly id: string
	readonly supportedVersions: readonly number[]
	match(input: {
		query: OrbFeaturePayloadV1
		reference: OrbFeaturePayloadV1
	}): Promise<MatchResult> | MatchResult
}
