/**
 * 扩展内共用常量
 */
export const NEWTAB_PAGE_PATH = 'src/newtab/newtab.html'

export function getNewtabUrl(): string {
  return chrome.runtime.getURL(NEWTAB_PAGE_PATH)
}
