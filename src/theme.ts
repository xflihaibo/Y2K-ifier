/**
 * 扩展 UI 主题（Popup / Newtab），与网页复古注入无关
 */
export type UiTheme = 'light' | 'dark'

const STORAGE_KEY = 'uiTheme'

export function applyThemeClass(theme: UiTheme): void {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light')
}

export async function getStoredTheme(): Promise<UiTheme> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve('light')
      return
    }
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const v = data[STORAGE_KEY]
      resolve(v === 'dark' ? 'dark' : 'light')
    })
  })
}

export async function setStoredTheme(theme: UiTheme): Promise<void> {
  applyThemeClass(theme)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: theme })
  }
}
