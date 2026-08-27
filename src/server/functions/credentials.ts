import type {
	CreateCredentialRequest,
	CreateCredentialResponse,
	CredentialMetaResponse,
	VerifyRequest,
	VerifyResponse,
} from '../../lib/feature-schema'

type ServerFn<TInput, TOutput> = ((opts: {
	data: TInput
}) => Promise<TOutput>) & {
	url: string
}

function createClientRpc<TInput, TOutput>(
	endpoint: string,
	method: 'GET' | 'POST' = 'POST',
): ServerFn<TInput, TOutput> {
	const fn = (async ({ data }: { data: TInput }): Promise<TOutput> => {
		let url = endpoint
		const options: RequestInit = {
			method,
			headers: { 'Content-Type': 'application/json' },
		}

		if (method === 'GET') {
			const searchParams = new URLSearchParams()
			if (data && typeof data === 'object') {
				for (const [k, v] of Object.entries(data)) {
					if (v !== undefined && v !== null) {
						searchParams.append(k, String(v))
					}
				}
			}
			const qs = searchParams.toString()
			if (qs) {
				url = `${url}?${qs}`
			}
		} else {
			options.body = JSON.stringify(data)
		}

		const res = await fetch(url, options)
		if (!res.ok) {
			const errJson = await res.json().catch(() => ({}))
			throw new Error(
				errJson.error || errJson.message || `请求失败 (${res.status})`,
			)
		}

		return res.json()
	}) as ServerFn<TInput, TOutput>

	fn.url = endpoint
	return fn
}

/**
 * 1. 创建凭证 Server Function 客户端 RPC
 */
export const createCredentialFn = createClientRpc<
	CreateCredentialRequest,
	CreateCredentialResponse
>('/_server/credentials', 'POST')

/**
 * 2. 查询凭证状态 Server Function 客户端 RPC
 */
export const getCredentialMetaFn = createClientRpc<
	{ token: string },
	CredentialMetaResponse
>('/_server/credentials', 'GET')

/**
 * 3. 验证比对凭证 Server Function 客户端 RPC
 */
export const verifyCredentialFn = createClientRpc<
	VerifyRequest,
	VerifyResponse
>('/_server/verify', 'POST')
