<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStoredLocale, setStoredLocale, type LocaleId } from '@/i18n'
import { getNewtabUrl } from '@/constants'

const { t, locale } = useI18n()

const Y2K_ACTIVE_DAYS_MAX = 365
const MILESTONE_LEVELS: { minDays: number; maxDays: number; labelIndex: number }[] = [
  { minDays: 7, maxDays: 13, labelIndex: 0 },
  { minDays: 14, maxDays: 29, labelIndex: 1 },
  { minDays: 30, maxDays: 59, labelIndex: 2 },
  { minDays: 60, maxDays: 99, labelIndex: 3 },
  { minDays: 100, maxDays: 364, labelIndex: 4 },
  { minDays: 365, maxDays: 9999, labelIndex: 5 },
]

const retroEnabled = ref(true)
const crtEnabled = ref(true)
const companionDays = ref(0)
const currentMilestoneLabel = ref<string | null>(null)
const showMorningGreeting = ref(false)
const ritualEnabled = ref(false)
const ritualTime = ref('18:00')
const todayClicks = ref(0)
const todayScroll = ref(0)
const todayDuration = ref(0)
const todayChars = ref(0)
interface BrowsingRecord {
  url: string
  title?: string
  icon?: string
  visitTime: number
  activeDuration?: number
  clicks?: number
  scrollDistance?: number
  charsTyped?: number
}
const todayHistory = ref<BrowsingRecord[]>([])
const todayHistoryLoading = ref(false)

interface ClipboardItem {
  text: string
  timestamp: number
}
const clipboardEnabled = ref(true)
const clipboardList = ref<ClipboardItem[]>([])

const retroStateText = computed(() => (retroEnabled.value ? t('common.on') : t('common.off')))
const crtStateText = computed(() => (crtEnabled.value ? t('common.on') : t('common.off')))

const AGENT_PRESET_KEYS = [
  'agent.preset1', 'agent.preset2', 'agent.preset3', 'agent.preset4', 'agent.preset5',
  'agent.preset6', 'agent.preset7', 'agent.preset8', 'agent.preset9', 'agent.preset10',
  'agent.preset11', 'agent.preset12', 'agent.preset13', 'agent.preset14', 'agent.preset15',
  'agent.preset16', 'agent.preset17', 'agent.preset18', 'agent.preset19', 'agent.preset20',
  'agent.preset21', 'agent.preset22', 'agent.preset23', 'agent.preset24', 'agent.preset25',
  'agent.preset26', 'agent.preset27', 'agent.preset28', 'agent.preset29', 'agent.preset30',
  'agent.preset31', 'agent.preset32', 'agent.preset33', 'agent.preset34', 'agent.preset35',
  'agent.preset36', 'agent.preset37', 'agent.preset38', 'agent.preset39', 'agent.preset40',
  'agent.preset41', 'agent.preset42', 'agent.preset43', 'agent.preset44', 'agent.preset45',
  'agent.preset46', 'agent.preset47', 'agent.preset48', 'agent.preset49', 'agent.preset50',
] as const
const agentBubbleText = ref('')
const showAgentAvatar = ref(true)
function sayRandom() {
  const key = AGENT_PRESET_KEYS[Math.floor(Math.random() * AGENT_PRESET_KEYS.length)]
  agentBubbleText.value = t(key)
}
async function hideAgentAvatar() {
  showAgentAvatar.value = false
  await chrome.storage.local.set({ y2kAgentAvatarVisible: false })
}
function showAgentAvatarFromCompanion() {
  showAgentAvatar.value = true
  chrome.storage.local.set({ y2kAgentAvatarVisible: true })
}

async function ensureY2kActiveDay() {
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({ y2kActiveDays: [] as string[] })
  let days = res.y2kActiveDays || []
  if (days.includes(today)) return
  days.push(today)
  if (days.length > Y2K_ACTIVE_DAYS_MAX) days = days.slice(-Y2K_ACTIVE_DAYS_MAX)
  await chrome.storage.local.set({ y2kActiveDays: days })
}

