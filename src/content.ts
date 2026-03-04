/**
 * Y2K-ifier Content Script: collect page stats (clicks, scroll, chars, duration) and send to background.
 * 伴影思路：数据汇总与复古开关解耦，始终采集并上报；仅在上报成功回调后清空；统计内层滚动；按字符数统计输入。
 */

interface PageStats {
  clicks: number
  scrollDistance: number
  charsTyped: number
  activeDuration: number
}

const stats: PageStats = {
  clicks: 0,
  scrollDistance: 0,
  charsTyped: 0,
  activeDuration: 0,
}

/** 各可滚动元素的上次滚动位置（含 window），用于准确累计滚动距离 */
const lastScrollMap = new WeakMap<Element | Window, { top: number; left: number }>()
/** 各输入元素的上次字符长度，用于按字符数统计输入 */
const lastInputLengthMap = new WeakMap<HTMLElement, number>()

function hasExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.runtime?.id
}

// 每秒在页面可见时累计停留秒数（与复古开关解耦，始终统计）
const heartbeatInterval = setInterval(() => {
  if (!hasExtensionContext()) {
    clearInterval(heartbeatInterval)
    return
  }
  if (document.visibilityState === 'visible') stats.activeDuration += 1
}, 1000)

window.addEventListener('click', () => {
  if (hasExtensionContext()) stats.clicks++
})

// 统计所有可滚动区域：window + 内层 overflow 的 div 等（scroll 不冒泡，用 capture）
function getScrollDelta(el: Element | Window): { top: number; left: number } {
  if (el === window || el === document.documentElement || el === document.body) {
    const top = window.scrollY
    const left = window.scrollX
    const last = lastScrollMap.get(window)
    lastScrollMap.set(window, { top, left })
    if (last !== undefined) return { top: Math.abs(top - last.top), left: Math.abs(left - last.left) }
    return { top: 0, left: 0 }
  }
  const node = el as HTMLElement
  const top = node.scrollTop
  const left = node.scrollLeft
  const last = lastScrollMap.get(node)
  lastScrollMap.set(node, { top, left })
  if (last !== undefined) return { top: Math.abs(top - last.top), left: Math.abs(left - last.left) }
  return { top: 0, left: 0 }
}

document.addEventListener(
  'scroll',
  (e: Event) => {
    if (!hasExtensionContext()) return
    const target = e?.target as Element | undefined
    const el = target && document.contains(target) ? target : window
    const delta = getScrollDelta(el as Element | Window)
    stats.scrollDistance += delta.top + delta.left
  },
  { passive: true, capture: true }
)

// 按字符数统计输入（含粘贴、删除），避免一次粘贴只算 1
function getInputLength(el: HTMLElement): number {
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return ((el as HTMLInputElement).value ?? '').length
  }
  if ((el as HTMLElement & { isContentEditable?: boolean }).isContentEditable) {
    return (el.innerText ?? el.textContent ?? '').length
  }
  return 0
}

document.addEventListener(
  'input',
  (e: Event) => {
    if (!hasExtensionContext()) return
    const target = e.target as HTMLElement & { isContentEditable?: boolean }
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) return
    if ((target as HTMLInputElement).type === 'password' || (target as HTMLInputElement).type === 'hidden') return
    const len = getInputLength(target)
    const last = lastInputLengthMap.get(target) ?? 0
    const delta = len - last
    if (delta > 0) stats.charsTyped += delta
    lastInputLengthMap.set(target, len)
  },
  true
)

// 仅在上报成功的回调里清空，避免发送失败时丢数；1s 同步减少关 tab 前未上报的丢失
const SYNC_INTERVAL_MS = 1000
function flushStats() {
  const hasData =
    stats.clicks > 0 || stats.scrollDistance > 0 || stats.charsTyped > 0 || stats.activeDuration > 0
  if (!hasData) return
  const snapshot = { ...stats }
  chrome.runtime.sendMessage({ type: 'Y2K_UPDATE_STATS', data: snapshot }, () => {
    if (!chrome.runtime.lastError) {
      stats.clicks = 0
      stats.scrollDistance = 0
      stats.charsTyped = 0
      stats.activeDuration = 0
    }
  })
}

const syncInterval = setInterval(() => {
  if (!hasExtensionContext()) {
    clearInterval(syncInterval)
    return
  }
  flushStats()
}, SYNC_INTERVAL_MS)

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hasExtensionContext()) flushStats()
})

// Copy history: save on copy event (max 10 items)
// Important: capture text synchronously — selection can be cleared before async storage callback runs
const Y2K_CLIPBOARD_MAX = 10
document.addEventListener(
  'copy',
  (e: Event) => {
    if (typeof chrome === 'undefined' || !chrome?.runtime?.id) return
    const ev = e as ClipboardEvent
    const text = (
      window.getSelection()?.toString() ||
      (ev.clipboardData?.getData?.('text/plain') ?? '')
    ).trim()
    if (!text) return
    const captured = text
    chrome.storage.local.get({ y2kClipboardEnabled: true, y2kClipboardHistory: [] as { text: string; timestamp: number }[] }, (res) => {
      if (res.y2kClipboardEnabled === false) return
      let list = res.y2kClipboardHistory || []
      list = list.filter((item) => item.text !== captured)
      list.unshift({ text: captured, timestamp: Date.now() })
      list = list.slice(0, Y2K_CLIPBOARD_MAX)
      chrome.storage.local.set({ y2kClipboardHistory: list })
    })
  },
  true
)

