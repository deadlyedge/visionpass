import { describe, expect, it } from 'bun:test'
import { uint8ArrayToBase64 } from '../src/lib/feature-codec'
import type { OrbFeaturePayloadV1 } from '../src/lib/feature-schema'
import { orbHammingRansacMatcherV1 } from '../src/server/matcher/orb-hamming-ransac-v1'
import {
	applyHomography,
	findHomography4Points,
	ransacHomography,
} from '../src/server/matcher/ransac'
import type { MatchPair, Point2D } from '../src/server/matcher/types'

// 辅助函数：生成 N 个不相关的随机 32 字节描述子
function generateRandomDescriptors(count: number): Uint8Array {
	const buf = new Uint8Array(count * 32)
	for (let i = 0; i < buf.length; i++) {
		buf[i] = Math.floor(Math.random() * 256)
	}
	return buf
}

// 辅助函数：构造测试用的特征 Payload
function createMockPayload(
	keypoints: Array<{ x: number; y: number }>,
	descriptors: Uint8Array,
	imageWidth = 640,
	imageHeight = 480,
): OrbFeaturePayloadV1 {
	return {
		version: 1,
		algorithm: 'orb',
		imageWidth,
		imageHeight,
		descriptorSize: 32,
		keypoints,
		descriptorsBase64: uint8ArrayToBase64(descriptors),
	}
}

describe('Matcher - Homography & RANSAC Mathematics', () => {
	it('should accurately calculate homography matrix for affine/perspective transformations', () => {
		const src: [Point2D, Point2D, Point2D, Point2D] = [
			{ x: 10, y: 10 },
			{ x: 200, y: 10 },
			{ x: 200, y: 200 },
			{ x: 10, y: 200 },
		]

		// 简单的缩放平移变换: x' = 2*x + 15, y' = 2*y + 25
		const dst: [Point2D, Point2D, Point2D, Point2D] = [
			{ x: 35, y: 45 },
			{ x: 415, y: 45 },
			{ x: 415, y: 425 },
			{ x: 35, y: 425 },
		]

		const H = findHomography4Points(src, dst)
		expect(H).not.toBeNull()

		const testPt: Point2D = { x: 50, y: 100 }
		const mapped = applyHomography(H!, testPt)
		expect(mapped).not.toBeNull()
		expect(Math.abs(mapped!.x - (2 * 50 + 15))).toBeLessThan(0.01)
		expect(Math.abs(mapped!.y - (2 * 100 + 25))).toBeLessThan(0.01)
	})

	it('should filter out outliers via RANSAC and keep inliers', () => {
		const matches: MatchPair[] = []

		// 构造 30 个满足线性变换的几何内点
		for (let i = 0; i < 30; i++) {
			const qx = 20 + i * 15
			const qy = 30 + (i % 5) * 40
			// 变换: x' = 1.1*x + 10, y' = 0.95*y + 20
			const rx = 1.1 * qx + 10
			const ry = 0.95 * qy + 20

			matches.push({
				queryIndex: i,
				refIndex: i,
				queryPoint: { x: qx, y: qy },
				refPoint: { x: rx, y: ry },
				distance: 5,
			})
		}

		// 构造 10 个随机离群点 (outliers)
		for (let i = 0; i < 10; i++) {
			matches.push({
				queryIndex: 30 + i,
				refIndex: 30 + i,
				queryPoint: { x: Math.random() * 500, y: Math.random() * 500 },
				refPoint: { x: Math.random() * 500, y: Math.random() * 500 },
				distance: 10,
			})
		}

		const ransac = ransacHomography(matches, {
			maxIterations: 300,
			reprojectionErrorThresh: 3.0,
		})

		expect(ransac.inliers.length).toBeGreaterThanOrEqual(28)
		expect(ransac.inlierRatio).toBeGreaterThanOrEqual(0.7)
		expect(ransac.homography).not.toBeNull()
	})
})

