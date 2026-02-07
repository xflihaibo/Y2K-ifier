<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStoredLocale, setStoredLocale, type LocaleId } from '@/i18n'
import { getNewtabUrl } from '@/constants'

const { t, locale } = useI18n()

const retroEnabled = ref(true)
const crtEnabled = ref(true)

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