// 归航时刻：Y2K 风格描述池（随机展示一句）
const RITUAL_DESCRIPTIONS_ZH = [
  '归航时刻 — 拨号已断开，今日冲浪数据已存档。',
  '*** 最佳浏览：Netscape Navigator 4.0 *** 辛苦了，今天也一起复古吧。',
  'LOADING... PLEASE WAIT... 今日足迹已记录。',
  'YOU ARE VISITOR #000042069 — 归航时刻到，休息一下。',
  'STAY RETRO, STAY Y2K! 今天也感谢你的陪伴。',
  '欢迎来到 90 年代。归航时刻到了，明天再冲浪。',
]
const RITUAL_DESCRIPTIONS_EN = [
  'Ritual hour — dial-up disconnected. Today\'s surf log saved.',
  '*** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 *** Take a break, stay retro.',
  'LOADING... PLEASE WAIT... Today\'s visits recorded.',
  'YOU ARE VISITOR #000042069 — Ritual time. Rest well.',
  'STAY RETRO, STAY Y2K! Thanks for today.',
  'Welcome to the 90s. Ritual hour. See you tomorrow.',
]

// 伴影风格文案：统计单位、时段、footer
const RITUAL_STRINGS: Record<string, {
  title: string
  message: string
  statActive: string
  statClicks: string
  statScroll: string
  statChars: string
  unitMinutes: string
  unitTimes: string
  unitMeters: string
  timelineLabel: string
  periodMorning: string
  periodAfternoon: string
  periodEvening: string
  timelineEmpty: string
  tagsLabel: string
  cardFooter: string
  narrativePrefix: string
  narrativeClosings: string[]
}> = {
  'zh-CN': {
    title: '每日归航时刻',
    message: '归航时刻到了，辛苦了。今天也一起复古吧。',
    statActive: '活跃时长',
    statClicks: '累计点击',
    statScroll: '滚动距离',
    statChars: '敲击字数',
    unitMinutes: '分钟',
    unitTimes: '次',
    unitMeters: '米',
    timelineLabel: '今日轨迹时间轴',
    periodMorning: '上午',
    periodAfternoon: '下午',
    periodEvening: '晚上',
    timelineEmpty: '暂无',
    tagsLabel: '今日关键词',
    cardFooter: '—— 数据仅存本地 · Y2K-ifier 归航记录',
    narrativePrefix: '>>>',
    narrativeClosings: [
      '辛苦了，关掉电脑去休息吧～ 明天再冲浪。',
      '今天先到这里，让眼睛歇一歇。',
      '下班快乐～ 明天见。',
      '冲浪结束，记得伸个懒腰。',
      '今天也辛苦了，晚安明天见。',
      '关掉屏幕，去喝杯水吧。',
      '今日份上网已存档，休息一下再出发。',
    ],
  },
  en: {
    title: 'Daily ritual',
    message: "It's time to come home. Take a break and stay retro.",
    statActive: 'Active time',
    statClicks: 'Clicks',
    statScroll: 'Scroll',
    statChars: 'Chars typed',
    unitMinutes: 'min',
    unitTimes: '',
    unitMeters: 'm',
    timelineLabel: 'Today\'s timeline',
    periodMorning: 'Morning',
    periodAfternoon: 'Afternoon',
    periodEvening: 'Evening',
    timelineEmpty: 'None',
    tagsLabel: 'Today\'s keywords',
    cardFooter: '— Data stays local · Y2K-ifier ritual',
    narrativePrefix: '>>>',
    narrativeClosings: [
      'You did great today. Log off and rest — see you tomorrow.',
      "That's a wrap. Take a break and stay cozy.",
      'Time to log off. Rest well, see you tomorrow.',
      "You've earned a break. Catch you next time.",
      'Off duty now. Get some rest.',
      "Today's session saved. See you tomorrow.",
      'Unplug for a bit. You deserve it.',
    ],
  },
}

function formatRitualDurationMinutes(seconds: number): number {
  return Math.round(seconds / 60)
}

