import { base64ToUint8Array } from '../../src/lib/feature-codec'
import {
	MATCH_CONFIG,
	type OrbFeaturePayloadV1,
} from '../../src/lib/feature-schema'

export type MatchResult = {
	matched: boolean
	goodMatchCount: number
}

/**
 * Hamming distance between two 32-byte descriptors using direct offset without slicing.
 */
export function hammingDistanceDirect(
	a: Uint8Array,
	aOffset: number,
	b: Uint8Array,
	bOffset: number,
): number {
	let dist = 0
	for (let i = 0; i < MATCH_CONFIG.DESCRIPTOR_SIZE; i++) {
		let xor = a[aOffset + i] ^ b[bOffset + i]
		// Count set bits (Brian Kernighan's algorithm)
		while (xor !== 0) {
			xor &= xor - 1
			dist++
		}
	}
	return dist
}

/**
 * Basic ORB Hamming Matcher for MVP.
 * Iterates each query descriptor, finds best distance in reference descriptors.
 * If best distance <= MAX_HAMMING_DISTANCE, it counts as a good match.
 */
export function matchOrbBasic(
	query: OrbFeaturePayloadV1,
	reference: OrbFeaturePayloadV1,
): MatchResult {
	const queryBytes = base64ToUint8Array(query.descriptorsBase64)
	const refBytes = base64ToUint8Array(reference.descriptorsBase64)

	const queryCount = query.keypoints.length
	const refCount = reference.keypoints.length

	if (queryCount === 0 || refCount === 0) {
		return { matched: false, goodMatchCount: 0 }
	}

	const descriptorSize = MATCH_CONFIG.DESCRIPTOR_SIZE
	let goodMatchCount = 0

	for (let q = 0; q < queryCount; q++) {
		const qOffset = q * descriptorSize
		let minDistance = 256

		for (let r = 0; r < refCount; r++) {
			const rOffset = r * descriptorSize
			const d = hammingDistanceDirect(queryBytes, qOffset, refBytes, rOffset)
			if (d < minDistance) {
				minDistance = d
			}
			// Quick break if exact match found
			if (minDistance === 0) {
				break
			}
		}

		if (minDistance <= MATCH_CONFIG.MAX_HAMMING_DISTANCE) {
			goodMatchCount++
		}
	}

	const matched = goodMatchCount >= MATCH_CONFIG.MIN_GOOD_MATCHES

	return {
		matched,
		goodMatchCount,
	}
}
