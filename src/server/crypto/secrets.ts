import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128-bit auth tag

/**
 * 获取 32 字节的 AES 加密密钥 Buffer
 */
export function getEncryptionKey(): Buffer {
	const rawKey = process.env.SECRET_ENCRYPTION_KEY

	if (!rawKey) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error(
				'SECRET_ENCRYPTION_KEY environment variable is not configured!',
			)
		}
		// 开发环境 32 字节 fallback 密钥
		return Buffer.from(
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
			'hex',
		)
	}

	// 支持 Hex (64 chars) 或 Base64 (44 chars) 或直接 32 字符纯文本
	if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
		return Buffer.from(rawKey, 'hex')
	}

	const buf = Buffer.from(rawKey, 'base64')
	if (buf.length === 32) {
		return buf
	}

	const utf8Buf = Buffer.from(rawKey, 'utf-8')
	if (utf8Buf.length === 32) {
		return utf8Buf
	}

	throw new Error(
		`SECRET_ENCRYPTION_KEY 必须是有效的 32 字节 (64-char hex, 44-char base64, 或 32-char utf8), 当前长度: ${utf8Buf.length}`,
	)
}

export type EncryptedSecret = {
	ciphertext: Buffer
	iv: Buffer
	authTag: Buffer
	version: number
}

/**
 * 使用 AES-256-GCM AEAD 加密明文密语
 */
export function encryptSecret(
	plainText: string,
	customKey?: Buffer,
): EncryptedSecret {
	const key = customKey || getEncryptionKey()
	const iv = randomBytes(IV_LENGTH)
	const cipher = createCipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	})

	const ciphertext = Buffer.concat([
		cipher.update(plainText, 'utf8'),
		cipher.final(),
	])
	const authTag = cipher.getAuthTag()

	return {
		ciphertext,
		iv,
		authTag,
		version: 1,
	}
}

/**
 * 使用 AES-256-GCM AEAD 解密密文
 */
export function decryptSecret(
	encrypted: {
		ciphertext: Buffer | Uint8Array
		iv: Buffer | Uint8Array
		authTag: Buffer | Uint8Array
	},
	customKey?: Buffer,
): string {
	const key = customKey || getEncryptionKey()
	const iv = Buffer.from(encrypted.iv)
	const authTag = Buffer.from(encrypted.authTag)
	const ciphertext = Buffer.from(encrypted.ciphertext)

	const decipher = createDecipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	})
	decipher.setAuthTag(authTag)

	const decrypted = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	])

	return decrypted.toString('utf8')
}
