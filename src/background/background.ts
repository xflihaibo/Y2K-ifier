/**
 * Y2K-ifier Background Service Worker
 */

import { getNewtabUrl } from '@/constants'

const RETRO_CSS_FILE = 'styles/retro.css'

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 仅在页面加载完成时注入，避免重复注入或 DOM 未就绪
  if (changeInfo.status !== 'complete' || !tab.url || isRestrictedURL(tab.url)) return
  chrome.storage.local.get(['isEnabled', 'crtEnabled'], (data) => {
    if (data.isEnabled !== false) {
      injectRetro(tabId, tab.url!)
    }
  })
})

chrome.runtime.onMessage.addListener((message: { action: string; state?: boolean }) => {
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
    const defaults: Record<string, boolean> = {}
    if (res.isEnabled === undefined) defaults.isEnabled = true
    if (res.crtEnabled === undefined) defaults.crtEnabled = true
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults)
    }
  })
})