function getMilestoneLabel(days: number): string | null {
  const labels = t('popup.milestones')
  if (typeof labels !== 'string' && Array.isArray(labels)) {
    for (const m of MILESTONE_LEVELS) {
      if (days >= m.minDays && days <= m.maxDays) return labels[m.labelIndex] ?? null
    }
  }
  return null
}

async function loadCompanionDays() {
  const res = await chrome.storage.local.get({ y2kActiveDays: [] as string[] })
  const days = (res.y2kActiveDays || []).length
  companionDays.value = days
  currentMilestoneLabel.value = getMilestoneLabel(days)
}

async function loadMorningGreeting() {
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({ y2kGreetingClosedDate: null as string | null })
  showMorningGreeting.value = res.y2kGreetingClosedDate !== today
}

async function loadRitualData() {
  const res = await chrome.storage.local.get(['y2kRitualEnabled', 'y2kRitualTime'])
  ritualEnabled.value = res.y2kRitualEnabled === true
  ritualTime.value = res.y2kRitualTime || '18:00'
  if (!('y2kRitualEnabled' in res)) {
    await chrome.storage.local.set({ y2kRitualEnabled: false })
  }
}

function formatScroll(px: number): string {
  if (px < 1000) return `${px} ${t('popup.scrollUnitPx')}`
  const meters = (px / 1000).toFixed(1)
  return `${meters} ${t('popup.scrollUnitM')}`
}

async function saveRitualSettings() {
  await chrome.storage.local.set({
    y2kRitualEnabled: ritualEnabled.value,
    y2kRitualTime: ritualTime.value,
  })
}

function previewRitual() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (!tab?.id || !tab.url) return
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      return
    }
    const timeline = todayHistory.value.map((r) => ({
      visitTime: r.visitTime,
      title: r.title || r.url || '',
      url: r.url,
      domain: getDomain(r.url),
    }))
    chrome.tabs.sendMessage(tab.id, {
      type: 'Y2K_SHOW_RITUAL',
      data: {
        clicks: todayClicks.value,
        scroll: todayScroll.value,
        duration: todayDuration.value,
        chars: todayChars.value,
        locale: (locale?.value ?? (typeof locale === 'string' ? locale : undefined)) ?? 'en',
        timeline,
      },
    }).catch(() => {})
  })
}

function getDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname
  } catch {
    return urlStr
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m${s}s` : `${m}m`
}

async function loadTodayHistory() {
  todayHistoryLoading.value = true
  try {
    const res = await chrome.storage.local.get({ y2kBrowsingData: [] as BrowsingRecord[] })
    const today = new Date().toDateString()
    const raw = (res.y2kBrowsingData || []) as BrowsingRecord[]
    const list = raw
      .filter((r) => new Date(r.visitTime).toDateString() === today)
      .sort((a, b) => b.visitTime - a.visitTime)
      .slice(0, 30)
    todayHistory.value = list
    todayClicks.value = list.reduce((s, r) => s + (r.clicks ?? 0), 0)
    todayScroll.value = list.reduce((s, r) => s + (r.scrollDistance ?? 0), 0)
    todayDuration.value = list.reduce((s, r) => s + (r.activeDuration ?? 0), 0)
    todayChars.value = list.reduce((s, r) => s + (r.charsTyped ?? 0), 0)
  } catch {
    todayHistory.value = []
    todayClicks.value = 0
    todayScroll.value = 0
    todayDuration.value = 0
    todayChars.value = 0
  } finally {
    todayHistoryLoading.value = false
  }
}

function openHistoryUrl(url: string) {
  chrome.tabs.create({ url }).catch(() => {})
}

async function dismissMorningGreeting() {
  const today = new Date().toDateString()
  await chrome.storage.local.set({ y2kGreetingClosedDate: today })
  showMorningGreeting.value = false
}

onMounted(async () => {
  const data = await chrome.storage.local.get(['isEnabled', 'crtEnabled', 'y2kAgentAvatarVisible'])
  retroEnabled.value = data.isEnabled !== false
  crtEnabled.value = data.crtEnabled !== false
  if (data.crtEnabled === undefined) {
    await chrome.storage.local.set({ crtEnabled: true })
  }
  showAgentAvatar.value = data.y2kAgentAvatarVisible !== false
  const stored = await getStoredLocale()
  locale.value = stored
  await ensureY2kActiveDay()
  await loadCompanionDays()
  await loadMorningGreeting()
  await loadRitualData()
  await loadTodayHistory()
  await loadClipboard()
})

async function loadClipboard() {
  const res = await chrome.storage.local.get({
    y2kClipboardEnabled: true,
    y2kClipboardHistory: [] as ClipboardItem[],
  })
  clipboardEnabled.value = res.y2kClipboardEnabled !== false
  clipboardList.value = res.y2kClipboardHistory || []
}

async function setClipboardEnabled(v: boolean) {
  await chrome.storage.local.set({ y2kClipboardEnabled: v })
  if (!v) clipboardList.value = []
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback for older env
  }
}

async function deleteClipboardItem(index: number) {
  const list = clipboardList.value.filter((_, i) => i !== index)
  await chrome.storage.local.set({ y2kClipboardHistory: list })
  clipboardList.value = list
}

async function clearClipboard() {
  await chrome.storage.local.set({ y2kClipboardHistory: [] })
  clipboardList.value = []
}

function clipLabel(text: string, maxLen = 36) {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…'
}

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
      <div v-if="showMorningGreeting" class="greeting-bar">
        <span class="greeting-text">{{ t('popup.greetingMorning') }}</span>
        <button type="button" class="greeting-close" :aria-label="t('popup.greetingClose')" @click="dismissMorningGreeting">×</button>
      </div>
      <div class="companion-row">
        <span
          class="companion-days companion-days--clickable"
          :title="t('popup.companionClickHint')"
          @click="showAgentAvatarFromCompanion"
        >{{ t('popup.companionSummaryBefore') }}{{ companionDays }}{{ t('popup.companionSummaryAfter') }}</span>
        <span v-if="currentMilestoneLabel" class="milestone-badge">{{ currentMilestoneLabel }}</span>
      </div>
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
      <div class="ritual-section">
        <div class="ritual-title">{{ t('popup.ritualTitle') }}</div>
        <div class="control-group ritual-row">
          <input
            id="ritualToggle"
            v-model="ritualEnabled"
            type="checkbox"
            @change="saveRitualSettings"
          >
          <label for="ritualToggle">{{ t('popup.ritualEnable') }}</label>
        </div>
        <div class="control-group ritual-time-row">
          <label for="ritualTime" class="ritual-time-label">{{ t('popup.ritualTimeLabel') }}:</label>
        </div>
        <button type="button" class="link-btn ritual-preview-btn" @click="previewRitual">
          {{ t('popup.ritualPreview') }}
        </button>
        <div class="ritual-data">
          <div class="ritual-data-title">{{ t('popup.ritualDataTitle') }}</div>
          <div class="ritual-stats">
            <div class="ritual-stat-cell">
              <span class="ritual-stat-label">{{ t('popup.todayClicks') }}</span>
              <span class="ritual-stat-value">{{ todayClicks }}</span>
            </div>
            <div class="ritual-stat-cell">
              <span class="ritual-stat-label">{{ t('popup.todayScroll') }}</span>
              <span class="ritual-stat-value">{{ formatScroll(todayScroll) }}</span>
            </div>
            <div class="ritual-stat-cell">
              <span class="ritual-stat-label">{{ t('popup.todayDuration') }}</span>
              <span class="ritual-stat-value">{{ formatDuration(todayDuration) }}</span>
            </div>
            <div class="ritual-stat-cell">
              <span class="ritual-stat-label">{{ t('popup.todayChars') }}</span>
              <span class="ritual-stat-value">{{ todayChars }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="clipboard-section">
        <div class="clipboard-header">
          <span class="clipboard-title">{{ t('popup.clipboardTitle') }} ({{ clipboardList.length }}/10)</span>
          <button v-if="clipboardList.length > 0" type="button" class="clipboard-clear-btn" @click="clearClipboard">{{ t('popup.clipboardClear') }}</button>
        </div>
        <div class="control-group clipboard-row">
          <input id="clipboardToggle" v-model="clipboardEnabled" type="checkbox" @change="setClipboardEnabled(clipboardEnabled)">
          <label for="clipboardToggle">{{ clipboardEnabled ? t('popup.clipboardTitle') : t('popup.clipboardDisabled') }}</label>
        </div>
        <div v-if="!clipboardEnabled" class="clipboard-empty">{{ t('popup.clipboardDisabled') }}</div>
        <div v-else-if="clipboardList.length === 0" class="clipboard-empty">{{ t('popup.clipboardEmpty') }}</div>
        <div v-else class="clipboard-list">
          <div v-for="(item, index) in clipboardList" :key="item.timestamp + index" class="clipboard-item">
            <span class="clipboard-text" :title="item.text">{{ clipLabel(item.text) }}</span>
            <div class="clipboard-actions">
              <button type="button" class="clipboard-btn" :title="t('popup.clipboardCopy')" @click="copyToClipboard(item.text)">📋</button>
              <button type="button" class="clipboard-btn" :title="t('popup.clipboardDelete')" @click="deleteClipboardItem(index)">×</button>
            </div>
          </div>
        </div>
      </div>
      <div class="today-history-section">
        <div class="today-history-title">{{ t('popup.todayHistoryTitle') }} <span class="today-history-count">({{ todayHistoryLoading ? '…' : todayHistory.length }})</span></div>
        <div v-if="todayHistoryLoading" class="today-history-loading">{{ t('popup.ritualNone') }}</div>
        <div v-else-if="todayHistory.length === 0" class="today-history-empty">{{ t('popup.todayHistoryEmpty') }}</div>
        <div v-else class="today-history-list">
          <button
            v-for="item in todayHistory"
            :key="item.url + item.visitTime"
            type="button"
            class="today-history-item"
            :title="item.url"
            @click="openHistoryUrl(item.url)"
          >
            <span class="today-history-label">{{ item.title || getDomain(item.url) }}</span>
            <span v-if="(item.activeDuration ?? 0) > 0 || (item.clicks ?? 0) > 0" class="today-history-meta">
              {{ formatDuration(item.activeDuration ?? 0) }}<template v-if="(item.clicks ?? 0) > 0"> · {{ item.clicks }}{{ t('popup.todayHistoryClicks') }}</template>
            </span>
          </button>
        </div>
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
      <div v-if="showAgentAvatar" class="popup-agent-float">
        <div v-if="agentBubbleText" class="popup-agent-bubble">
          <span class="popup-agent-bubble-text">{{ agentBubbleText }}</span>
          <div class="popup-agent-bubble-tail" />
        </div>
        <div class="popup-agent-avatar-wrap">
          <button
            type="button"
            class="popup-agent-avatar-close"
            :aria-label="t('popup.greetingClose')"
            @click="hideAgentAvatar"
          >×</button>
          <button
            type="button"
            class="popup-agent-avatar-btn"
            :aria-label="t('agent.sayAgain')"
            @click="sayRandom"
          >
            <span class="popup-agent-face">
              <span class="popup-agent-eye left" />
              <span class="popup-agent-eye right" />
              <span class="popup-agent-mouth" />
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-group--theme {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  margin-bottom: 10px;
}
.control-group--theme .link-btn {
  width: 100%;
  display: block;
}
.shortcut-hint {
  font-size: 9px;
  color: #666;
  text-align: center;
  line-height: 1.25;
  word-wrap: break-word;
}
.lang-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.lang-label {
  font-size: 11px;
  color: #333;
}
.lang-btn {
  height: 18px;
  padding: 0 6px;
  font-size: 10px;
  line-height: 18px;
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
