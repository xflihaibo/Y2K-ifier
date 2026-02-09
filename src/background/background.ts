/**
 * Y2K-ifier Background Service Worker
 */

import { getNewtabUrl } from '@/constants'

const RETRO_CSS_FILE = 'styles/retro.css'

/** Browsing data: today's visits with duration, clicks, scroll, chars (like 伴影) */
interface Y2kBrowsingRecord {
  url: string
  title?: string
  icon?: string
  visitTime: number
  activeDuration?: number
  clicks?: number
  scrollDistance?: number
  charsTyped?: number
}

interface Y2kUpdateStatsData {
  clicks?: number
  scrollDistance?: number
  charsTyped?: number
  /** 来自 content 心跳的可见停留秒数（参考伴影） */
  activeDuration?: number
}

let activeTabInfo: { tabId: number | null; url: string | null; startTime: number | null } = {
  tabId: null,
  url: null,
  startTime: null,
}

function getCleanUrl(u: string): string {
  try {
    const urlObj = new URL(u)
    return urlObj.origin + urlObj.pathname
  } catch {
    return u
  }
}

function isBrowsingRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore')
  )
}

async function ensureY2kRecordExists(tab: chrome.tabs.Tab) {
  if (!tab.url || isBrowsingRestrictedUrl(tab.url)) return
  const res = await chrome.storage.local.get({ y2kBrowsingData: [] as Y2kBrowsingRecord[] })
  let list = res.y2kBrowsingData || []
  const today = new Date().toDateString()
  const cleanUrl = getCleanUrl(tab.url)
  let found = false
  for (const r of list) {
    if (getCleanUrl(r.url) === cleanUrl && new Date(r.visitTime).toDateString() === today) {
      r.title = tab.title || r.title
      r.icon = tab.favIconUrl || r.icon
      found = true
      break
    }
  }
  if (!found) {
    list.push({
      url: tab.url,
      title: tab.title || '',
      icon: tab.favIconUrl || '',
      visitTime: Date.now(),
      activeDuration: 0,
      clicks: 0,
      scrollDistance: 0,
      charsTyped: 0,
    })
  }
  await chrome.storage.local.set({ y2kBrowsingData: list })
}

function stopBrowsingTracking() {
  // 停留时长由 content 在 visibility hidden 时上报，不在此处累计
  activeTabInfo = { tabId: null, url: null, startTime: null }
}

async function handleBrowsingTabChange(tabId: number) {
  // 停留时长由 content 心跳上报 activeDuration，此处仅切换当前 tab 并确保有今日记录
  const tab = await chrome.tabs.get(tabId).catch(() => null)
  if (!tab || !tab.url || isBrowsingRestrictedUrl(tab.url)) {
    activeTabInfo = { tabId: null, url: null, startTime: null }
    return
  }
  const now = Date.now()
  activeTabInfo = { tabId, url: tab.url, startTime: now }
  await ensureY2kRecordExists(tab)
}

async function updateY2kStats(
  senderUrl: string,
  data: Y2kUpdateStatsData,
  tab?: { title?: string; favIconUrl?: string }
) {
  if (!senderUrl || isBrowsingRestrictedUrl(senderUrl)) return
  const res = await chrome.storage.local.get({ y2kBrowsingData: [] as Y2kBrowsingRecord[] })
  const list = res.y2kBrowsingData || []
  const today = new Date().toDateString()
  const targetUrl = getCleanUrl(senderUrl)
  let found = false
  for (const r of list) {
    if (getCleanUrl(r.url) === targetUrl && new Date(r.visitTime).toDateString() === today) {
      r.clicks = (r.clicks || 0) + (data.clicks || 0)
      r.scrollDistance = (r.scrollDistance || 0) + (data.scrollDistance || 0)
      r.charsTyped = (r.charsTyped || 0) + (data.charsTyped || 0)
      r.activeDuration = (r.activeDuration || 0) + (data.activeDuration || 0)
      if (tab?.title) r.title = tab.title
      if (tab?.favIconUrl) r.icon = tab.favIconUrl
      found = true
      break
    }
  }
  if (!found) {
    list.push({
      url: senderUrl,
      title: tab?.title || '',
      icon: tab?.favIconUrl || '',
      visitTime: Date.now(),
      activeDuration: data.activeDuration || 0,
      clicks: data.clicks || 0,
      scrollDistance: data.scrollDistance || 0,
      charsTyped: data.charsTyped || 0,
    })
  }
  await chrome.storage.local.set({ y2kBrowsingData: list })
}
const RITUAL_ALARM_NAME = 'y2kRitual'
const RITUAL_DATES_MAX = 365

function parseRitualTime(timeStr: string): { h: number; m: number } | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