describe('Matcher - orb-hamming-ransac-v1 Strategy', () => {
	it('should accept transformed/deformed reference image features (Positive Test)', () => {
		const pointCount = 60
		const refPoints: Array<{ x: number; y: number }> = []
		const queryPoints: Array<{ x: number; y: number }> = []

		// 共享的高辨识度描述子，添加微弱噪声
		const rawDescriptors = generateRandomDescriptors(pointCount)
		const queryDescriptors = new Uint8Array(rawDescriptors)

		for (let i = 0; i < pointCount; i++) {
			const x = 50 + (i % 8) * 60 + Math.random() * 5
			const y = 50 + Math.floor(i / 8) * 50 + Math.random() * 5
			refPoints.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) })

			// 透视形变 + 缩放平移: x' = 1.05*x + 12, y' = 1.02*y + 8
			const qx = 1.05 * x + 12 + (Math.random() - 0.5) * 0.5
			const qy = 1.02 * y + 8 + (Math.random() - 0.5) * 0.5
			queryPoints.push({ x: Number(qx.toFixed(1)), y: Number(qy.toFixed(1)) })

			// 为 query 描述子注入 1~2 bit 极其微弱的噪声模拟光照变化
			const offset = i * 32
			queryDescriptors[offset] = queryDescriptors[offset]! ^ 0x01
		}

		const refPayload = createMockPayload(refPoints, rawDescriptors)
		const queryPayload = createMockPayload(queryPoints, queryDescriptors)

		const startTime = performance.now()
		const result = orbHammingRansacMatcherV1.match({
			query: queryPayload,
			reference: refPayload,
		})
		const durationMs = performance.now() - startTime

		expect(result.matched).toBe(true)
		expect(result.reason).toBe('matched')
		expect(result.goodMatchCount).toBeGreaterThanOrEqual(20)
		expect(result.inlierCount).toBeGreaterThanOrEqual(12)
		expect(result.inlierRatio).toBeGreaterThanOrEqual(0.45)
		expect(durationMs).toBeLessThan(50) // 确保在 50ms 内极速完成 (通常 < 5ms)
	})

	it('should reject completely unrelated images with random features (Negative Test)', () => {
		const pointCount = 60
		const pointsA: Array<{ x: number; y: number }> = []
		const pointsB: Array<{ x: number; y: number }> = []

		for (let i = 0; i < pointCount; i++) {
			pointsA.push({ x: Math.random() * 600, y: Math.random() * 400 })
			pointsB.push({ x: Math.random() * 600, y: Math.random() * 400 })
		}

		const descA = generateRandomDescriptors(pointCount)
		const descB = generateRandomDescriptors(pointCount)

		const payloadA = createMockPayload(pointsA, descA)
		const payloadB = createMockPayload(pointsB, descB)

		const result = orbHammingRansacMatcherV1.match({
			query: payloadA,
			reference: payloadB,
		})

		expect(result.matched).toBe(false)
		expect(result.reason).not.toBe('matched')
	})

	it('should reject when features count is below minimum requirement', () => {
		const pointCount = 10 // 低于 MIN_KEYPOINTS_CLIENT (20)
		const points: Array<{ x: number; y: number }> = []
		for (let i = 0; i < pointCount; i++) {
			points.push({ x: i * 10, y: i * 10 })
		}
		const desc = generateRandomDescriptors(pointCount)
		const payload = createMockPayload(points, desc)

		const result = orbHammingRansacMatcherV1.match({
			query: payload,
			reference: payload,
		})

		expect(result.matched).toBe(false)
		expect(result.reason).toBe('insufficient_features')
	})

	it('should reject textured images that match Lowe ratio but fail geometric Homography consistency', () => {
		const pointCount = 40
		const refPoints: Array<{ x: number; y: number }> = []
		const queryPoints: Array<{ x: number; y: number }> = []

		// 具有相同描述子，但是关键点几何位置完全随机错乱（如重复纹理或恶意碰撞）
		const descriptors = generateRandomDescriptors(pointCount)

		for (let i = 0; i < pointCount; i++) {
			refPoints.push({ x: i * 10, y: i * 10 })
			queryPoints.push({ x: Math.random() * 500, y: Math.random() * 500 }) // 完全错乱无单应性规律
		}

		const refPayload = createMockPayload(refPoints, descriptors)
		const queryPayload = createMockPayload(queryPoints, descriptors)

		const result = orbHammingRansacMatcherV1.match({
			query: queryPayload,
			reference: refPayload,
		})

		expect(result.matched).toBe(false)
		expect(result.reason).toBe('homography_failed')
	})
})
