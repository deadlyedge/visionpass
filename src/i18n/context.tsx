import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { getDictionary } from './locales'
import {
	DEFAULT_LOCALE,
	type I18nContextValue,
	type SupportedLocale,
	type TranslationKey,
	type TranslationSchema,
} from './types'

const I18nContext = createContext<I18nContextValue | null>(null)

export const COOKIE_NAME = 'visionpass_locale'

export function getClientInitialLocale(): SupportedLocale {
	if (typeof window === 'undefined') return DEFAULT_LOCALE

	// 1. URL search param (?lang=en-US or ?lang=zh-CN)
	const urlParams = new URLSearchParams(window.location.search)
	const langParam = urlParams.get('lang')
	if (langParam === 'en-US' || langParam === 'zh-CN') {
		return langParam
	}

	// 2. Cookie
	const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
	if (match && (match[2] === 'zh-CN' || match[2] === 'en-US')) {
		return match[2] as SupportedLocale
	}

	// 3. LocalStorage
	const stored = localStorage.getItem(COOKIE_NAME)
	if (stored === 'zh-CN' || stored === 'en-US') {
		return stored
	}

	// 4. Browser language detection
	const navLang = navigator.language.toLowerCase()
	if (navLang.startsWith('zh')) {
		return 'zh-CN'
	}
	if (navLang.startsWith('en')) {
		return 'en-US'
	}

	return DEFAULT_LOCALE
}

export function I18nProvider({
	initialLocale = DEFAULT_LOCALE,
	children,
}: {
	initialLocale?: SupportedLocale
	children: React.ReactNode
}) {
	const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale)

	useEffect(() => {
		const detected = getClientInitialLocale()
		setLocaleState(detected)
	}, [])

	const setLocale = (newLocale: SupportedLocale) => {
		setLocaleState(newLocale)
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(COOKIE_NAME, newLocale)
				// biome-ignore lint/suspicious/noDocumentCookie: Cookie for SSR locale detection
				document.cookie = `${COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`
				document.documentElement.lang = newLocale
			} catch (e) {
				console.warn('[I18n] Failed to persist locale preference:', e)
			}
		}
	}

	const dict: TranslationSchema = getDictionary(locale)

	const t = (
		path: TranslationKey,
		params?: Record<string, string | number>,
	): string => {
		const keys = path.split('.')
		let current: any = dict
		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = current[key]
			} else {
				return path
			}
		}

		if (typeof current !== 'string') return path

		if (params) {
			return Object.entries(params).reduce((str, [k, v]) => {
				return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
			}, current)
		}

		return current
	}

	return (
		<I18nContext.Provider value={{ locale, setLocale, t, dict }}>
			{children}
		</I18nContext.Provider>
	)
}

export function useI18n() {
	const ctx = useContext(I18nContext)
	if (!ctx) {
		throw new Error('useI18n must be used within an I18nProvider')
	}
	return ctx
}
