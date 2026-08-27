# 💾 Y2K-ifier: 网页复古重塑计划

> **"Welcome to the World Wide Web! 让现代互联网重回黄金时代。"**

---

## 🌟 项目简介

**Y2K-ifier** 是一款遵循**单一用途 (Single Purpose)** 政策的 Google Chrome 扩展插件（Manifest V3），致力于提供纯粹的**网页视觉复古重塑体验**。它通过“手术级”的 CSS 注入技术，将现代网页的装饰性元素重构为 2000 年代初期的经典复古美学。

本插件的所有功能均围绕**“视觉风格回归”**这一核心目的设计，互为补充，为用户提供沉浸式的怀旧浏览主题。

---

## 🚀 核心视觉功能 (Visual Style Transformation)

### 1. 🏛️ “手术级”装饰重塑
*   **3D 交互组件**：将现代扁平化按钮和输入框还原为 Windows 98/2000 风格的灰色凹凸 3D 效果。
*   **衬线排版回归**：系统级字体覆盖，让 Arial、MS Sans Serif 和 Times New Roman 重新定义阅读感。
*   **硬朗直角美学**：全局消除圆角（`border-radius: 0`），找回那个硬朗的直线条时代。

### 2. 📺 硬件级显示模拟
*   **CRT 物理滤镜**：细腻的水平扫描线叠加，配合 RGB 色差偏移，模拟老式显像管的显示质感。
*   **复古视觉修正**：强制像素化渲染（Pixelated Rendering）和低保真滤镜，重现早期互联网的图片质感。

### 3. 🕹️ 复古交互细节
*   **系统级光标替换**：白色粗边框箭头与修长的复古“点击小手”。
*   **怀旧功能挂件**：内置“跑马灯”公告条与“正在建设中”像素挂件，完美还原 2000 年代个人主页的视觉灵魂。
*   **经典滚动条**：重塑 Webkit 滚动条为 Windows 2000 风格的灰色方块。

### 4. 🖼️ 主题页（Y2K 新标签页）
*   **背景**：使用本地壁纸 `public/images/xp.jpeg`，需自行将图片放入该路径后构建。
*   **搜索栏**：搜索引擎选择（谷歌 / 必应 / 百度）+ 搜索输入框 + 搜索按钮；选择持久化到 `chrome.storage.local.optionsSearchEngine`。
*   **怀旧助手**：右下角 90s 风格小助手，预设话术 +「随机推荐一个书签」；后续可扩展为 RAG 助手。
*   **打开方式**：弹窗内「打开主题页」按钮，或快捷键 **Alt+Shift+Y**（Mac：Option+Shift+Y）；扩展选项页也指向该页面。新标签页不覆盖，保持用户本地 `chrome://newtab/`。

### 5. 📌 粘性功能（增强留存）
*   **陪伴天数与里程碑**：每次打开弹窗或主题页会记录当日为「活跃日」，弹窗内显示累计天数（如「7 天」）及当前里程碑徽章（拨号新手 → 网虫 → 冲浪达人 → 老网民 → 骨灰级 → 一年之约），风格与 Win2000 灰框一致。数据存于 `chrome.storage.local.y2kActiveDays`（日期字符串数组，最多 365 条）。
*   **晨间问候**：每天首次打开弹窗时显示一条可关闭的 Y2K 风格问候（如「早，今天也一起复古吧 ✨」），关闭后当日不再显示；关闭日期存于 `chrome.storage.local.y2kGreetingClosedDate`。
*   **每日归航时刻**：在弹窗中可设置每日提醒时间（如 18:00），到点后扩展会打开主题页并显示「归航时刻到了，辛苦了。」；每次触发会记录日期。**归航数据分析**：弹窗内展示「本月归航 X 次」「连续归航 X 天」。需 `alarms` 权限；数据存于 `chrome.storage.local.y2kRitualDates`、`y2kRitualTime`、`y2kRitualEnabled`。
*   **今日足迹**：由 **background** 记录当日浏览数据（`y2kBrowsingData`）：切 tab 时累计**停留时长**，**content script** 在页面内统计**点击、滚动、输入字数**并定期上报。弹窗内展示今日记录（标题/域名、时长、点击数），点击可在新标签页打开。Y2K 灰框列表风格；数据仅存本地。

---

## 🛠️ 技术架构

*   **构建**: Vite + Vue 3 + TypeScript，使用 `@samrum/vite-plugin-web-extension` 打包为 Chrome 扩展。
*   **内核**: Manifest V3 (Chrome Extension API)
*   **注入引擎**: 使用 `src/background/background.ts` (Service Worker) 配合 `chrome.scripting` 实现动态样式与脚本注入。
*   **弹窗**: Vue 3 SFC，`src/popup/`；**主题页**: `src/newtab/`（Vue 3 + 怀旧助手组件），与选项页共用同一页面。
*   **多语言**: vue-i18n，中/英文案在 `src/locales/`；语言存 `chrome.storage.local.locale`。
*   **样式控制**: 高优先级的 `retro.css` 结合 `all: initial` 隔离技术，确保对复杂站点的强力覆盖。
*   **动态特效**: 采用 **像素级内联 SVG 动画**，确保零外部资源依赖且 100% 还原动态效果。

