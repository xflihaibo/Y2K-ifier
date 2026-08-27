<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const PRESET_KEYS = [
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

const currentMessageKey = ref<string>(PRESET_KEYS[0])
const randomBookmark = ref<{ title: string; url: string } | null>(null)
const bubbleKey = ref(0)

function sayRandom() {
  const others = PRESET_KEYS.filter((k) => k !== currentMessageKey.value)
  currentMessageKey.value = others[Math.floor(Math.random() * others.length)] ?? PRESET_KEYS[0]
  randomBookmark.value = null
  bubbleKey.value++
}

function flattenBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode[] {
  const list: chrome.bookmarks.BookmarkTreeNode[] = []
  for (const node of nodes) {
    if (node.url) list.push(node)
    if (node.children) list.push(...flattenBookmarks(node.children))
  }
  return list
}

async function pickRandomBookmark() {
  randomBookmark.value = null
  try {
    const tree = await chrome.bookmarks.getTree()
    const all = flattenBookmarks(tree)
    if (all.length === 0) {
      currentMessageKey.value = 'agent.noBookmarks'
      bubbleKey.value++
      return
    }
    const one = all[Math.floor(Math.random() * all.length)]!
    randomBookmark.value = {
      title: one.title || one.url || t('agent.unnamed'),
      url: one.url!,
    }
    currentMessageKey.value = 'agent.pickedBookmark'
    bubbleKey.value++
  } catch {
    currentMessageKey.value = 'agent.bookmarksError'
    bubbleKey.value++
  }
}

function openBookmark() {
  if (!randomBookmark.value) return
  chrome.tabs.create({ url: randomBookmark.value.url })
}

const hasBookmark = computed(() => !!randomBookmark.value)
</script>

<template>
  <div class="agent-wrap">
    <div class="bubble-wrap" :key="bubbleKey">
      <div class="bubble">
        <p class="bubble-text">{{ t(currentMessageKey) }}</p>
        <a
          v-if="hasBookmark"
          :href="randomBookmark!.url"
          class="bubble-link"
          target="_blank"
          rel="noopener"
          @click.prevent="openBookmark"
        >
          {{ randomBookmark!.title }}
        </a>
      </div>
      <div class="bubble-tail" />
    </div>
    <div class="character" :title="t('agent.characterTitle')">
      <div class="character-face">
        <span class="eye left" />
        <span class="eye right" />
        <span class="mouth" />
      </div>
    </div>
    <div class="actions">
      <button type="button" class="btn-retro" @click="sayRandom">
        {{ t('agent.sayAgain') }}
      </button>
      <button type="button" class="btn-retro" @click="pickRandomBookmark">
        {{ t('agent.randomBookmark') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.agent-wrap {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 10;
}

.bubble-wrap {
  position: relative;
  max-width: 280px;
}

.bubble {
  background: var(--y2k-bubble-bg);
  border: 2px solid var(--y2k-bubble-border);
  padding: 10px 14px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
  font-family: "MS Sans Serif", "Microsoft Sans Serif", Arial, sans-serif;
  font-size: 14px;
  color: var(--y2k-text);
}

.bubble-text {
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.bubble-link {
  display: block;
  color: var(--y2k-link);
  text-decoration: underline;
  font-size: 13px;
  word-break: break-all;
}

.bubble-link:hover {
  color: var(--y2k-link-hover);
}

.bubble-tail {
  position: absolute;
  right: 24px;
  bottom: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid var(--y2k-bubble-border);
}

.bubble-tail::after {
  content: '';
  position: absolute;
  left: -8px;
  top: -12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid var(--y2k-bubble-bg);
}

.character {
  width: 64px;
  height: 80px;
  background: var(--y2k-agent-character-bg);
  border: 2px solid var(--y2k-border-lo);
  border-top: 3px solid var(--y2k-border-hi);
  border-left: 3px solid var(--y2k-border-hi);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-face {
  position: relative;
  width: 40px;
  height: 40px;
  background: var(--y2k-agent-face-bg);
  border: 1px solid var(--y2k-text-label);
}

.eye {
  position: absolute;
  top: 10px;
  width: 6px;
  height: 6px;
  background: var(--y2k-agent-eye);
}

.eye.left {
  left: 8px;
}

.eye.right {
  right: 8px;
}

.mouth {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 4px;
  border-bottom: 2px solid var(--y2k-agent-eye);
  border-radius: 0 0 8px 8px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-retro {
  background: var(--y2k-btn-face);
  border: 2px solid var(--y2k-border-hi);
  border-right-color: var(--y2k-border-lo);
  border-bottom-color: var(--y2k-border-lo);
  padding: 6px 12px;
  font-family: "MS Sans Serif", Arial, sans-serif;
  font-size: 12px;
  color: var(--y2k-text);
  cursor: pointer;
}

.btn-retro:hover {
  background: var(--y2k-btn-face-hover);
}

.btn-retro:active {
  border-top-color: var(--y2k-border-lo);
  border-left-color: var(--y2k-border-lo);
  border-right-color: var(--y2k-border-hi);
  border-bottom-color: var(--y2k-border-hi);
}
</style>
