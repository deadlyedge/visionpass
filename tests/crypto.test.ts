import { describe, expect, it } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { decryptSecret, encryptSecret } from '../src/server/crypto/secrets'
import {
	generateDisplayPasscode,
	generatePublicToken,
	generateTokenPair,
	getPasscodeHint,
	hashToken,
} from '../src/server/crypto/tokens'

describe('Crypto - Tokens Module', () => {
	it('should generate valid public tokens with base64url format', () => {
		const token = generatePublicToken()
		expect(typeof token).toBe('string')
		expect(token.length).toBeGreaterThanOrEqual(20)
		expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true)
	})

	it('should generate valid display passcodes with Crockford Base32 format', () => {
		const passcode = generateDisplayPasscode(10)
		expect(passcode.length).toBe(10)
		expect(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(passcode)).toBe(true)
	})

	it('should generate deterministic HMAC-SHA-256 hash for identical inputs', () => {
		const token = 'test-token-123456'
		const hash1 = hashToken(token)
		const hash2 = hashToken(token)
		expect(hash1).toBe(hash2)
		expect(hash1.length).toBe(64) // SHA-256 in hex is 64 chars
		expect(/^[0-9a-f]+$/.test(hash1)).toBe(true)
	})

	it('should generate distinct hashes for different inputs', () => {
		const hash1 = hashToken('tokenA')
		const hash2 = hashToken('tokenB')
		expect(hash1).not.toBe(hash2)
	})

	it('should properly mask passcodes with getPasscodeHint', () => {
		const passcode = 'AB123456YZ'
		const hint = getPasscodeHint(passcode)
		expect(hint).toBe('AB1***YZ')
	})

	it('should generate complete token pair with valid properties', () => {
		const pair = generateTokenPair()
		expect(pair.publicToken).toBeDefined()
		expect(pair.displayPasscode).toBeDefined()
		expect(pair.publicTokenHash).toBe(hashToken(pair.publicToken))
		expect(pair.passcodeHash).toBe(hashToken(pair.displayPasscode))
		expect(pair.passcodeHint).toBe(getPasscodeHint(pair.displayPasscode))
	})
})

describe('Crypto - AES-256-GCM Secrets Module', () => {
	it('should encrypt and decrypt plaintext accurately', () => {
		const plainSecret = 'Hello VisionPass 2026! 🔐 这是一个超级机密的密语。'
		const encrypted = encryptSecret(plainSecret)

		expect(encrypted.ciphertext).toBeInstanceOf(Buffer)
		expect(encrypted.iv.length).toBe(12)
		expect(encrypted.authTag.length).toBe(16)
		expect(encrypted.version).toBe(1)

		const decrypted = decryptSecret(encrypted)
		expect(decrypted).toBe(plainSecret)
	})

	it('should encrypt same plaintext with different IVs producing different ciphertexts', () => {
		const plainSecret = 'ConsistentSecret'
		const enc1 = encryptSecret(plainSecret)
		const enc2 = encryptSecret(plainSecret)

		expect(enc1.ciphertext.equals(enc2.ciphertext)).toBe(false)
		expect(enc1.iv.equals(enc2.iv)).toBe(false)

		expect(decryptSecret(enc1)).toBe(plainSecret)
		expect(decryptSecret(enc2)).toBe(plainSecret)
	})

	it('should work with custom 32-byte key', () => {
		const customKey = randomBytes(32)
		const message = 'Secret with custom key'
		const enc = encryptSecret(message, customKey)
		const dec = decryptSecret(enc, customKey)
		expect(dec).toBe(message)
	})

	it('should throw error when ciphertext is tampered with', () => {
		const plainSecret = 'Tamper-proof message'
		const encrypted = encryptSecret(plainSecret)

		// Tamper with ciphertext
		const tamperedCiphertext = Buffer.from(encrypted.ciphertext)
		tamperedCiphertext[0] = tamperedCiphertext[0]! ^ 0xff

		expect(() => {
			decryptSecret({
				...encrypted,
				ciphertext: tamperedCiphertext,
			})
		}).toThrow()
	})

	it('should throw error when auth tag is invalid', () => {
		const plainSecret = 'Auth-tag protected message'
		const encrypted = encryptSecret(plainSecret)

		const invalidAuthTag = randomBytes(16)
		expect(() => {
			decryptSecret({
				...encrypted,
				authTag: invalidAuthTag,
			})
		}).toThrow()
	})
})