async function scheduleRitualAlarm() {
  await chrome.alarms.clear(RITUAL_ALARM_NAME)
  const data = await chrome.storage.local.get({ y2kRitualEnabled: false, y2kRitualTime: '18:00' })
  if (!data.y2kRitualEnabled) return
  const parsed = parseRitualTime(data.y2kRitualTime)
  if (!parsed) return
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parsed.h, parsed.m, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  chrome.alarms.create(RITUAL_ALARM_NAME, {
    when: next.getTime(),
    periodInMinutes: 24 * 60,
  })
}

/** 今日单条访问（时间轴/关键词用，含停留时长） */
interface Y2kRitualTimelineItem {
  visitTime: number
  title: string
  url: string
  domain: string
  /** 该页今日可见停留秒数 */
  duration: number
}

/** 今日数据汇总，用于在当前页展示归航时刻 */
interface Y2kTodaySummary {
  clicks: number
  scroll: number
  duration: number
  chars: number
  timeline: Y2kRitualTimelineItem[]
}

function getDomainFromUrl(u: string): string {
  try {
    return new URL(u).hostname
  } catch {
    return u
  }
}

async function getY2kTodaySummary(): Promise<Y2kTodaySummary> {
  const res = await chrome.storage.local.get({ y2kBrowsingData: [] as Y2kBrowsingRecord[] })
  const today = new Date().toDateString()
  const list = (res.y2kBrowsingData || []).filter(
    (r: Y2kBrowsingRecord) => new Date(r.visitTime).toDateString() === today
  )
  const timeline: Y2kRitualTimelineItem[] = list
    .sort((a, b) => b.visitTime - a.visitTime)
    .slice(0, 20)
    .map((r) => ({
      visitTime: r.visitTime,
      title: r.title || r.url || '',
      url: r.url,
      domain: getDomainFromUrl(r.url),
      duration: r.activeDuration ?? 0,
    }))
  return {
    clicks: list.reduce((s, r) => s + (r.clicks ?? 0), 0),
    scroll: list.reduce((s, r) => s + (r.scrollDistance ?? 0), 0),
    duration: list.reduce((s, r) => s + (r.activeDuration ?? 0), 0),
    chars: list.reduce((s, r) => s + (r.charsTyped ?? 0), 0),
    timeline,
  }
}

// 测试到点触发：在 popup 开启「归航提醒」并把时间设为 1～2 分钟后，保存，保持当前页在普通网页等待即可。
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== RITUAL_ALARM_NAME) return
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({
    y2kRitualDates: [] as string[],
    locale: 'en',
  })
  let dates = res.y2kRitualDates || []
  if (!dates.includes(today)) {
    dates.push(today)
    if (dates.length > RITUAL_DATES_MAX) dates = dates.slice(-RITUAL_DATES_MAX)
    await chrome.storage.local.set({ y2kRitualDates: dates })
  }
  const summary = await getY2kTodaySummary()
  const locale = res.locale === 'zh-CN' ? 'zh-CN' : 'en'
  // 与「预览归航时刻」一致：在当前页展示动画 + 归航浮层，不打开 newtab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (tab?.id && tab.url && !isRestrictedURL(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { type: 'Y2K_SHOW_RITUAL', data: { ...summary, locale } }).catch(() => {})
    }
  })
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_theme') {
    chrome.tabs.create({ url: getNewtabUrl() })
  }
})

function isRestrictedURL(url: string | undefined): boolean {
  if (!url) return true
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore')
  )
}

