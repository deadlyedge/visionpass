import type {
	CreateCredentialRequest,
	CreateCredentialResponse,
	CredentialMetaResponse,
	VerifyRequest,
	VerifyResponse,
} from './feature-schema'

export async function createCredential(
	req: CreateCredentialRequest,
): Promise<CreateCredentialResponse> {
	const res = await fetch('/api/credentials', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})

	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		throw new Error(data.error || `创建凭证失败 (${res.status})`)
	}

	return res.json()
}

export async function getCredentialMeta(
	token: string,
): Promise<CredentialMetaResponse> {
	const res = await fetch(`/api/credentials/${token}`)
	if (res.status === 404) {
		return { exists: false }
	}
	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		throw new Error(data.error || `获取凭证信息失败 (${res.status})`)
	}
	return res.json()
}

export async function verifyCredential(
	req: VerifyRequest,
): Promise<VerifyResponse> {
	const res = await fetch('/api/verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})

	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		throw new Error(data.error || `验证请求失败 (${res.status})`)
	}

	return res.json()
}
