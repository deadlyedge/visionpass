import type { MatchPair, Point2D } from './types'

/**
 * 3x3 单应性矩阵（列优先存储或 9 元素一维数组）
 * [ h00, h01, h02,
 *   h10, h11, h12,
 *   h20, h21, h22 ]
 */
export type HomographyMatrix = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
]

/**
 * 求解 4 对对应点的 3x3 单应性变换矩阵 H (DLT 算法)
 * 使得 (x', y', 1)^T ~ H * (x, y, 1)^T
 */
export function findHomography4Points(
	src: [Point2D, Point2D, Point2D, Point2D],
	dst: [Point2D, Point2D, Point2D, Point2D],
): HomographyMatrix | null {
	// 构建 8x8 线性方程组 A * h = b (固定 h22 = 1)
	// 对于每一对点 (x, y) -> (u, v):
	// [ x, y, 1, 0, 0, 0, -u*x, -u*y ] [h00..h21]^T = u
	// [ 0, 0, 0, x, y, 1, -v*x, -v*y ] [h00..h21]^T = v

	const A: number[][] = []
	const B: number[] = []

	for (let i = 0; i < 4; i++) {
		const srcPt = src[i]
		const dstPt = dst[i]
		if (!srcPt || !dstPt) return null

		const { x, y } = srcPt
		const { x: u, y: v } = dstPt

		A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
		B.push(u)

		A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
		B.push(v)
	}

	// 高斯-若尔当消元法求解 8x8 线性系统
	const h = solveLinearSystem8x8(A, B)
	if (!h) return null

	const h00 = h[0] ?? 0
	const h01 = h[1] ?? 0
	const h02 = h[2] ?? 0
	const h10 = h[3] ?? 0
	const h11 = h[4] ?? 0
	const h12 = h[5] ?? 0
	const h20 = h[6] ?? 0
	const h21 = h[7] ?? 0

	return [h00, h01, h02, h10, h11, h12, h20, h21, 1]
}

/**
 * 求解 8x8 线性方程组 A * x = B
 */
function solveLinearSystem8x8(A: number[][], B: number[]): number[] | null {
	const n = 8
	// 增广矩阵
	const M: number[][] = []
	for (let i = 0; i < n; i++) {
		const rowA = A[i]
		const valB = B[i]
		if (!rowA || valB === undefined) return null
		M.push([...rowA, valB])
	}

	for (let i = 0; i < n; i++) {
		// 主元选择
		let maxRow = i
		let maxVal = Math.abs(M[i]?.[i] ?? 0)
		for (let k = i + 1; k < n; k++) {
			const val = Math.abs(M[k]?.[i] ?? 0)
			if (val > maxVal) {
				maxVal = val
				maxRow = k
			}
		}

		if (maxVal < 1e-10) {
			return null // 奇异或共线退化
		}

		// 交换行
		if (maxRow !== i) {
			const temp = M[i]
			const target = M[maxRow]
			if (temp && target) {
				M[i] = target
				M[maxRow] = temp
			}
		}

		const currentRow = M[i]
		if (!currentRow) return null
		const pivot = currentRow[i] ?? 0
		if (Math.abs(pivot) < 1e-10) return null

		for (let j = i; j <= n; j++) {
			const val = currentRow[j]
			if (val !== undefined) {
				currentRow[j] = val / pivot
			}
		}

		for (let k = 0; k < n; k++) {
			if (k !== i) {
				const targetRow = M[k]
				if (!targetRow) continue
				const factor = targetRow[i] ?? 0
				if (Math.abs(factor) > 1e-12) {
					for (let j = i; j <= n; j++) {
						const curVal = currentRow[j] ?? 0
						const tgtVal = targetRow[j] ?? 0
						targetRow[j] = tgtVal - factor * curVal
					}
				}
			}
		}
	}

	const result: number[] = []
	for (let i = 0; i < n; i++) {
		const val = M[i]?.[n]
		if (val === undefined || Number.isNaN(val) || !Number.isFinite(val)) {
			return null
		}
		result.push(val)
	}

	return result
}

/**
 * 应用单应性矩阵映射单个点 (x, y)
 */
export function applyHomography(
	H: HomographyMatrix,
	pt: Point2D,
): Point2D | null {
	const [h00, h01, h02, h10, h11, h12, h20, h21, h22] = H
	const z = h20 * pt.x + h21 * pt.y + h22

	if (Math.abs(z) < 1e-7) {
		return null
	}

	const x = (h00 * pt.x + h01 * pt.y + h02) / z
	const y = (h10 * pt.x + h11 * pt.y + h12) / z

	return { x, y }
}

