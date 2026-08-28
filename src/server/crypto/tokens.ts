import { createHmac, randomBytes } from 'node:crypto'
import { CONSTANTS } from '@/lib/constants'

// Base32 Crockford-style alphabet (excluding I, L, O, U to avoid visual confusion)
const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * 获取 TOKEN_PEPPER 密钥
 * 若开发环境未设置，则提供默认 fallback 并打印警告
 */
export function getTokenPepper(): string {
	const pepper = process.env.TOKEN_PEPPER
	if (!pepper) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error('TOKEN_PEPPER environment variable is not configured!')
		}
		return 'visionpass_dev_default_token_pepper_secret_value_32b'
	}
	return pepper
}

/**
 * 使用 HMAC-SHA-256 计算 token 或 passcode 的安全哈希
 */
export function hashToken(rawToken: string): string {
	const pepper = getTokenPepper()
	return createHmac('sha256', pepper).update(rawToken.trim()).digest('hex')
}

/**
 * 生成安全的 CSPRNG publicToken (~22 字符 Base64URL)
 */
export function generatePublicToken(): string {
	return randomBytes(CONSTANTS.CRYPTO.TOKEN_BYTES).toString('base64url')
}

/**
 * 生成用户友好的 displayPasscode (易读 Base32)
 */
export function generateDisplayPasscode(
	length = CONSTANTS.CRYPTO.PASSCODE_LENGTH,
): string {
	const bytes = randomBytes(length)
	let result = ''
	for (let i = 0; i < length; i++) {
		const byte = bytes[i] ?? 0
		result += BASE32_ALPHABET[byte % BASE32_ALPHABET.length]
	}
	return result
}

/**
 * 生成展示提示（如前 3 位和后 2 位，中间用 * 遮盖）
 */
export function getPasscodeHint(passcode: string): string {
	if (passcode.length <= 4) return passcode
	const prefix = passcode.slice(0, 3)
	const suffix = passcode.slice(-2)
	return `${prefix}***${suffix}`
}

/**
 * 一次性生成双 Token 组合及其哈希
 */
export function generateTokenPair() {
	const publicToken = generatePublicToken()
	const displayPasscode = generateDisplayPasscode()
	const publicTokenHash = hashToken(publicToken)
	const passcodeHash = hashToken(displayPasscode)
	const passcodeHint = getPasscodeHint(displayPasscode)

	return {
		publicToken,
		displayPasscode,
		publicTokenHash,
		passcodeHash,
		passcodeHint,
	}
}
