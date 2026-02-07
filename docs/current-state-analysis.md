# Y2K-ifier 当前状态分析

> 基于当前代码与文档的整理，便于迭代或交接。

---

## 一、项目概览

| 项 | 当前值 |
|----|--------|
| **名称** | Y2K-ifier: 90s Retro Filter & Web Nostalgia (Vaporwave/Glitch) |
| **版本** | 1.0.4（来自 package.json） |
| **类型** | Chrome 扩展，Manifest V3，单一用途（网页视觉复古） |
| **构建** | Vite 5 + Vue 3 + TypeScript，产物 `dist/`，未开启 minify |

---

## 二、功能清单（已实现）

### 弹窗 (Popup)
- 复古模式开关（开/关，持久化 `isEnabled`）
- CRT 扫描线开关（开/关，持久化 `crtEnabled`）
- 「打开主题页」按钮（整行 + 下方快捷键提示）
- 中/英语言切换（English / 中文），持久化 `locale`
- 快捷键提示：Alt+Shift+Y / Mac Option+Shift+Y

### 主题页 (Newtab，兼选项页)
- XP 壁纸背景（`public/images/xp.jpeg`）
- 搜索栏：搜索引擎（谷歌/必应/百度）+ 输入框 + 搜索，持久化 `optionsSearchEngine`
- 怀旧助手（NostalgicAgent）：
  - 50 条预设话术（中英双语），「再说一句」随机切换
  - 「随机推荐一个书签」：读取 `chrome.bookmarks`，随机展示一条并可打开
  - 90s 风格气泡 + 简笔角色形象

### 后台 (Background)
- 根据 `isEnabled` 对普通网页注入/移除 `retro.css`
- 根据 `crtEnabled` 切换 CRT 效果与跑马灯
- `tabs.onUpdated` 在页面加载完成时同步注入
- `chrome.commands.onCommand`：`open_theme` → 新标签打开主题页（默认 Alt+Shift+Y）
- 主题页 URL 通过 `src/constants.ts` 的 `getNewtabUrl()` 统一

### 复古样式 (retro.css)
- 3D 按钮、衬线标题、像素化图片、复古链接/滚动条/光标
- CRT 扫描线、跑马灯、「正在建设中」挂件（在 CRT 开启时）

### 多语言 (i18n)
- 文案：`src/locales/en.ts`、`src/locales/zh-CN.ts`
- 运行时：vue-i18n（runtime 构建，避免 CSP unsafe-eval），locale 存 `chrome.storage.local.locale`
- 入口：popup、newtab 启动时 `getStoredLocale()` 再挂载

### 设计决策（与留存相关）
- **不覆盖新标签页**：无 `chrome_url_overrides.newtab`，用户新标签始终为本地 `chrome://newtab/`
- 主题页通过「打开主题页」或快捷键打开，避免与用户习惯冲突

---

## 三、目录与入口

```
src/
├── background/background.ts   # Service Worker：注入、commands、storage 监听
├── constants.ts               # NEWTAB_PAGE_PATH, getNewtabUrl()
├── i18n.ts                    # createI18n, getStoredLocale, setStoredLocale
├── locales/
│   ├── en.ts                  # 英文（popup/search/agent/settings）
│   └── zh-CN.ts               # 中文，同上
├── popup/                     # 弹窗：popup.html, main.ts, App.vue, popup.css
└── newtab/
    ├── newtab.html, main.ts, App.vue, newtab.css
    └── components/NostalgicAgent.vue

public/
├── icons/                     # 16/48/128
├── images/xp.jpeg            # 主题页壁纸（需自备）
└── styles/retro.css          # 注入用样式
```

- **选项页**：manifest 中 `options_ui.page` 指向 `src/newtab/newtab.html`，与主题页同一页面。
- **无** 独立 `options/` 目录（已移除并复用 newtab）。

---

## 四、文档与规划

| 文档 | 用途 |
|------|------|
| `README.md` | 项目说明、安装与构建、结构、隐私 |
| `openmemory.md` | 架构与组件索引（OpenMemory 用） |
| `docs/chrome-web-store-listing.md` | 商店描述、权限说明、单一用途 |
| `docs/retention-and-ux-thinking.md` | 留存与「好用」思路、改进方向 |
| `docs/deep-analysis-retention-root-causes.md` | 留存深度分析、根因 A/B、假设与验证 |
| `docs/idea-nostalgic-ai-agent.md` | 怀旧 AI 代理（RAG + 90s 语气）概念与 MVP/V1/V2 |
| `docs/mvp-nostalgic-agent-spec.md` | 怀旧助手 MVP 规格（已实现） |
| `docs/optimization-checklist.md` | 优化清单（体验、代码、后续迭代） |

---

## 五、依赖与构建

- **依赖**：vue、vue-i18n；dev：@samrum/vite-plugin-web-extension、@vitejs/plugin-vue、vite、typescript、@types/chrome。
- **脚本**：`npm run build`（构建）、`npm run dev`（watch 构建）。
- **配置要点**：`vite.config.ts` 中 vue-i18n 指向 runtime 构建；`@` 指向 `src/`；build 未 minify，适合开发调试。

---

## 六、可改进点（简要）

- **体验**：主题页打开失败时无提示（已用 `.catch` 静默兜底）；壁纸缺失时仅回退色，可加说明。
- **代码**：搜索配置可抽到 `shared`；上架前可开 minify。
- **后续**：怀旧助手 RAG（见 `idea-nostalgic-ai-agent.md`）、多主题/皮肤、无障碍补充。

---

## 七、一句话总结

**当前状态**：基础开发已完成；具备复古注入、主题页（XP+搜索+50 条话术怀旧助手）、中英双语、快捷键与选项页复用；不覆盖新标签；文档与优化清单齐全，可在此基础上做体验优化或 RAG/多主题等迭代。
