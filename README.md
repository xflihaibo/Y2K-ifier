# 💾 Y2K-ifier: 网页复古重塑计划

> **"Welcome to the World Wide Web! 让现代互联网重回黄金时代。"**

---

## 🌟 项目简介

**Y2K-ifier** 是一款专为怀旧者、设计爱好者和开发者打造的 Google Chrome 扩展插件（Manifest V3）。它通过“手术级”的 CSS 注入和 DOM 操控技术，将现代扁平化、现代化的网页瞬间重塑为 2000 年代初期的经典复古样式。

它不仅仅是一个滤镜，而是一次深度的 UI 逆向工程，带你找回 Windows 98/2000 那个硬朗、方正、充满了 3D 灰色质感的互联网。

---

## 🚀 核心功能

### 1. 🏛️ “手术级”视觉覆盖 (Surgical UI Overhaul)
*   **3D 按钮重塑**：所有按钮恢复为经典的灰色凹凸 3D 效果，带你找回真实的点击感。
*   **排版回归**：强制覆盖现代字体，让 Arial、MS Sans Serif 和 Times New Roman 重新统治屏幕。
*   **绝对直角**：全局消除所有 `border-radius`，无论是图片还是容器，统统回归硬朗的直角风格。

### 2. 📺 CRT 显示器模拟 (CRT Screen Emulation)
*   **扫描线滤镜**：细腻的水平扫描线叠加，模拟老式大头显示器的显像管效果。
*   **色差偏移 (RGB Shift)**：极细微的红蓝溢色效果，增加视觉深度。
*   **高频闪烁**：模拟 60Hz 刷新率时代的微弱屏幕闪烁感，沉浸感十足。

### 3. 🕹️ 经典交互元素 (Classic Elements)
*   **跑马灯公告 (Marquee)**：顶部滚动的欢迎语，内置多条 90 年代经典网页台词。
*   **“正在建设中”挂件**：右下角永远在挖掘的像素小人（Under Construction），是那个时代的灵魂标配。
*   **复古光标**：经典的白色粗边框箭头，以及点击时修长的“复古小手”。
*   **系统滚动条**：重塑 Webkit 滚动条为 Windows 2000 风格的灰色方块。

---

## 🛠️ 技术架构

*   **内核**: Manifest V3 (Chrome Extension API)
*   **注入引擎**: 使用 `background.js` (Service Worker) 配合 `chrome.scripting` 实现动态样式与脚本注入。
*   **样式控制**: 高优先级的 `retro.css` 结合 `all: initial` 隔离技术，确保对百度、GitHub 等复杂站点的强力覆盖。
*   **动态特效**: 采用 **像素级内联 SVG 动画** 代替 GIF，确保在所有浏览器中 100% 还原复古动态，零外部资源依赖。

---

## 📦 安装与开发

### 开发模式安装
1.  下载本仓库代码到本地。
2.  打开 Chrome 浏览器，访问 `chrome://extensions/`。
3.  开启右上角的 **“开发者模式”**。
4.  点击 **“加载已解压的扩展程序”**，选择本项目文件夹。

### 文件结构
*   `manifest.json`: 插件配置文件。
*   `background.js`: 负责状态管理与样式注入的核心 Service Worker。
*   `styles/retro.css`: 定义所有复古视觉规则的超级样式表。
*   `popup/`: 用户交互界面（采用 Win2000 窗口风格设计）。
*   `icons/`: 包含各种尺寸的复古图标。

---

## ⚠️ 隐私声明

*   **不收集任何数据**：本插件纯前端运行，没有任何网络请求发送至第三方服务器。
*   **权限最小化**：仅申请必要的 `scripting` 和 `storage` 权限以实现功能。

---

## 📬 欢迎 Sign My Guestbook!

如果您有任何点子或遇到了 Bug，欢迎提出 Issue。让我们一起完善这个“复古梦境”。

**"Stay Retro, Stay Y2K!"**

---
© 2000-2026 Y2K-ifier Project. Best viewed in 800x600 resolution.
