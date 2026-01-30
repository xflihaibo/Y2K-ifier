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

### 4. 🖼️ 主题页（选项页）
*   **背景**：使用本地壁纸 `public/images/xp.jpeg`（构建后为 `dist/images/xp.jpeg`），需自行将图片放入该路径后构建。
*   **搜索栏**：一行式布局——左侧**搜索引擎选择**（谷歌 / 必应 / 百度），中间**搜索输入框**，右侧**搜索按钮**；选择会持久化到 `chrome.storage.local.optionsSearchEngine`。
*   **打开方式**：弹窗内点击「打开主题页 (XP 壁纸 + 搜索)」，或扩展图标右键 →「选项」，或 `chrome://extensions` → 本扩展「详情」→「扩展程序选项」。

---

## 🛠️ 技术架构

*   **构建**: Vite + Vue 3 + TypeScript，使用 `@samrum/vite-plugin-web-extension` 打包为 Chrome 扩展。
*   **内核**: Manifest V3 (Chrome Extension API)
*   **注入引擎**: 使用 `src/background/background.ts` (Service Worker) 配合 `chrome.scripting` 实现动态样式与脚本注入。
*   **弹窗**: Vue 3 单文件组件 (SFC)，`src/popup/` 下 popup 入口与 `App.vue`。
*   **样式控制**: 高优先级的 `retro.css` 结合 `all: initial` 隔离技术，确保对复杂站点的强力覆盖。
*   **动态特效**: 采用 **像素级内联 SVG 动画**，确保零外部资源依赖且 100% 还原动态效果。

---

## 📦 安装与开发

### 环境要求
*   Node.js 18+
*   npm / pnpm

### 构建与加载扩展
1.  安装依赖：`npm install`
2.  构建扩展：`npm run build`（产物在 `dist/` 目录）
3.  开发监听：`npm run dev`（监听源码变化并持续构建）
4.  打开 Chrome，访问 `chrome://extensions/`，开启 **“开发者模式”**。
5.  点击 **“加载已解压的扩展程序”**，选择本项目下的 **`dist`** 文件夹。

### 项目结构（Vite + Vue + TS）
```
├── public/                 # 静态资源，构建时原样复制到 dist
│   ├── icons/              # 扩展图标 (16×16, 48×48, 128×128 PNG)
│   ├── images/             # 主题页壁纸，需放入 xp.jpeg
│   │   └── README.md       # 说明：将主题页背景图保存为 xp.jpeg
│   └── styles/retro.css    # 注入页面的复古样式表
├── src/
│   ├── background/         # Service Worker (TypeScript)
│   │   └── background.ts
│   ├── popup/              # 弹窗 (Vue 3 + TypeScript)
│   │   ├── popup.html      # 弹窗 HTML 入口
│   │   ├── main.ts         # Vue 挂载入口
│   │   ├── App.vue         # 弹窗根组件（复古/CRT 开关 + 打开主题页）
│   │   └── popup.css       # 弹窗样式
│   └── options/            # 主题页（选项页：壁纸 + 搜索栏）
│       ├── options.html    # 选项页 HTML 入口
│       ├── main.ts         # Vue 挂载入口
│       ├── App.vue         # 主题页组件（搜索引擎选择 + 输入框 + 搜索）
│       └── options.css     # 主题页样式
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
*   **权限最小化**：仅申请必要的 `scripting` 和 `storage` 权限。

---

## 📋 最近更新

*   **主题页（选项页）**
    *   背景使用本地壁纸 `public/images/xp.jpeg`，需自行放入后构建。
    *   搜索栏一行式：左侧搜索引擎选择（谷歌 / 必应 / 百度），中间输入框，右侧搜索按钮；选择会持久化。
    *   弹窗内新增「打开主题页 (XP 壁纸 + 搜索)」按钮，可一键打开主题页。
*   **弹窗**：保留复古模式、CRT 扫描线开关，新增打开主题页入口。
*   **文档**：README 与 `public/images/README.md` 已同步上述说明。

---

## 📬 欢迎 Sign My Guestbook!

如果您有任何点子或遇到了 Bug，欢迎提出 Issue。让我们一起完善这个“复古梦境”。

**"Stay Retro, Stay Y2K!"**

---
© 2000-2026 Y2K-ifier Project. Best viewed in 800x600 resolution.
