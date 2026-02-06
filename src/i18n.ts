import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export type LocaleId = 'en' | 'zh-CN'

function detectLocale(): LocaleId {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

export const i18n = createI18n<false>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
  },
})

const STORAGE_KEY = 'locale'

export async function getStoredLocale(): Promise<LocaleId> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(detectLocale())
      return
    }
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const v = data[STORAGE_KEY]
      resolve(v === 'zh-CN' || v === 'en' ? v : detectLocale())
    })
  })
}

export async function setStoredLocale(locale: LocaleId): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: locale })
  }
  i18n.global.locale.value = locale
}

export { detectLocale }