async function injectRetro(tabId: number, url: string): Promise<void> {
  if (!tabId || isRestrictedURL(url)) return

  try {
    const data = await chrome.storage.local.get('crtEnabled')
    const crtEnabled = data.crtEnabled !== false

    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: false },
      files: [RETRO_CSS_FILE],
    })

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (crtEnabled: boolean) => {
        const elementsToRemove = ['y2k-under-construction', 'y2k-marquee-bar']
        elementsToRemove.forEach((id) => {
          const el = document.getElementById(id)
          if (el) el.remove()
        })

        document.documentElement.classList.add('y2k-mode-active')

        if (crtEnabled) {
          document.documentElement.classList.add('y2k-crt-active')
        } else {
          document.documentElement.classList.remove('y2k-crt-active')
        }

        const widget = document.createElement('div')
        widget.id = 'y2k-under-construction'
        document.documentElement.appendChild(widget)

        if (crtEnabled) {
          const marquee = document.createElement('div')
          marquee.id = 'y2k-marquee-bar'
          marquee.innerHTML = `
            <div class="y2k-marquee-content">
              *** WELCOME TO THE WORLD WIDE WEB! *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 OR INTERNET EXPLORER 5.0 *** 
              OPTIMIZED FOR 800x600 RESOLUTION *** CLICK HERE TO SIGN MY GUESTBOOK! *** 
              LOADING... PLEASE WAIT... *** YOU ARE VISITOR #00042069 *** 
              STAY RETRO, STAY Y2K! ***
            </div>
          `
          document.documentElement.appendChild(marquee)
        }
      },
      args: [crtEnabled],
    })
    console.log(`Y2K effects injected into: ${tabId}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('No tab with id')) {
      console.warn(`Injection failed: ${message}`)
    }
  }
}

async function removeRetro(tabId: number, url: string): Promise<void> {
  if (!tabId || isRestrictedURL(url)) return
  try {
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: false },
      files: [RETRO_CSS_FILE],
    })
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const ids = ['y2k-under-construction', 'y2k-marquee-bar']
        ids.forEach((id) => {
          const el = document.getElementById(id)
          if (el) el.remove()
        })
        document.documentElement.classList.remove('y2k-mode-active', 'y2k-crt-active')
        ;(document.documentElement as HTMLElement).style.marginTop = ''
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message?.includes('No tab with id')) {
      console.warn('Y2K removeRetro failed:', message)
    }
  }
}

async function updateCRT(tabId: number, url: string, crtEnabled: boolean): Promise<void> {
  if (!tabId || isRestrictedURL(url)) return
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (enabled: boolean) => {
        if (enabled) {
          document.documentElement.classList.add('y2k-crt-active')
          if (!document.getElementById('y2k-marquee-bar')) {
            const marquee = document.createElement('div')
            marquee.id = 'y2k-marquee-bar'
            marquee.innerHTML = `
              <div class="y2k-marquee-content">
                *** WELCOME TO THE WORLD WIDE WEB! *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 OR INTERNET EXPLORER 5.0 *** 
                OPTIMIZED FOR 800x600 RESOLUTION *** CLICK HERE TO SIGN MY GUESTBOOK! *** 
                LOADING... PLEASE WAIT... *** YOU ARE VISITOR #00042069 *** 
                STAY RETRO, STAY Y2K! ***
              </div>
            `
            document.documentElement.appendChild(marquee)
          }
        } else {
          document.documentElement.classList.remove('y2k-crt-active')
          const marquee = document.getElementById('y2k-marquee-bar')
          if (marquee) marquee.remove()
        }
      },
      args: [crtEnabled],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('No tab with id')) {
      console.warn(`CRT update failed: ${message}`)
    }
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.y2kRitualEnabled || changes.y2kRitualTime) {
      scheduleRitualAlarm()
    }
    if (changes.isEnabled) {
      const isEnabled = changes.isEnabled.newValue
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && tab.url) {
            if (isEnabled) injectRetro(tab.id, tab.url)
            else removeRetro(tab.id, tab.url)
          }
        })
      })
    }
    if (changes.crtEnabled) {
      const crtEnabled = changes.crtEnabled.newValue
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.storage.local.get('isEnabled', (data) => {
            if (data.isEnabled !== false && tab.id && tab.url) {
              updateCRT(tab.id, tab.url, crtEnabled !== false)
            }
          })
        })
      })
    }
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  handleBrowsingTabChange(activeInfo.tabId)
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopBrowsingTracking()
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs[0]?.id) handleBrowsingTabChange(tabs[0].id)
    })
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    handleBrowsingTabChange(tabId)
  }
  // 仅在页面加载完成时注入复古样式，避免重复注入或 DOM 未就绪
  if (changeInfo.status !== 'complete' || !tab.url || isRestrictedURL(tab.url)) return
  chrome.storage.local.get(['isEnabled', 'crtEnabled'], (data) => {
    if (data.isEnabled !== false) {
      injectRetro(tabId, tab.url!)
    }
  })
})

chrome.runtime.onMessage.addListener((message: { action?: string; type?: string; state?: boolean; data?: Y2kUpdateStatsData }, sender, sendResponse) => {
  if (message.type === 'Y2K_UPDATE_STATS' && message.data && sender.tab?.url) {
    updateY2kStats(sender.tab.url, message.data, sender.tab).then(() => sendResponse?.()).catch(() => {})
    return true
  }
  if (message.action === 'toggleCRT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id && tabs[0].url) {
        chrome.storage.local.get('isEnabled', (data) => {
          if (data.isEnabled !== false) {
            updateCRT(tabs[0].id!, tabs[0].url!, message.state ?? true)
          }
        })
      }
    })
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled', 'crtEnabled'], (res) => {
    const defaults: Record<string, unknown> = {}
    if (res.isEnabled === undefined) defaults.isEnabled = true
    if (res.crtEnabled === undefined) defaults.crtEnabled = true
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults)
    }
  })
  scheduleRitualAlarm()
})