/**
 * 检查 4 个点中是否有 3 点共线
 */
function are3PointsCollinear(p1: Point2D, p2: Point2D, p3: Point2D): boolean {
	// 三角形面积公式: |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)| / 2
	const area2 = Math.abs(
		p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y),
	)
	return area2 < 1.0 // 面积接近 0
}

/**
 * 检查 4 个点中任意 3 点是否共线
 */
function checkCollinear4(
	points: [Point2D, Point2D, Point2D, Point2D],
): boolean {
	const [p0, p1, p2, p3] = points
	return (
		are3PointsCollinear(p0, p1, p2) ||
		are3PointsCollinear(p0, p1, p3) ||
		are3PointsCollinear(p0, p2, p3) ||
		are3PointsCollinear(p1, p2, p3)
	)
}

export type RansacOptions = {
	maxIterations?: number
	reprojectionErrorThresh?: number
	confidence?: number
}

export type RansacResult = {
	inliers: MatchPair[]
	inlierRatio: number
	homography: HomographyMatrix | null
}

/**
 * 纯 TypeScript 实现的 RANSAC 单应性矩阵拟合与内点检验
 */
export function ransacHomography(
	matches: MatchPair[],
	options: RansacOptions = {},
): RansacResult {
	const n = matches.length
	if (n < 4) {
		return {
			inliers: [],
			inlierRatio: 0,
			homography: null,
		}
	}

	const maxIter = options.maxIterations ?? 500
	const threshold = options.reprojectionErrorThresh ?? 3.0
	const thresholdSq = threshold * threshold

	let bestInliers: MatchPair[] = []
	let bestHomography: HomographyMatrix | null = null

	for (let iter = 0; iter < maxIter; iter++) {
		// 1. 随机选取 4 个不重复的匹配点对
		const idx0 = Math.floor(Math.random() * n)
		let idx1 = Math.floor(Math.random() * n)
		while (idx1 === idx0) idx1 = Math.floor(Math.random() * n)
		let idx2 = Math.floor(Math.random() * n)
		while (idx2 === idx0 || idx2 === idx1) idx2 = Math.floor(Math.random() * n)
		let idx3 = Math.floor(Math.random() * n)
		while (idx3 === idx0 || idx3 === idx1 || idx3 === idx2)
			idx3 = Math.floor(Math.random() * n)

		const m0 = matches[idx0]
		const m1 = matches[idx1]
		const m2 = matches[idx2]
		const m3 = matches[idx3]

		if (!m0 || !m1 || !m2 || !m3) continue

		const srcPts: [Point2D, Point2D, Point2D, Point2D] = [
			m0.queryPoint,
			m1.queryPoint,
			m2.queryPoint,
			m3.queryPoint,
		]
		const dstPts: [Point2D, Point2D, Point2D, Point2D] = [
			m0.refPoint,
			m1.refPoint,
			m2.refPoint,
			m3.refPoint,
		]

		// 2. 共线退化检验
		if (checkCollinear4(srcPts) || checkCollinear4(dstPts)) {
			continue
		}

		// 3. 计算单应性矩阵 H
		const H = findHomography4Points(srcPts, dstPts)
		if (!H) continue

		// 4. 计算当前模型下的内点集合 (重投影误差 < threshold)
		const currentInliers: MatchPair[] = []
		for (let i = 0; i < n; i++) {
			const m = matches[i]
			if (!m) continue
			const projected = applyHomography(H, m.queryPoint)
			if (!projected) continue

			const dx = projected.x - m.refPoint.x
			const dy = projected.y - m.refPoint.y
			const errSq = dx * dx + dy * dy

			if (errSq <= thresholdSq) {
				currentInliers.push(m)
			}
		}

		// 5. 更新全局最优模型
		if (currentInliers.length > bestInliers.length) {
			bestInliers = currentInliers
			bestHomography = H

			// 提前跳出优化：如果内点已经超过 80%，无需过多额外迭代
			if (bestInliers.length > n * 0.85) {
				break
			}
		}
	}

	const inlierRatio = n > 0 ? bestInliers.length / n : 0

	return {
		inliers: bestInliers,
		inlierRatio,
		homography: bestHomography,
	}
}
