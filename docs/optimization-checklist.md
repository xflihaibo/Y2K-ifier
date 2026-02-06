# Y2K-ifier 优化清单

基于当前基础开发完成状态整理的改进点，按**优先级**和**投入**分类。

---

## 一、建议优先做（体验/稳定性）

| 项 | 说明 | 做法 |
|----|------|------|
| **1. 主题页打开失败提示** | 用户网络或权限异常时，`chrome.tabs.create` 可能失败，目前无反馈 | 在 popup 的 `openThemePage()` 里对 `chrome.tabs.create` 加 `.catch(() => {})`，可选：在 popup 内 toast/小字提示「打开失败，请重试」 |
| **2. 新标签页壁纸缺失** | 未放置 `xp.jpeg` 时背景为纯色，用户可能不知道要放图 | 在 `public/images/README.md` 或 newtab 页脚加一句「未检测到壁纸时将使用默认背景」；或保留现有 README 说明即可 |
| **3. 书签权限被拒绝** | 用户若拒绝书签权限，怀旧助手「随机书签」会报错 | 已用 try/catch 显示 `agent.bookmarksError`，可再在 popup 或助手旁加一句「需要书签权限才能随机推荐」引导授权 |

---

## 二、可选优化（代码质量 / 体积）

| 项 | 说明 | 做法 |
|----|------|------|
| **4. 抽离搜索配置** | newtab 内 `SEARCH_ENGINES` + `urls` 仅一处使用，若以后多页复用可抽离 | 新建 `src/shared/searchEngines.ts` 导出 id 列表和 url 映射，newtab 引用 |
| **5. 主题页 URL 常量** | `src/newtab/newtab.html` 在 background 与 popup 中各写一次 | 在 `src/background/background.ts` 或 `src/constants.ts` 中定义 `NEWTAB_PATH = 'src/newtab/newtab.html'`，popup/background 用 `chrome.runtime.getURL(NEWTAB_PATH)` |
| **6. 生产构建压缩** | 当前 `vite.config.ts` 中 `minify: false`，打包体积偏大 | 上架前改为 `minify: true`，或使用 `build.minify: 'terser'` 并设 `terserOptions.compress.drop_console: true` 去掉 console |
| **7. 依赖版本锁定** | `package.json` 中 vue、vue-i18n 等为 `^`，不同环境可能装出不同版本 | 发版前执行 `npm ci` 或使用 `package-lock.json` 保证一致；若需严格一致可考虑去掉 `^` |

---

## 三、后续迭代再考虑

| 项 | 说明 |
|----|------|
| **怀旧助手 RAG** | 接入 LLM API + 书签检索，实现「根据书签回答」与 90s 语气（见 `docs/idea-nostalgic-ai-agent.md`） |
| **多主题/皮肤** | 多套复古 CSS（如霓虹、故障风），存 storage 按选择注入 |
| **新标签页覆盖开关** | 仍无法在「覆盖新标签」时恢复用户本地页，仅能维持当前「不覆盖 + 快捷键」方案 |
| **无障碍** | 怀旧助手按钮可加 `aria-label`；弹窗已有关键 aria，可再按需补全 |

---

## 四、当前无需动

- **CSP**：已用 vue-i18n runtime 构建，无 unsafe-eval。
- **多语言**：中/英齐全，locale 持久化正常。
- **存储**：仅用 `chrome.storage.local`，无上传。
- **权限**：bookmarks 仅用于随机书签，符合最小权限。

---

**总结**：基础功能已完整，优先做 **1～3** 可提升健壮性和体验；**4～7** 按时间做即可；RAG/多主题等留到下一阶段规划。
