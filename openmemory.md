# OpenMemory - Y2K-ifier

## Overview
**Y2K-ifier** 是一款 Google Chrome 扩展插件（Manifest V3），通过“手术级”视觉重塑将现代网页转换为 2000 年代的复古风格。

## Architecture
- **Manifest V3**: 使用 Service Worker (`background.js`) 管理全局状态。
- **Surgical CSS Injection**: 利用 `chrome.scripting` API 在不破坏布局的前提下注入 `retro.css`。
- **Persistent Storage**: 使用 `chrome.storage.local` 持久化“复古模式”开关状态。
- **Retro UI**: Popup 界面采用 Windows 2000 风格设计。

## User Defined Namespaces
- frontend: 包含 Popup UI 和 CSS 样式逻辑。
- extension: 包含 Manifest 配置和 Service Worker 逻辑。

## Components
### [Component] - Popup UI
- **Location**: `popup/`
- **Purpose**: 提供用户控制开关，采用 Win2000 风格。
- **Services**: `chrome.storage`, `chrome.runtime`.

### [Component] - Retro Stylesheet
- **Location**: `styles/retro.css`
- **Purpose**: 定义核心视觉变换（3D 按钮、衬线标题、像素化图片、复古滚动条）。

## Patterns
- **Surgical Injection**: 仅修改装饰性 CSS 属性（border, color, font, filter），避免修改 layout 属性（width, height, flex）。
- **State-driven Injection**: Service Worker 监听存储和标签页更新，动态同步 CSS 状态。
- **Physical DOM Injection**: 对于复杂页面（如百度），直接插入实体 `<div>` 标签以绕过 CSS 伪元素层级限制，并使用 `all: initial` 隔离样式干扰。
- **Pixel-perfect SVG Animation**: 使用行内 SVG 动画替代可能损坏的 Base64 GIF，确保在所有浏览器中 100% 还原复古动态效果。