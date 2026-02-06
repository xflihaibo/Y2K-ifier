<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStoredLocale, setStoredLocale, type LocaleId } from '@/i18n'
import { getNewtabUrl } from '@/constants'

const { t, locale } = useI18n()

const retroEnabled = ref(true)
const crtEnabled = ref(true)
const screenshotStatus = ref<'idle' | 'saving' | 'ok' | 'error'>('idle')

const retroStateText = computed(() => (retroEnabled.value ? t('common.on') : t('common.off')))
const crtStateText = computed(() => (crtEnabled.value ? t('common.on') : t('common.off')))

onMounted(async () => {
  const data = await chrome.storage.local.get(['isEnabled', 'crtEnabled'])
  retroEnabled.value = data.isEnabled !== false
  crtEnabled.value = data.crtEnabled !== false
  if (data.crtEnabled === undefined) {
    await chrome.storage.local.set({ crtEnabled: true })
  }
  const stored = await getStoredLocale()
  locale.value = stored
})

async function onRetroChange() {
  await chrome.storage.local.set({ isEnabled: retroEnabled.value })
  chrome.runtime.sendMessage({ action: 'toggleRetro', state: retroEnabled.value })
}

async function onCrtChange() {
  await chrome.storage.local.set({ crtEnabled: crtEnabled.value })
  chrome.runtime.sendMessage({ action: 'toggleCRT', state: crtEnabled.value })
}

function openThemePage() {
  chrome.tabs.create({ url: getNewtabUrl() }).catch(() => {
    // 权限或环境异常时静默失败，用户可重试
  })
}

async function setLocale(id: LocaleId) {
  await setStoredLocale(id)
}

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore')
  )
}

function addRetroFrame(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const pad = 12
      const w = img.width + pad * 2
      const h = img.height + pad * 2
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.fillStyle = '#c0c0c0'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#808080'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, w - 2, h - 2)
      ctx.strokeStyle = '#ffffff'
      ctx.strokeRect(4, 4, w - 8, h - 8)
      ctx.drawImage(img, pad, pad, img.width, img.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function saveRetroScreenshot() {
  screenshotStatus.value = 'saving'
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !tab.url) {
      screenshotStatus.value = 'error'
      return
    }
    if (isRestrictedUrl(tab.url)) {
      screenshotStatus.value = 'error'
      return
    }
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId ?? undefined, { format: 'png' })
    const withFrame = await addRetroFrame(dataUrl)
    const filename = `y2k-screenshot-${Date.now()}.png`
    await chrome.downloads.download({ url: withFrame, filename, saveAs: true })
    screenshotStatus.value = 'ok'
  } catch {
    screenshotStatus.value = 'error'
  }
  setTimeout(() => { screenshotStatus.value = 'idle' }, 2000)
}
</script>

<template>
  <div class="window">
    <div class="title-bar">
      <div class="title-bar-text">{{ t('popup.title') }}</div>
    </div>
    <div class="content">
      <div class="control-group">
        <input
          id="retroToggle"
          v-model="retroEnabled"
          type="checkbox"
          :aria-label="t('popup.ariaRetroToggle')"
          @change="onRetroChange"
        >
        <label for="retroToggle">{{ t('popup.retroMode') }}</label>
        <span class="toggle-state" aria-live="polite">{{ retroStateText }}</span>
      </div>
      <div class="control-group">
        <input
          id="crtToggle"
          v-model="crtEnabled"
          type="checkbox"
          :aria-label="t('popup.ariaCrtToggle')"
          @change="onCrtChange"
        >
        <label for="crtToggle">{{ t('popup.crtScanlines') }}</label>
        <span class="toggle-state" aria-live="polite">{{ crtStateText }}</span>
      </div>
      <div class="control-group control-group--theme">
        <button type="button" class="link-btn" @click="openThemePage">
          {{ t('popup.openThemePage') }}
        </button>
        <span class="shortcut-hint">{{ t('popup.openThemeShortcut') }}</span>
      </div>
      <div class="control-group">
        <button
          type="button"
          class="link-btn"
          :disabled="screenshotStatus === 'saving'"
          @click="saveRetroScreenshot"
        >
          {{ screenshotStatus === 'saving' ? '…' : t('popup.saveRetroScreenshot') }}
        </button>
        <span v-if="screenshotStatus === 'ok'" class="screenshot-status status-ok">{{ t('popup.screenshotSuccess') }}</span>
        <span v-if="screenshotStatus === 'error'" class="screenshot-status status-err">{{ t('popup.screenshotError') }}</span>
      </div>
      <div class="lang-row">
        <span class="lang-label">{{ t('settings.language') }}:</span>
        <button type="button" class="lang-btn" :class="{ active: locale === 'en' }" @click="setLocale('en')">
          English
        </button>
        <button type="button" class="lang-btn" :class="{ active: locale === 'zh-CN' }" @click="setLocale('zh-CN')">
          中文
        </button>
      </div>
      <div class="footer">
        {{ t('popup.footer') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-group--theme {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}
.control-group--theme .link-btn {
  width: 100%;
  display: block;
}
.shortcut-hint {
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 1.3;
}
.screenshot-status {
  font-size: 11px;
  margin-left: 4px;
}
.status-ok { color: #006400; }
.status-err { color: #8b0000; }
.lang-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.lang-label {
  font-size: 12px;
  color: #333;
}
.lang-btn {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  line-height: 22px;
  background: #e0e0e0;
  border: 1px solid #808080;
  cursor: pointer;
  box-sizing: border-box;
}
.lang-btn.active {
  background: #c0c0c0;
  font-weight: bold;
}
</style>