---

## 📦 安装与开发

> 完整开发指南见 **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**（架构、模块、数据流、测试与常见任务）。

### 环境要求
*   Node.js 18+
*   npm / pnpm

### 一键启动开发

```bash
npm install   # 首次需要
npm start     # 安装依赖 + 启动 watch 构建，并提示 Chrome 加载路径
```

### 构建与加载扩展
1.  开发监听：`npm run dev` 或 `npm start`（监听源码变化并持续构建到 `dist/`）
2.  生产构建：`npm run build`
3.  打开 Chrome，访问 `chrome://extensions/`，开启 **“开发者模式”**。
4.  点击 **“加载已解压的扩展程序”**，选择本项目下的 **`dist`** 文件夹。

### 项目结构（Vite + Vue + TS）
```
├── public/                 # 静态资源，构建时原样复制到 dist
│   ├── icons/              # 扩展图标 (16×16, 48×48, 128×128 PNG)
│   ├── images/             # 主题页壁纸，需放入 xp.jpeg
│   │   └── README.md       # 说明：将主题页背景图保存为 xp.jpeg
│   └── styles/retro.css    # 注入页面的复古样式表
├── src/
│   ├── background/         # Service Worker (TypeScript)：复古注入、归航闹钟、今日足迹记录
│   │   └── background.ts
│   ├── content.ts          # Content Script：页面内点击/滚动/输入统计，上报至 background
│   ├── popup/              # 弹窗 (Vue 3)
│   │   ├── popup.html, main.ts, App.vue, popup.css
│   ├── newtab/             # 主题页（壁纸 + 搜索 + 怀旧助手），兼作选项页
│   │   ├── newtab.html, main.ts, App.vue, newtab.css
│   │   └── components/NostalgicAgent.vue  # 怀旧助手
│   ├── locales/            # 多语言 en.ts, zh-CN.ts
│   └── i18n.ts             # vue-i18n 与 locale 存储
├── vite.config.ts          # Vite + web-extension 插件配置
├── tsconfig.json
└── package.json
```

### 说明
*   **`dist/manifest.json` 的打包来源**：由 **`vite.config.ts`** 里 `webExtension({ manifest: { ... } })` 生成，扩展的 `name`、`version`、`description` 从 **`package.json`** 读取，改版本请改 `package.json` 的 `version` 后重新 `npm run build`。
*   **构建以 `src/` 与 `public/` 为准**，加载扩展请使用 **`dist/`** 目录。
*   **图标**：`public/icons/`（PNG 16×16、48×48、128×128）。
*   **复古样式**：`public/styles/retro.css`。
*   **主题页壁纸**：将背景图保存为 **`public/images/xp.jpeg`** 后构建，主题页会使用该图；若未放置则背景为回退色。

---

## ⚠️ 隐私与政策合规

*   **单一用途合规**：本插件专注于网页视觉主题变换，不包含任何无关的功能捆绑。
*   **不收集任何数据**：本插件纯前端运行，没有任何网络请求发送至第三方服务器。
*   **权限最小化**：`scripting`、`storage`、`tabs`、`activeTab`、`bookmarks`（书签仅用于怀旧助手随机推荐，本地读取）、`alarms`（仅用于每日归航定时提醒）。今日足迹数据由扩展自己在 background + content 中记录，无需 `history` 权限。

---

## 📋 当前功能（基础开发完成）

*   **弹窗**：复古模式 / CRT 扫描线开关；打开主题页（整行按钮 + 快捷键提示）；中/英语言切换；**陪伴天数 + 里程碑徽章**（Y2K 风格）；**晨间问候**（每日首次显示，可关闭）；**每日归航时刻**（开关 + 时间选择 + 归航数据：本月次数、连续天数）；**今日足迹**（由 background 记录停留时长 + content 记录点击/滚动/输入，展示今日列表并显示时长与点击，点击打开）。
*   **主题页（newtab）**：XP 壁纸 + 搜索栏（谷歌/必应/百度）+ 怀旧助手（预设话术 + 随机书签）；与选项页共用，不覆盖浏览器新标签页；打开主题页也会累计当日为活跃日。
*   **多语言**：中/英，vue-i18n + `chrome.storage.local.locale`；粘性功能文案已加入 `popup.daysLabel`、`popup.milestones`、`popup.greetingMorning`、`popup.greetingClose`。
*   **快捷键**：Alt+Shift+Y（Mac Option+Shift+Y）打开主题页，可在 `chrome://extensions` → 键盘快捷方式 中修改。

---

## 📬 欢迎 Sign My Guestbook!

如果您有任何点子或遇到了 Bug，欢迎提出 Issue。让我们一起完善这个“复古梦境”。

**"Stay Retro, Stay Y2K!"**

---
© 2000-2026 Y2K-ifier Project. Best viewed in 800x600 resolution.
