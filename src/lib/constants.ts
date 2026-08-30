export const CONSTANTS = {
	APP: {
		NAME: 'VisionPass',
		VERSION: 'v0.6.2',
		GITHUB_REPO_URL: 'https://github.com/deadlyedge/visionpass',
	},
	CRYPTO: {
		TOKEN_BYTES: 16, // 16 bytes = 128 bits -> ~22 chars Base64URL
		PASSCODE_LENGTH: 8, // 10 chars Base32
		RESERVE_TTL_MINUTES: 30, // 预留凭证 30 分钟过期
		DEFAULT_EXPIRES_DAYS: 7, // 凭证默认 7 天过期
	},
	MATCH: {
		DESCRIPTOR_SIZE: 32 as const,
		MAX_HAMMING_DISTANCE: 50,
		RATIO_THRESHOLD: 0.75, // Lowe's ratio test: d1 < 0.75 * d2
		MIN_GOOD_MATCHES: 20, // 至少 20 个 good matches
		MIN_INLIERS: 12, // 至少 12 个 RANSAC 几何内点
		MIN_INLIER_RATIO: 0.45, // 内点比率 >= 45%
		REPROJECTION_ERROR_THRESH: 3.0, // RANSAC 投影误差上限 (像素)
		RANSAC_MAX_ITERATIONS: 1000,
		RANSAC_CONFIDENCE: 0.99,
		MIN_KEYPOINTS_CLIENT: 20,
		MAX_KEYPOINTS: 500,
		TARGET_LONG_EDGE: 640,
		ORB_MAX_FEATURES: 500,
	},
} as const
