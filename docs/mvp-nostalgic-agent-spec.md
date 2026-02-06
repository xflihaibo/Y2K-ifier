# 怀旧导航代理 MVP 规格（已实现）

## 一、MVP 范围

- **目标**：验证用户是否愿意和「复古助手」对话，不依赖任何 LLM API。
- **内容**：新标签页 = XP 壁纸 + 搜索栏 + 右下角 90s 风格助手；预设话术 + 「随机推荐一个书签」。

---

## 二、文件清单

| 文件 | 作用 |
|------|------|
| `vite.config.ts` | 增加 `permissions: ['bookmarks']`、`chrome_url_overrides.newtab: 'src/newtab/newtab.html'` |
| `src/newtab/newtab.html` | 新标签页 HTML 入口 |
| `src/newtab/main.ts` | 挂载 Vue 应用并引入 newtab.css |
| `src/newtab/newtab.css` | 全局样式（body 等） |
| `src/newtab/App.vue` | 新标签页主界面：XP 壁纸、搜索栏（与选项页一致）、`<NostalgicAgent />` |
| `src/newtab/components/NostalgicAgent.vue` | 怀旧助手：角色形象、气泡文案、预设话术、随机书签按钮 |

---

## 三、交互说明

### 3.1 新标签页

- 用户打开新标签（Ctrl/Cmd+T 或点击 +）→ 显示 **Y2K-ifier 新标签页**（XP 壁纸 + 搜索栏 + 右下角助手）。
- 搜索栏：与选项页相同（谷歌/必应/百度，输入后回车或点「搜索」在新标签打开搜索结果）。

### 3.2 怀旧助手（右下角）

- **气泡**：默认展示一句预设文案（如「您今天看起来不错！」）。
- **角色**：90s 风格 3D 小形象（灰框 + 简笔脸），仅作装饰。
- **「再说一句」**：从预设话术里随机换一句（排除当前句），更新气泡内容。
- **「随机推荐一个书签」**：
  - 调用 `chrome.bookmarks.getTree()`，扁平化得到所有带 `url` 的书签；
  - 随机取一条，气泡内展示「为您随机挑了一个收藏，要不要去看看？」并在下方显示该书签标题（可点击）；
  - 点击标题 → `chrome.tabs.create({ url })` 在新标签打开；
  - 若无书签 → 气泡显示「您还没有书签哦，先去收藏几个网站吧！」

### 3.3 预设话术（无 API）

- 您今天看起来不错！
- 需要我帮您看看书签吗？
- 欢迎来到 90 年代！
- 您有一封新邮件…… 才怪，这是 2026 年啦。
- 最佳体验：Netscape Navigator 4.0。开玩笑的，Chrome 就挺好。

---

## 四、权限与构建

- **新增权限**：`bookmarks`（仅用于读取书签，不上传）。
- **构建**：`npm run build` 会产出 `dist/src/newtab/newtab.html` 及对应 JS/CSS；manifest 中 `chrome_url_overrides.newtab` 指向 `src/newtab/newtab.html`。

---

## 五、后续可做（V1 / V2）

- **V1**：真 RAG + 90s 语气（书签检索 + LLM API + system prompt）。
- **V2**：成长感（对话历史与简单统计存 `chrome.storage.local`，开场或回复引用「上次您问过…」等）。
