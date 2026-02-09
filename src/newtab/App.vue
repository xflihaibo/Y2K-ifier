<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStoredLocale } from '@/i18n'
import NostalgicAgent from './components/NostalgicAgent.vue'

const { t, locale } = useI18n()

const SEARCH_ENGINES = [
  { id: 'google' as const },
  { id: 'bing' as const },
  { id: 'baidu' as const },
]

const urls: Record<string, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  baidu: 'https://www.baidu.com/s?wd=',
}

const query = ref('')
const selectedId = ref('google')
const showRitualBanner = ref(false)
const blissBg = `url(${chrome.runtime.getURL('images/xp.jpeg')})`

const searchUrl = computed(() => urls[selectedId.value] ?? urls.google)

async function ensureY2kActiveDay() {
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({ y2kActiveDays: [] as string[] })
  let days = res.y2kActiveDays || []
  if (days.includes(today)) return
  days.push(today)
  if (days.length > 365) days = days.slice(-365)
  await chrome.storage.local.set({ y2kActiveDays: days })
}

onMounted(async () => {
  showRitualBanner.value = typeof window !== 'undefined' && window.location.search.includes('ritual=1')
  const data = await chrome.storage.local.get('optionsSearchEngine')
  if (data.optionsSearchEngine && SEARCH_ENGINES.some((e) => e.id === data.optionsSearchEngine)) {
    selectedId.value = data.optionsSearchEngine
  }
  const stored = await getStoredLocale()
  locale.value = stored
  await ensureY2kActiveDay()
})

async function onEngineChange() {
  await chrome.storage.local.set({ optionsSearchEngine: selectedId.value })
}

function doSearch() {
  const q = query.value?.trim()
  if (!q) return
  const url = searchUrl.value + encodeURIComponent(q)
  chrome.tabs.create({ url })
  query.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') doSearch()
}
</script>

<template>
  <div class="xp-theme" :style="{ backgroundImage: blissBg }">
    <div v-if="showRitualBanner" class="ritual-banner">
      <span class="ritual-banner-text">{{ t('ritual.message') }}</span>
    </div>
    <div class="search-wrap">
      <div class="search-row">
        <select
          v-model="selectedId"
          class="engine-select"
          :aria-label="t('search.ariaEngine')"
          @change="onEngineChange"
        >
          <option v-for="e in SEARCH_ENGINES" :key="e.id" :value="e.id">
            {{ t(`searchEngines.${e.id}`) }}
          </option>
        </select>
        <input
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="t('search.placeholder')"
          autocomplete="off"
          @keydown="onKeydown"
        >
        <button type="button" class="search-btn" @click="doSearch">
          {{ t('search.button') }}
        </button>
      </div>
    </div>
    <NostalgicAgent />
  </div>
</template>

<style scoped>
.xp-theme {
  position: fixed;
  inset: 0;
  background-color: #7cb3e9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 18vh;
}

.search-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-row {
  display: flex;
  align-items: stretch;
  width: 640px;
  max-width: 92vw;
  background: rgba(255, 255, 255, 0.96);
  border: 2px solid #0054e3;
  border-radius: 0;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.15);
  font-family: "Segoe UI", Tahoma, "Microsoft Sans Serif", sans-serif;
  overflow: hidden;
}

.engine-select {
  width: 110px;
  flex-shrink: 0;
  padding: 10px 10px 10px 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-right: 1px solid #c0c0c0;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}

.engine-select:hover {
  background-color: #eee;
}

.engine-select:focus {
  background-color: #f9f9f9;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  font-size: 16px;
  border: none;
  outline: none;
  background: transparent;
}

.search-input::placeholder {
  color: #888;
}

.search-btn {
  padding: 10px 30px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(180deg, #3a7bd5 0%, #0054e3 100%);
  border: 1px solid #0047c4;
  border-left: 1px solid #0054e3;
  cursor: pointer;
}

.search-btn:hover {
  background: linear-gradient(180deg, #4a8be5 0%, #1064f3 100%);
}

.search-btn:active {
  background: #0047c4;
}

.ritual-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 12px 20px;
  background-color: #c0c0c0;
  border-bottom: 2px solid #808080;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #808080;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-family: "MS Sans Serif", Arial, sans-serif;
  font-size: 14px;
  color: #000;
  text-align: center;
}

.ritual-banner-text {
  display: block;
}
</style>