function formatRitualScrollMeters(px: number): number {
  return px < 1000 ? 0 : Math.round((px / 1000) * 10) / 10
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function formatRitualTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/** 归航叙事：动态比喻 + Y2K 风格，根据数据组合成一段话 */
function buildRitualNarrative(
  isZh: boolean,
  data: { clicks: number; scroll: number; duration: number; chars: number },
  durationMin: number,
  scrollM: number,
  scrollVal: string,
  byPeriod: { morning: string[]; afternoon: string[]; evening: string[] },
  uniqueDomains: string[],
  t: { periodMorning: string; periodAfternoon: string; periodEvening: string; unitMinutes: string; unitMeters: string; unitTimes: string }
): string {
  const durationHours = Math.round((data.duration / 3600) * 10) / 10
  const topDomain = uniqueDomains[0]
  const counts = [byPeriod.morning.length, byPeriod.afternoon.length, byPeriod.evening.length]
  const peakIdx = counts.indexOf(Math.max(...counts))
  const peakLabels = [t.periodMorning, t.periodAfternoon, t.periodEvening]
  const peakLabel = peakIdx >= 0 ? peakLabels[peakIdx] : peakLabels[1]
  const peakHours = [9, 14, 21]
  const peakHour = peakIdx >= 0 ? peakHours[peakIdx] : 14

  if (isZh) {
    const openings = [
      '今天，你航行在代码海洋。',
      '今日冲浪日志：你在比特之海里漂了一程。',
      '这一日，你驶过信息的海。',
    ]
    const stayPhrases = topDomain
      ? [
          `你似乎在 ${topDomain} 停留了很久，留下了深刻的足迹。`,
          `你在 ${topDomain} 的港湾里锚泊了许久。`,
          `${topDomain} 像是你今天最常靠岸的码头。`,
        ]
      : []
    const charPhrases = [
      `你敲下了 ${data.chars} 个思考的碎片`,
      `指尖在键盘上刻下了 ${data.chars} 个字符的印记`,
      `你留下了 ${data.chars} 个字的数字足迹`,
    ]
    const clickPhrases = [
      `指尖在屏幕上轻快地跳了 ${data.clicks} 次舞`,
      `鼠标与触控替你点了 ${data.clicks} 次头`,
      `你与界面击掌 ${data.clicks} 次`,
    ]
    const scrollPhrases =
      data.scroll >= 1000
        ? [
            `在数字的峰峦间翻越了 ${scrollM} ${t.unitMeters}。`,
            `在信息的山脉里卷动了 ${scrollM} ${t.unitMeters}。`,
            `你在长页的梯田里跋涉了 ${scrollM} ${t.unitMeters}。`,
          ]
        : [
            `在数字的峰峦间翻越了 ${scrollVal}。`,
            `在信息的山脉里卷动了 ${scrollVal}。`,
          ]
    const peakPhrases = [
      `在 ${peakHour} 点左右，是你灵魂最活跃的时刻。`,
      `${peakLabel}，是你的冲浪高峰。`,
      `大约 ${peakLabel}，你与网络最同频。`,
    ]
    const durationPhrases = [
      `你在数字世界已经停留了 ${durationHours} 小时。`,
      `挂线时长：${durationMin}${t.unitMinutes}，像一场漫长的拨号。`,
      `你在赛博空间里度过了 ${durationMin}${t.unitMinutes}。`,
    ]
    const parts: string[] = [openings[Math.floor(Math.random() * openings.length)]]
    if (stayPhrases.length > 0) parts.push(stayPhrases[Math.floor(Math.random() * stayPhrases.length)])
    parts.push(charPhrases[Math.floor(Math.random() * charPhrases.length)] + '，')
    parts.push(clickPhrases[Math.floor(Math.random() * clickPhrases.length)] + '，')
    parts.push(scrollPhrases[Math.floor(Math.random() * scrollPhrases.length)])
    parts.push(peakPhrases[Math.floor(Math.random() * peakPhrases.length)])
    parts.push(durationPhrases[Math.floor(Math.random() * durationPhrases.length)])
    return parts.join(' ')
  }

  const openings = [
    "Today, you sailed the ocean of code.",
    "Today's surf log: you cruised the bitstream.",
    "This day, you navigated the sea of information.",
  ]
  const stayPhrases = topDomain
    ? [
        `You seemed to linger long at ${topDomain}, leaving deep footprints.`,
        `You anchored at ${topDomain} for a good while.`,
        `${topDomain} was your most-visited port today.`,
      ]
    : []
  const charPhrases = [
    `You typed ${data.chars} fragments of thought`,
    `Your fingers carved ${data.chars} characters into the stream`,
    `You left ${data.chars} characters of digital trace`,
  ]
  const clickPhrases = [
    `your fingers danced ${data.clicks} times on the screen`,
    `you clicked ${data.clicks} times through the interface`,
    `you high-fived the UI ${data.clicks} times`,
  ]
  const scrollPhrases =
    data.scroll >= 1000
      ? [
          `and climbed ${scrollM} ${t.unitMeters} over digital peaks.`,
          `and scrolled ${scrollM} ${t.unitMeters} through the info range.`,
        ]
      : [`and climbed ${scrollVal} over digital peaks.`]
  const peakPhrases = [
    `Around ${peakHour}:00 was when your soul was most active.`,
    `${peakLabel} was your surf peak.`,
    `Around ${peakLabel}, you were most in sync with the net.`,
  ]
  const durationPhrases = [
    `You stayed in the digital world for ${durationHours} hours.`,
    `Online for ${durationMin} ${t.unitMinutes} — like a long dial-up.`,
    `You spent ${durationMin} ${t.unitMinutes} in cyberspace.`,
  ]
  const parts: string[] = [openings[Math.floor(Math.random() * openings.length)]]
  if (stayPhrases.length > 0) parts.push(stayPhrases[Math.floor(Math.random() * stayPhrases.length)])
  parts.push(charPhrases[Math.floor(Math.random() * charPhrases.length)] + ',')
  parts.push(clickPhrases[Math.floor(Math.random() * clickPhrases.length)] + ',')
  parts.push(scrollPhrases[Math.floor(Math.random() * scrollPhrases.length)])
  parts.push(peakPhrases[Math.floor(Math.random() * peakPhrases.length)])
  parts.push(durationPhrases[Math.floor(Math.random() * durationPhrases.length)])
  return parts.join(' ')
}

interface RitualTimelineItem {
  visitTime: number
  title: string
  url: string
  domain: string
  /** 该页今日可见停留秒数，用于今日关键词排序 */
  activeDuration?: number
  /** @deprecated 兼容旧 payload，优先用 activeDuration */
  duration?: number
}

function getTimelineItemDuration(item: RitualTimelineItem): number {
  return (item.activeDuration ?? item.duration ?? 0)
}

// 归航时刻：变色/三闪/收线动画 → 全黑 → 打印机音效 + 热敏纸小票滑出 → 归航浮层
const Y2K_FLOAT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="#c0c0c0" stroke="#808080" stroke-width="2"/><circle cx="16" cy="18" r="3" fill="#000"/><circle cx="32" cy="18" r="3" fill="#000"/><path d="M14 30 Q24 38 34 30" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`
const RITUAL_DURATION_MS = 4200
const RITUAL_RECEIPT_DELAY_MS = 600
const RITUAL_RECEIPT_ANIM_MS = 1800
const RITUAL_FLOAT_AFTER_RECEIPT_MS = 2400
/** 小票底部 CTA 跳转：伴影 (Shadow Mate) Chrome 商店页 */
const RECEIPT_AD_CTA_URL = 'https://chromewebstore.google.com/detail/hlidpdhiafeejnmjbpjkbdpohocfjicf?utm_source=item-share-cb'

/** 热敏纸小票文案：中/英 */
const RECEIPT_STRINGS: Record<'zh-CN' | 'en', {
  dateLabel: string
  timeLabel: string
  header: string
  separator: string
  totalMemory: (min: number) => string
  signature: string
  unknown: string
  ad: string
  adCta: string
}> = {
  'zh-CN': {
    dateLabel: '日期',
    timeLabel: '时间',
    header: '--- 冲浪日志 ---',
    separator: '--------------------',
    totalMemory: (min) => `[ 总时长: ${min} 分钟 ]`,
    signature: '"由 Shadow Mate 存档"',
    unknown: '未知',
    ad: '明天想专注一点？试试',
    adCta: '[ 专注标签 ]',
  },
  en: {
    dateLabel: 'DATE',
    timeLabel: 'TIME',
    header: '--- BROWSING LOG ---',
    separator: '--------------------',
    totalMemory: (min) => `[ TOTAL MEMORY: ${min}m ]`,
    signature: '"Saved by Shadow Mate"',
    unknown: 'unknown',
    ad: 'Need a clean slate for tomorrow? Try',
    adCta: '[ Focus Tab ]',
  },
}

function buildReceiptLines(data: { duration: number; timeline?: RitualTimelineItem[]; locale?: string }): string[] {
  const isZh = data.locale === 'zh-CN'
  const t = RECEIPT_STRINGS[isZh ? 'zh-CN' : 'en']
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  const totalMin = Math.round(data.duration / 60)
  const lines: string[] = [
    `[ ${t.dateLabel}: ${dateStr} ]`,
    `[ ${t.timeLabel}: ${timeStr} ]`,
    '',
    t.header,
  ]
  const timeline = (data.timeline ?? []).slice()
  timeline.sort((a, b) => getTimelineItemDuration(b) - getTimelineItemDuration(a))
  const top = timeline.slice(0, 10)
  for (const item of top) {
    const d = item.domain || t.unknown
    const m = Math.round(getTimelineItemDuration(item) / 60)
    const pad = Math.max(0, 24 - d.length)
    lines.push(`> ${d} ${'.'.repeat(pad)} ${m}m`)
  }
  lines.push(t.separator)
  lines.push(t.totalMemory(totalMin))
  lines.push('')
  lines.push(t.signature)
  return lines
}

function playPrinterBuzz() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    const dur = 1.4
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const noise = ctx.createBufferSource()
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const channel = noiseBuf.getChannelData(0)
    for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * 0.15
    noise.buffer = noiseBuf
    noise.connect(gain)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(55, ctx.currentTime)
    osc.frequency.setValueAtTime(75, ctx.currentTime + dur * 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.06, ctx.currentTime + dur - 0.2)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + dur)
  } catch {
    /* no audio */
  }
}

function showY2kRitualFloatingAvatar(data: {
  clicks: number
  scroll: number
  duration: number
  chars: number
  locale: string
  timeline?: RitualTimelineItem[]
}) {
  if (document.getElementById('y2k-ritual-float') || document.getElementById('y2k-ritual-overlay')) return
  if (document.getElementById('y2k-ritual-container')) return
  const isZh = data.locale === 'zh-CN'
  const label = isZh ? '归航' : 'Ritual'

  // 归航动画样式（overlay 变色/三闪/收线 + 扫描线呼吸）
  let ritualStyle = document.getElementById('y2k-ritual-animation-styles')
  if (!ritualStyle) {
    ritualStyle = document.createElement('style')
    ritualStyle.id = 'y2k-ritual-animation-styles'
    ritualStyle.textContent = `
      #y2k-ritual-container {
        --ritual-duration: 4.2s;
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 2147483644; pointer-events: none;
      }
      #y2k-ritual-container .ritual-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; background: transparent;
        mix-blend-mode: screen; transform-origin: 50% 50%;
      }
      #y2k-ritual-container.ritual-active .ritual-overlay {
        animation: y2k-ritual-logic var(--ritual-duration) cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      @keyframes y2k-ritual-logic {
        0% {
          background: rgba(255, 230, 100, 0);
          backdrop-filter: brightness(1) sepia(0);
        }
        20% {
          background: rgba(255, 200, 50, 0.15);
          backdrop-filter: brightness(0.8) sepia(0.5);
        }
        50% {
          background: rgba(20, 10, 0, 0.6);
          backdrop-filter: brightness(0.3) sepia(0.8) contrast(1.5);
        }
        80% {
          background: rgba(255, 255, 255, 0);
          transform: scaleY(1);
          backdrop-filter: brightness(0.1);
        }
        82.67% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.01) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        83.2% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.001) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        84% {
          background: rgba(255, 255, 255, 0);
          transform: scaleY(1);
          backdrop-filter: brightness(0.1);
        }
        85.33% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.01) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        85.87% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.001) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        86.67% {
          background: rgba(255, 255, 255, 0);
          transform: scaleY(1);
          backdrop-filter: brightness(0.1);
        }
        88% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.01) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        88.5% {
          background: rgba(246, 252, 248, 0.9);
          transform: scaleY(0.001) scaleX(1.1);
          backdrop-filter: brightness(10);
        }
        90% {
          background: white;
          transform: scaleY(0.002) scaleX(0.1);
          opacity: 1;
        }
        100% {
          background: black;
          transform: scale(0);
          opacity: 1;
        }
      }
      #y2k-ritual-container .ritual-scanlines {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to bottom, rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
        background-size: 100% 4px;
        pointer-events: none; opacity: 0.15;
      }
      #y2k-ritual-container.ritual-active .ritual-scanlines {
        animation: scanline-breathing 8s infinite linear;
      }
      @keyframes scanline-breathing {
        0% { opacity: 0.1; }
        50% { opacity: 0.25; }
        100% { opacity: 0.1; }
      }
      /* 热敏纸小票：全黑后滑出 */
      #y2k-ritual-receipt-wrap {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
      }
      #y2k-ritual-receipt-wrap.receipt-visible { opacity: 1; }
      .y2k-ritual-receipt {
        position: relative;
        width: 280px; max-width: 90vw;
        background: linear-gradient(to bottom, #f5f5f0 0%, #e8e8e0 100%),
                    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 3px);
        color: #1a1a1a;
        font-family: "Courier New", "Consolas", monospace;
        font-size: 11px;
        line-height: 1.5;
        padding: 16px 20px 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.08);
        white-space: pre;
        transform: translateY(100vh);
        transition: transform 1.8s cubic-bezier(0.22, 1, 0.36, 1);
        letter-spacing: 0.02em;
        text-shadow: 0 0 0.5px rgba(0,0,0,0.15);
        clip-path: polygon(
          0 8px, 2.08% 0, 4.17% 8px, 6.25% 0, 8.33% 8px, 10.42% 0, 12.5% 8px, 14.58% 0, 16.67% 8px, 18.75% 0, 20.83% 8px, 22.92% 0, 25% 8px, 27.08% 0, 29.17% 8px, 31.25% 0, 33.33% 8px, 35.42% 0, 37.5% 8px, 39.58% 0, 41.67% 8px, 43.75% 0, 45.83% 8px, 47.92% 0, 50% 8px, 52.08% 0, 54.17% 8px, 56.25% 0, 58.33% 8px, 60.42% 0, 62.5% 8px, 64.58% 0, 66.67% 8px, 68.75% 0, 70.83% 8px, 72.92% 0, 75% 8px, 77.08% 0, 79.17% 8px, 81.25% 0, 83.33% 8px, 85.42% 0, 87.5% 8px, 89.58% 0, 91.67% 8px, 93.75% 0, 95.83% 8px, 97.92% 0, 100% 8px,
          100% calc(100% - 8px), 97.92% 100%, 95.83% calc(100% - 8px), 93.75% 100%, 91.67% calc(100% - 8px), 89.58% 100%, 87.5% calc(100% - 8px), 85.42% 100%, 83.33% calc(100% - 8px), 81.25% 100%, 79.17% calc(100% - 8px), 77.08% 100%, 75% calc(100% - 8px), 72.92% 100%, 70.83% calc(100% - 8px), 68.75% 100%, 66.67% calc(100% - 8px), 64.58% 100%, 62.5% calc(100% - 8px), 60.42% 100%, 58.33% calc(100% - 8px), 56.25% 100%, 54.17% calc(100% - 8px), 52.08% 100%, 50% calc(100% - 8px), 47.92% 100%, 45.83% calc(100% - 8px), 43.75% 100%, 41.67% calc(100% - 8px), 39.58% 100%, 37.5% calc(100% - 8px), 35.42% 100%, 33.33% calc(100% - 8px), 31.25% 100%, 29.17% calc(100% - 8px), 27.08% 100%, 25% calc(100% - 8px), 22.92% 100%, 20.83% calc(100% - 8px), 18.75% 100%, 16.67% calc(100% - 8px), 14.58% 100%, 12.5% calc(100% - 8px), 10.42% 100%, 8.33% calc(100% - 8px), 6.25% 100%, 4.17% calc(100% - 8px), 2.08% 100%, 0 calc(100% - 8px),
          0 8px
        );
      }
      #y2k-ritual-receipt-wrap.receipt-slide .y2k-ritual-receipt { transform: translateY(0); }
      .y2k-ritual-receipt .receipt-signature {
        font-family: "Comic Sans MS", "Bradley Hand", "Segoe Script", cursive;
        font-style: italic;
        font-size: 12px;
        margin-top: 8px;
        color: #333;
      }
      .y2k-ritual-receipt .receipt-tear-line {
        margin-top: 14px;
        height: 2px;
        background: repeating-linear-gradient(90deg, #888 0, #888 3px, transparent 3px, transparent 8px);
        border: none;
      }
      .y2k-ritual-receipt .receipt-ad {
        margin-top: 10px;
        font-size: 10px;
        color: #555;
        line-height: 1.4;
        white-space: normal;
        word-break: break-word;
      }
      .y2k-ritual-receipt .receipt-ad-cta {
        font-weight: bold;
        color: #000080;
        text-decoration: underline;
        cursor: pointer;
      }
      .y2k-ritual-receipt .receipt-ad-cta:hover { color: #0000b0; }
      .y2k-ritual-receipt { pointer-events: auto; }
    `
    document.head.appendChild(ritualStyle)
  }

  // 浮层按钮样式
  let floatStyle = document.getElementById('y2k-ritual-float-styles')
  if (!floatStyle) {
    floatStyle = document.createElement('style')
    floatStyle.id = 'y2k-ritual-float-styles'
    floatStyle.textContent = `
      #y2k-ritual-float { position: fixed; right: 24px; bottom: 24px; z-index: 2147483645; cursor: pointer; pointer-events: auto; }
      #y2k-ritual-float .y2k-ritual-float-box { background: #c0c0c0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-bottom: 2px solid #808080; border-right: 2px solid #808080; padding: 12px 14px; box-shadow: 2px 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 12px; }
      #y2k-ritual-float .y2k-ritual-float-box:hover { background: #d0d0d0; }
      #y2k-ritual-float .y2k-ritual-float-avatar { width: 48px; height: 48px; flex-shrink: 0; line-height: 0; }
      #y2k-ritual-float .y2k-ritual-float-avatar svg { width: 48px; height: 48px; display: block; }
      #y2k-ritual-float .y2k-ritual-float-label { font-family: "MS Sans Serif", Arial, sans-serif; font-size: 12px; font-weight: bold; color: #000080; }
    `
    document.head.appendChild(floatStyle)
  }

  const container = document.createElement('div')
  container.id = 'y2k-ritual-container'
  container.className = 'y2k-ritual-container ritual-active'
  container.innerHTML = '<div class="ritual-content"></div><div class="ritual-overlay"></div><div class="ritual-scanlines"></div>'
  document.body.appendChild(container)

  const float = document.createElement('div')
  float.id = 'y2k-ritual-float'
  float.setAttribute('aria-label', isZh ? '点击查看今日归航信息' : 'Click to see today\'s ritual')
  float.innerHTML = `
    <div class="y2k-ritual-float-box">
      <div class="y2k-ritual-float-avatar">${Y2K_FLOAT_AVATAR_SVG}</div>
      <span class="y2k-ritual-float-label">${escapeHtml(label)}</span>
    </div>
  `
  float.addEventListener('click', () => {
    document.getElementById('y2k-ritual-container')?.remove()
    float.remove()
    showY2kRitualUI(data)
  })

  // 动画结束后：先短暂全黑，再显示小票 + 打印机音效，最后出归航浮层
  window.setTimeout(() => {
    const cont = document.getElementById('y2k-ritual-container')
    if (!cont) return
    const wrap = document.createElement('div')
    wrap.id = 'y2k-ritual-receipt-wrap'
    const receipt = document.createElement('div')
    receipt.className = 'y2k-ritual-receipt'
    const lines = buildReceiptLines(data)
    const signature = lines.pop() ?? ''
    const bodyText = lines.join('\n')
    const receiptT = RECEIPT_STRINGS[data.locale === 'zh-CN' ? 'zh-CN' : 'en']
    const ctaHref = RECEIPT_AD_CTA_URL
    const tearAndAd = `<div class="receipt-tear-line"></div><div class="receipt-ad">${escapeHtml(receiptT.ad)} <a href="${escapeHtml(ctaHref)}" target="_blank" rel="noopener noreferrer" class="receipt-ad-cta">${escapeHtml(receiptT.adCta)}</a> &gt;</div>`
    receipt.innerHTML = escapeHtml(bodyText) + '\n<span class="receipt-signature">' + escapeHtml(signature) + '</span>' + tearAndAd
    wrap.appendChild(receipt)
    cont.appendChild(wrap)
    playPrinterBuzz()
    wrap.classList.add('receipt-visible')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => wrap.classList.add('receipt-slide'))
    })
    window.setTimeout(() => {
      if (!document.getElementById('y2k-ritual-container')) return
      document.body.appendChild(float)
    }, RITUAL_FLOAT_AFTER_RECEIPT_MS)
  }, RITUAL_DURATION_MS + RITUAL_RECEIPT_DELAY_MS)
}

function showY2kRitualUI(data: {
  clicks: number
  scroll: number
  duration: number
  chars: number
  locale: string
  timeline?: RitualTimelineItem[]
}) {
  if (document.getElementById('y2k-ritual-overlay')) return
  document.getElementById('y2k-ritual-float')?.remove()
  const isZh = data.locale === 'zh-CN'
  const t = RITUAL_STRINGS[isZh ? 'zh-CN' : 'en'] ?? RITUAL_STRINGS.en
  const descPool = isZh ? RITUAL_DESCRIPTIONS_ZH : RITUAL_DESCRIPTIONS_EN
  const y2kDescription = descPool[Math.floor(Math.random() * descPool.length)]
  const durationMin = formatRitualDurationMinutes(data.duration)
  const scrollM = formatRitualScrollMeters(data.scroll)
  const scrollVal = data.scroll < 1000 ? `${data.scroll} px` : `${scrollM} ${t.unitMeters}`
  const timeline = data.timeline ?? []
  /** 今日关键词：按停留时长最久的前 10 条页面，用 domain 作为关键词（去重保序） */
  const topByDuration = [...timeline]
    .sort((a, b) => getTimelineItemDuration(b) - getTimelineItemDuration(a))
    .slice(0, 10)
  const seenDomain = new Set<string>()
  const todayKeywords = topByDuration
    .map((x) => x.domain)
    .filter((d) => d && !seenDomain.has(d) && (seenDomain.add(d), true))
  function groupByPeriod(items: RitualTimelineItem[]): { morning: string[]; afternoon: string[]; evening: string[] } {
    const m: string[] = []
    const a: string[] = []
    const e: string[] = []
    const sm = new Set<string>()
    const sa = new Set<string>()
    const se = new Set<string>()
    for (const item of items) {
      const hr = new Date(item.visitTime).getHours()
      const d = item.domain || ''
      if (!d) continue
      if (hr >= 6 && hr < 12) { if (!sm.has(d)) { sm.add(d); m.push(d) } }
      else if (hr >= 12 && hr < 18) { if (!sa.has(d)) { sa.add(d); a.push(d) } }
      else { if (!se.has(d)) { se.add(d); e.push(d) } }
    }
    return { morning: m.slice(0, 5), afternoon: a.slice(0, 5), evening: e.slice(0, 5) }
  }
  const byPeriod = groupByPeriod(timeline)
  const narrative = buildRitualNarrative(isZh, data, durationMin, scrollM, scrollVal, byPeriod, todayKeywords, t)

  const style = document.createElement('style')
  style.id = 'y2k-ritual-styles'
  style.textContent = `
    .y2k-ritual-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); z-index: 2147483646; }
    .y2k-ritual-overlay .y2k-ritual-card-wrap { position: absolute; right: 24px; bottom: 24px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; }
    .y2k-ritual-card { width: 340px; max-width: calc(100vw - 48px); max-height: 80vh; overflow-y: auto; background: #c0c0c0; font-family: "MS Sans Serif", Arial, sans-serif; font-size: 11px; color: #000; z-index: 2147483647;
      border-top: 2px solid #fff; border-left: 2px solid #fff; border-bottom: 2px solid #808080; border-right: 2px solid #808080; padding: 12px; box-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
    .y2k-ritual-card .y2k-ritual-title { font-weight: bold; font-size: 12px; margin-bottom: 6px; color: #000080; }
    .y2k-ritual-card .y2k-ritual-close { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; padding: 0; font-size: 14px; line-height: 1; background: #c0c0c0; border: 2px solid #808080; cursor: pointer; color: #000; display: flex; align-items: center; justify-content: center; }
    .y2k-ritual-card .y2k-ritual-close:hover { background: #e0e0e0; }
    .y2k-ritual-card .y2k-ritual-close:active { border-color: #fff; }
    .y2k-ritual-desc { margin-bottom: 6px; line-height: 1.3; color: #000080; font-size: 10px; padding: 5px 8px; background: #d8d8d8; border-top: 2px solid #808080; border-left: 2px solid #808080; border-bottom: 2px solid #fff; border-right: 2px solid #fff; }
    .y2k-ritual-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
    .y2k-ritual-stat { background: #e0e0e0; padding: 6px 8px; border-top: 1px solid #fff; border-left: 1px solid #fff; border-bottom: 1px solid #808080; border-right: 1px solid #808080; display: flex; justify-content: space-between; align-items: center; }
    .y2k-ritual-stat-label { color: #333; }
    .y2k-ritual-stat-value { font-weight: bold; color: #000; }
    .y2k-ritual-narrative { margin-top: 6px; margin-bottom: 4px; line-height: 1.4; color: #000; font-size: 11px; padding: 8px 10px; background: #e0e0e0; border-top: 2px solid #fff; border-left: 2px solid #fff; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-family: "MS Sans Serif", Arial, sans-serif; }
    .y2k-ritual-narrative-prefix { color: #000080; font-weight: bold; margin-right: 4px; }
    .y2k-ritual-narrative-closing { margin-bottom: 10px; font-size: 10px; color: #555; line-height: 1.4; padding-left: 10px; font-style: italic; }
    .y2k-ritual-timeline-title { font-weight: bold; font-size: 11px; margin-top: 14px; margin-bottom: 10px; color: #000; }
    .y2k-ritual-timeline-item { display: flex; align-items: flex-start; margin-bottom: 10px; }
    .y2k-ritual-timeline-time { font-size: 10px; color: #333; width: 48px; flex-shrink: 0; }
    .y2k-ritual-timeline-content { flex: 1; padding-left: 8px; border-left: 2px solid #a0a0a0; font-size: 10px; color: #444; }
    .y2k-ritual-timeline-item.active .y2k-ritual-timeline-content { border-left-color: #000080; }
    .y2k-ritual-footer { margin-top: 12px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #808080; padding-top: 8px; }
    .y2k-ritual-tags-title { font-weight: bold; font-size: 10px; margin-bottom: 4px; color: #000; }
    .y2k-ritual-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .y2k-ritual-tag { padding: 2px 6px; font-size: 9px; background: #e0e0e0; border: 1px solid #808080; color: #000; }
  `
  document.head.appendChild(style)

  const timelineHtml = `
    <div class="y2k-ritual-timeline-title">${t.timelineLabel}</div>
    <div class="y2k-ritual-timeline-item ${byPeriod.morning.length > 0 ? 'active' : ''}"><div class="y2k-ritual-timeline-time">${t.periodMorning}</div><div class="y2k-ritual-timeline-content">${byPeriod.morning.length > 0 ? byPeriod.morning.map((d) => escapeHtml(d)).join(' · ') : t.timelineEmpty}</div></div>
    <div class="y2k-ritual-timeline-item ${byPeriod.afternoon.length > 0 ? 'active' : ''}"><div class="y2k-ritual-timeline-time">${t.periodAfternoon}</div><div class="y2k-ritual-timeline-content">${byPeriod.afternoon.length > 0 ? byPeriod.afternoon.map((d) => escapeHtml(d)).join(' · ') : t.timelineEmpty}</div></div>
    <div class="y2k-ritual-timeline-item ${byPeriod.evening.length > 0 ? 'active' : ''}"><div class="y2k-ritual-timeline-time">${t.periodEvening}</div><div class="y2k-ritual-timeline-content">${byPeriod.evening.length > 0 ? byPeriod.evening.map((d) => escapeHtml(d)).join(' · ') : t.timelineEmpty}</div></div>
  `

  const tagsHtml =
    todayKeywords.length === 0
      ? ''
      : `<div class="y2k-ritual-tags-title">${t.tagsLabel}</div><div class="y2k-ritual-tags">${todayKeywords
          .map((d) => `<span class="y2k-ritual-tag">${escapeHtml(d)}</span>`)
          .join('')}</div>`

  const overlay = document.createElement('div')
  overlay.id = 'y2k-ritual-overlay'
  overlay.className = 'y2k-ritual-overlay'
  const wrap = document.createElement('div')
  wrap.className = 'y2k-ritual-card-wrap'
  const card = document.createElement('div')
  card.className = 'y2k-ritual-card'
  const activeVal = `${durationMin}${t.unitMinutes}`
  const clicksVal = `${data.clicks}${t.unitTimes}`
  const statsHtml = `
    <div class="y2k-ritual-stats">
      <div class="y2k-ritual-stat"><span class="y2k-ritual-stat-label">${escapeHtml(t.statClicks)}</span><span class="y2k-ritual-stat-value">${escapeHtml(clicksVal.trim())}</span></div>
      <div class="y2k-ritual-stat"><span class="y2k-ritual-stat-label">${escapeHtml(t.statScroll)}</span><span class="y2k-ritual-stat-value">${escapeHtml(scrollVal)}</span></div>
      <div class="y2k-ritual-stat"><span class="y2k-ritual-stat-label">${escapeHtml(t.statActive)}</span><span class="y2k-ritual-stat-value">${escapeHtml(activeVal)}</span></div>
      <div class="y2k-ritual-stat"><span class="y2k-ritual-stat-label">${escapeHtml(t.statChars)}</span><span class="y2k-ritual-stat-value">${escapeHtml(String(data.chars))}</span></div>
    </div>
  `
  card.innerHTML = `
    <button type="button" class="y2k-ritual-close" aria-label="Close">×</button>
    <div class="y2k-ritual-title">${t.title}</div>
    <div class="y2k-ritual-desc">${escapeHtml(y2kDescription)}</div>
    ${statsHtml}
    <div class="y2k-ritual-narrative"><span class="y2k-ritual-narrative-prefix">${escapeHtml(t.narrativePrefix ?? '>>>')}</span> ${escapeHtml(narrative)} ${escapeHtml(t.narrativeClosings[Math.floor(Math.random() * t.narrativeClosings.length)])}</div>
    ${timelineHtml}
    ${tagsHtml}
    <div class="y2k-ritual-footer">${escapeHtml(t.cardFooter)}</div>
  `
  wrap.appendChild(card)
  overlay.appendChild(wrap)
  const closeBtn = card.querySelector('.y2k-ritual-close')
  const remove = () => {
    overlay.remove()
    style.remove()
  }
  closeBtn?.addEventListener('click', remove)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) remove() })
  document.body.appendChild(overlay)
}

if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
  chrome.runtime.onMessage.addListener((msg: { type?: string; data?: { clicks: number; scroll: number; duration: number; chars: number; locale: string; timeline?: RitualTimelineItem[] } }) => {
    if (msg.type === 'Y2K_SHOW_RITUAL' && msg.data) showY2kRitualFloatingAvatar(msg.data)
  })
}
