/**
 * 扩展内共用常量
 */
export const NEWTAB_PAGE_PATH = 'src/newtab/newtab.html'

export function getNewtabUrl(ritual = false): string {
  const base = chrome.runtime.getURL(NEWTAB_PAGE_PATH)
  return ritual ? `${base}?ritual=1` : base
}
