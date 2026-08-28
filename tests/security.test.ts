import { describe, expect, it } from 'bun:test'
import { checkRateLimit, hashClientIp } from '../src/server/security/rate-limit'

describe('Security - IP Hashing & Rate Limiter', () => {
	it('should generate consistent SHA-256 IP hash', () => {
		const ip = '192.168.1.100'
		const hash1 = hashClientIp(ip)
		const hash2 = hashClientIp(ip)
		expect(hash1).toBe(hash2)
		expect(hash1.length).toBe(64)
	})

	it('should allow requests within rate limit and block requests exceeding limit', () => {
		const testId = `test_client_${Date.now()}`
		const config = { windowMs: 1000, maxRequests: 3 }

		// Request 1, 2, 3 should succeed
		expect(checkRateLimit(testId, 'verify', config).success).toBe(true)
		expect(checkRateLimit(testId, 'verify', config).success).toBe(true)
		expect(checkRateLimit(testId, 'verify', config).success).toBe(true)

		// Request 4 should be blocked
		const blockedResult = checkRateLimit(testId, 'verify', config)
		expect(blockedResult.success).toBe(false)
		expect(blockedResult.remaining).toBe(0)
	})
})
