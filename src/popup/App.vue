<script setup lang="ts">
import { ref, onMounted } from 'vue'

const retroEnabled = ref(true)
const crtEnabled = ref(true)
const retroStateText = ref('开')
const crtStateText = ref('开')

function setToggleState(checked: boolean): string {
  return checked ? '开' : '关'
}

onMounted(async () => {
  const data = await chrome.storage.local.get(['isEnabled', 'crtEnabled'])
  retroEnabled.value = data.isEnabled !== false
  crtEnabled.value = data.crtEnabled !== false
  if (data.crtEnabled === undefined) {
    await chrome.storage.local.set({ crtEnabled: true })
  }
  retroStateText.value = setToggleState(retroEnabled.value)
  crtStateText.value = setToggleState(crtEnabled.value)
})

async function onRetroChange() {
  retroStateText.value = setToggleState(retroEnabled.value)
  await chrome.storage.local.set({ isEnabled: retroEnabled.value })
  chrome.runtime.sendMessage({ action: 'toggleRetro', state: retroEnabled.value })
}

async function onCrtChange() {
  crtStateText.value = setToggleState(crtEnabled.value)
  await chrome.storage.local.set({ crtEnabled: crtEnabled.value })
  chrome.runtime.sendMessage({ action: 'toggleCRT', state: crtEnabled.value })
}

function openThemePage() {
  chrome.runtime.openOptionsPage()
}
</script>

<template>
  <div class="window">
    <div class="title-bar">
      <div class="title-bar-text">Y2K-ifier.exe</div>
    </div>
    <div class="content">
      <div class="control-group">
        <input
          id="retroToggle"
          v-model="retroEnabled"
          type="checkbox"
          aria-label="复古模式开关"
          @change="onRetroChange"
        >
        <label for="retroToggle">复古模式</label>
        <span class="toggle-state" aria-live="polite">{{ retroStateText }}</span>
      </div>
      <div class="control-group">
        <input
          id="crtToggle"
          v-model="crtEnabled"
          type="checkbox"
          aria-label="CRT 效果开关"
          @change="onCrtChange"
        >
        <label for="crtToggle">CRT 扫描线</label>
        <span class="toggle-state" aria-live="polite">{{ crtStateText }}</span>
      </div>
      <div class="control-group">
        <button type="button" class="link-btn" @click="openThemePage">
          打开主题页 (XP 壁纸 + 搜索)
        </button>
      </div>
      <div class="footer">
        Version 1.0 (C) 2026 RetroSoft
      </div>
    </div>
  </div>
</template>
