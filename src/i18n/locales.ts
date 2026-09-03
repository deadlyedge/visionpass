import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'
import type { SupportedLocale, TranslationSchema } from './types'

export const dictionaries: Record<SupportedLocale, TranslationSchema> = {
	'zh-CN': zhCN,
	'en-US': enUS,
}

export function getDictionary(locale: SupportedLocale): TranslationSchema {
	return dictionaries[locale] || dictionaries['zh-CN']
}
