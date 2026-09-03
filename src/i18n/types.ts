export type SupportedLocale = 'zh-CN' | 'en-US'

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

export const SUPPORTED_LOCALES: {
	code: SupportedLocale
	label: string
	shortLabel: string
	flag: string
}[] = [
	{ code: 'zh-CN', label: '简体中文', shortLabel: '中', flag: '🇨🇳' },
	{ code: 'en-US', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
]

import type { TranslationDict } from './locales/zh-CN'

export type TranslationSchema = TranslationDict

type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}.${P}`
		: never
	: never

export type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
		? `${Key}` | Join<Key, NestedKeyOf<ObjectType[Key]>>
		: `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationKey = NestedKeyOf<TranslationSchema>

export interface I18nContextValue {
	locale: SupportedLocale
	setLocale: (locale: SupportedLocale) => void
	t: (key: TranslationKey, params?: Record<string, string | number>) => string
	dict: TranslationSchema
}
