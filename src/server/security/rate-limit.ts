import { createHash } from 'node:crypto'

interface RateLimitConfig {
	windowMs: number // 滑动窗口时间 (毫秒)
	maxRequests: number // 窗口内最大允许请求数
}

interface RateLimitRecord {
	count: number
	resetTime: number
}

// 内存级滑动窗口存储
const rateLimitStore = new Map<string, RateLimitRecord>()

// 定时清理过期记录防止内存泄漏 (每 5 分钟清理一次)
if (typeof setInterval !== 'undefined') {
	setInterval(
		() => {
			const now = Date.now()
			for (const [key, record] of rateLimitStore.entries()) {
				if (now > record.resetTime) {
					rateLimitStore.delete(key)
				}
			}
		},
		5 * 60 * 1000,
	)
}

/**
 * 计算客户端 IP 的单向哈希 (保护隐私同时提供限流标识)
 */
export function hashClientIp(clientIp?: string | null): string {
	const raw = clientIp || '127.0.0.1'
	return createHash('sha256').update(raw).digest('hex')
}

/**
 * 内存滑动窗口限流器
 * @returns { success: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
	identifier: string,
	action: 'create' | 'verify' | 'meta' | 'global',
	customConfig?: Partial<RateLimitConfig>,
): {
	success: boolean
	remaining: number
	resetTime: number
} {
	// 默认限流策略配置
	const defaultConfigs: Record<string, RateLimitConfig> = {
		create: { windowMs: 60 * 1000, maxRequests: 20 }, // 1 分钟最多创建 20 个凭证
		verify: { windowMs: 60 * 1000, maxRequests: 80 }, // 1 分钟最多发起 80 次验证尝试
		meta: { windowMs: 60 * 1000, maxRequests: 150 }, // 1 分钟最多 150 次元数据查询
		global: { windowMs: 60 * 1000, maxRequests: 300 },
	}

	const config = {
		...defaultConfigs[action],
		...customConfig,
	} as RateLimitConfig

	const key = `${action}:${identifier}`
	const now = Date.now()
	const record = rateLimitStore.get(key)

	if (!record || now > record.resetTime) {
		const newRecord: RateLimitRecord = {
			count: 1,
			resetTime: now + config.windowMs,
		}
		rateLimitStore.set(key, newRecord)
		return {
			success: true,
			remaining: config.maxRequests - 1,
			resetTime: newRecord.resetTime,
		}
	}

	if (record.count >= config.maxRequests) {
		return {
			success: false,
			remaining: 0,
			resetTime: record.resetTime,
		}
	}

	record.count += 1
	return {
		success: true,
		remaining: config.maxRequests - record.count,
		resetTime: record.resetTime,
	}
}
