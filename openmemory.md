# OpenMemory - Y2K-ifier

## Overview
**Y2K-ifier** 是一款 Google Chrome 扩展插件（Manifest V3），通过“手术级”视觉重塑将现代网页转换为 2000 年代复古风格，并提供主题页（XP 壁纸 + 搜索 + 怀旧助手）、多语言与快捷键。

## Architecture
- **Manifest V3**: Service Worker (`background/background.ts`) 管理注入、存储与 `chrome.commands`。
- **Surgical CSS Injection**: `chrome.scripting` 注入 `public/styles/retro.css`。
- **Storage**: `chrome.storage.local` 持久化 `isEnabled`、`crtEnabled`、`optionsSearchEngine`、`locale`。
- **Retro UI**: Popup 与 Newtab 均为 Vue 3 + Win2000/XP 风格；多语言 vue-i18n，文案在 `src/locales/`。

## User Defined Namespaces
- frontend: Popup、Newtab、locales、i18n。
- extension: Manifest、background、retro.css。

## Components
### [Component] - Popup
- **Location**: `src/popup/`
- **Purpose**: 复古/CRT 开关、打开主题页按钮与快捷键提示、中/英切换。

### [Component] - Newtab（主题页 / 选项页）
- **Location**: `src/newtab/`
- **Purpose**: XP 壁纸 + 搜索栏 + 怀旧助手（NostalgicAgent）；与 options_ui 共用，不覆盖 chrome://newtab。

### [Component] - NostalgicAgent
- **Location**: `src/newtab/components/NostalgicAgent.vue`
- **Purpose**: 90s 风格气泡与角色、预设话术、“随机推荐一个书签”（chrome.bookmarks）。

### [Component] - Retro Stylesheet
- **Location**: `public/styles/retro.css`
- **Purpose**: 3D 按钮、衬线标题、像素化图片、CRT/跑马灯等复古视觉。

## Patterns
- **Surgical Injection**: 仅改装饰性 CSS，不改布局。
- **State-driven Injection**: background 监听 storage 与 tabs.onUpdated，同步注入/移除。
- **i18n**: vue-i18n runtime 构建（避免 CSP unsafe-eval）；locale 存 storage，popup/newtab 启动时读取。
- **Commands**: `open_theme` 默认 Alt+Shift+Y，在 background 顶部注册 `chrome.commands.onCommand`。