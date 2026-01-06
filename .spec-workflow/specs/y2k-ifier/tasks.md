# 任务列表 - Y2K-ifier

- [x] 1. 初始化项目结构与 Manifest 配置
  - 文件：`manifest.json`, `icons/`
  - 描述：创建 Chrome 扩展的基础配置文件 Manifest V3，声明必要的权限（scripting, storage, activeTab）和入口点。
  - 目的：建立扩展程序的基础架构。
  - _依赖：无_
  - _需求：FR.1, FR.3, NFR.2_
  - _提示：Role: Chrome 扩展开发专家 | Task: 初始化 Chrome Extension Manifest V3 配置文件，确保包含权限声明（scripting, storage, tabs）、action (popup)、background (service_worker) 和 host_permissions。同时准备基础图标占位符 | Restrictions: 必须符合 Manifest V3 标准，严禁使用 V2 语法 | Success: 扩展程序能被 Chrome 成功加载且无报错，权限声明正确。完成任务后，请在 tasks.md 中将此项标记为 [x]，并使用 log-implementation 工具记录。_

- [x] 2. 编写复古样式表 (retro.css)
  - 文件：`styles/retro.css`
  - 描述：实现“手术级”视觉重塑的 CSS，包含按钮 3D 效果、字体覆盖、链接样式、图片滤镜和滚动条重塑。
  - 目的：定义扩展程序的核心视觉灵魂。
  - _依赖：无_
  - _需求：FR.2 (全部)_
  - _提示：Role: 高级前端 CSS 工程师 | Task: 编写 retro.css，使用 !important 确保样式优先级。重点实现：1. 按钮的 outset 3D 边框；2. 标题 Times New Roman 和正文 Arial 覆盖；3. 图片 pixelated 渲染与 sepia 滤镜；4. Windows 2000 风格滚动条 | Restrictions: 严禁改变元素布局（如 width, height, position, display），仅修改装饰性属性 | Success: CSS 选择器覆盖全面且不破坏页面布局。完成任务后，请在 tasks.md 中将此项标记为 [x]，并使用 log-implementation 工具记录。_

- [x] 3. 开发 Popup 用户界面与切换逻辑
  - 文件：`popup/popup.html`, `popup/popup.js`, `popup/popup.css`
  - 描述：创建一个简洁的弹出界面，包含一个复古风格的开关，用于控制复古模式。
  - 目的：提供用户交互入口。
  - _依赖：1. 初始化项目结构_
  - _需求：US.1, FR.4_
  - _提示：Role: UI/UX 开发者 | Task: 开发 Popup 界面。HTML 包含一个 checkbox 开关；JS 负责读取和写入 chrome.storage.local 中的 isEnabled 状态，并向 Service Worker 发送消息 | Restrictions: 界面应保持简洁，符合 2000 年代审美 | Success: 用户点击图标能看到 Popup，切换开关能正确更新存储状态。完成任务后，请在 tasks.md 中将此项标记为 [x]，并使用 log-implementation 工具记录。_

- [x] 4. 实现 Service Worker 状态管理与注入逻辑
  - 文件：`background.js`
  - 描述：编写后台脚本，监听存储变更和标签页更新事件，动态调用 `chrome.scripting` 注入或移除 CSS。
  - 目的：实现样式的自动化和持久化应用。
  - _依赖：1, 2, 3_
  - _需求：US.4, FR.1, FR.3_
  - _提示：Role: 浏览器引擎专家 | Task: 在 background.js 中实现逻辑：1. 监听 chrome.storage.onChanged；2. 监听 chrome.tabs.onUpdated；3. 根据 isEnabled 状态，使用 chrome.scripting.insertCSS 或 removeCSS 作用于当前页面 | Restrictions: 必须处理好 content_scripts 的注入时机，避免重复注入或注入失败 | Success: 切换 Popup 开关时，页面样式能即时变化；刷新页面后复古状态依然保持。完成任务后，请在 tasks.md 中将此项标记为 [x]，并使用 log-implementation 工具记录。_

- [x] 5. 跨站兼容性测试与细节优化
  - 文件：全局测试
  - 描述：在不同类型的现代网页（如社交媒体、新闻、文档）上进行测试，修复样式冲突，优化图片滤镜细节。
  - 目的：确保插件的健壮性和视觉一致性。
  - _依赖：全部开发任务_
  - _需求：US.3, US.5, NFR.3_
  - _提示：Role: QA 工程师 | Task: 在 Google, Wikipedia, Github 等典型站点测试。重点检查：1. 布局是否有偏移；2. 图标字体是否被误伤导致无法显示；3. 复杂背景下的按钮可见度 | Restrictions: 优化过程不得引入破坏性样式 | Success: 插件在主流站点均能表现良好且不破坏功能。完成任务后，请在 tasks.md 中将此项标记为 [x]，并使用 log-implementation 工具记录。_
