import { CONSTANTS } from '@/lib/constants'
import { base64ToUint8Array } from '@/lib/feature-codec'
import {
	type FeaturePayloadV1,
	normalizeFeaturePayload,
	type OrbFeaturePayloadV1,
} from '@/lib/feature-schema'
import { hammingDistanceDirect } from './orb-basic'
import { ransacHomography } from './ransac'
import type { MatcherStrategy, MatchPair, MatchResult } from './types'

export class OrbHammingRansacMatcherV1 implements MatcherStrategy {
	readonly id = 'orb-hamming-ransac-v1'
	readonly supportedVersions = [1] as const

	match(input: {
		query: OrbFeaturePayloadV1 | FeaturePayloadV1
		reference: OrbFeaturePayloadV1 | FeaturePayloadV1
	}): MatchResult {
		const query = normalizeFeaturePayload(input.query)
		const reference = normalizeFeaturePayload(input.reference)

		const queryCount = query.keypoints.count
		const refCount = reference.keypoints.count

		// 1. 特征点数量下限检查
		if (
			queryCount < CONSTANTS.MATCH.MIN_KEYPOINTS_CLIENT ||
			refCount < CONSTANTS.MATCH.MIN_KEYPOINTS_CLIENT
		) {
			return {
				matched: false,
				score: 0,
				goodMatchCount: 0,
				inlierCount: 0,
				inlierRatio: 0,
				reason: 'insufficient_features',
			}
		}

		const queryBytes = base64ToUint8Array(query.descriptor.bytesBase64)
		const refBytes = base64ToUint8Array(reference.descriptor.bytesBase64)
		const descriptorSize = CONSTANTS.MATCH.DESCRIPTOR_SIZE
		const ratioThreshold = CONSTANTS.MATCH.RATIO_THRESHOLD
		const maxHammingDist = CONSTANTS.MATCH.MAX_HAMMING_DISTANCE

		// 2. KNN 检索 (k = 2) 与 Lowe's Ratio Test
		const candidateMatches: MatchPair[] = []

		for (let q = 0; q < queryCount; q++) {
			const qOffset = q * descriptorSize
			let bestDist = 256
			let secondBestDist = 256
			let bestRefIdx = -1

			for (let r = 0; r < refCount; r++) {
				const rOffset = r * descriptorSize
				const dist = hammingDistanceDirect(
					queryBytes,
					qOffset,
					refBytes,
					rOffset,
				)

				if (dist < bestDist) {
					secondBestDist = bestDist
					bestDist = dist
					bestRefIdx = r
				} else if (dist < secondBestDist) {
					secondBestDist = dist
				}
			}

			// Lowe's Ratio Test: bestDist < ratioThreshold * secondBestDist
			// 并且 bestDist 必须在最大允许 Hamming 距离以内
			if (
				bestRefIdx >= 0 &&
				bestDist <= maxHammingDist &&
				bestDist < secondBestDist * ratioThreshold
			) {
				const queryPt = query.keypoints.xy[q]
				const refPt = reference.keypoints.xy[bestRefIdx]

				if (queryPt && refPt) {
					candidateMatches.push({
						queryIndex: q,
						refIndex: bestRefIdx,
						queryPoint: queryPt,
						refPoint: refPt,
						distance: bestDist,
					})
				}
			}
		}

		const goodMatchCount = candidateMatches.length

		// 3. 候选匹配数量达标检验
		if (goodMatchCount < CONSTANTS.MATCH.MIN_GOOD_MATCHES) {
			return {
				matched: false,
				score: Number(
					(goodMatchCount / CONSTANTS.MATCH.MIN_GOOD_MATCHES).toFixed(2),
				),
				goodMatchCount,
				inlierCount: 0,
				inlierRatio: 0,
				reason: 'ratio_test_failed',
			}
		}

		// 4. RANSAC 单应性矩阵内点检验
		const ransacRes = ransacHomography(candidateMatches, {
			maxIterations: CONSTANTS.MATCH.RANSAC_MAX_ITERATIONS,
			reprojectionErrorThresh: CONSTANTS.MATCH.REPROJECTION_ERROR_THRESH,
			confidence: CONSTANTS.MATCH.RANSAC_CONFIDENCE,
		})

		const inlierCount = ransacRes.inliers.length
		const inlierRatio = ransacRes.inlierRatio

		// 5. 综合判定模型:
		// (goodMatches >= 20) && (inliers >= 12) && (inlierRatio >= 0.45)
		const matched =
			goodMatchCount >= CONSTANTS.MATCH.MIN_GOOD_MATCHES &&
			inlierCount >= CONSTANTS.MATCH.MIN_INLIERS &&
			inlierRatio >= CONSTANTS.MATCH.MIN_INLIER_RATIO

		const score = Number(
			Math.min(
				1.0,
				(inlierCount / CONSTANTS.MATCH.MIN_INLIERS) * 0.5 + inlierRatio * 0.5,
			).toFixed(2),
		)

		let reason: MatchResult['reason'] = 'matched'
		if (!matched) {
			if (inlierCount < CONSTANTS.MATCH.MIN_INLIERS) {
				reason = 'homography_failed'
			} else {
				reason = 'below_threshold'
			}
		}

		return {
			matched,
			score,
			goodMatchCount,
			inlierCount,
			inlierRatio: Number(inlierRatio.toFixed(2)),
			reason,
		}
	}
}

export const orbHammingRansacMatcherV1 = new OrbHammingRansacMatcherV1()
