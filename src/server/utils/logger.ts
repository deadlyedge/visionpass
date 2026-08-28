const isDev = process.env.NODE_ENV !== 'production'

function formatTimestamp(): string {
	return new Date().toISOString()
}

export const serverLogger = {
	info(scope: string, message: string, meta?: Record<string, unknown>) {
		console.log(
			`[${formatTimestamp()}] [INFO] [${scope}] ${message}`,
			meta ? JSON.stringify(meta) : '',
		)
	},

	warn(scope: string, message: string, meta?: Record<string, unknown>) {
		console.warn(
			`[${formatTimestamp()}] [WARN] [${scope}] ${message}`,
			meta ? JSON.stringify(meta) : '',
		)
	},

	error(
		scope: string,
		message: string,
		error?: unknown,
		meta?: Record<string, unknown>,
	) {
		console.error(
			`[${formatTimestamp()}] [ERROR] [${scope}] ${message}`,
			meta ? JSON.stringify(meta) : '',
			error,
		)
	},

	debug(scope: string, message: string, meta?: Record<string, unknown>) {
		if (isDev) {
			console.log(
				`[${formatTimestamp()}] [DEBUG] [${scope}] ${message}`,
				meta ? JSON.stringify(meta) : '',
			)
		}
	},
}
