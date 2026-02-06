# 功能规格：一键复古截图 / 抠图

## 一、功能定义

| 模式 | 说明 | 用户得到 |
|------|------|----------|
| **复古截图** | 对当前标签页可见区域截图，保留已注入的 Y2K 样式（字体、按钮、CRT 等），可选加复古边框/水印 | 一张「整页 Y2K 风格」的图片，可下载或复制 |
| **复古抠图** | 先对选中区域或整页做背景移除（Matting），再叠在复古背景或透明底上，加边框/装饰 | 一张「主体 + 复古背景」的梗图/头像图，可分享 |

二者都满足「可带走的成果」，提升留存与分享动机（见《retention-and-ux-thinking》）。

---

## 二、用户流程（建议）

### 2.1 复古截图（先做）

1. 用户在某网页打开 Y2K 模式，看到复古效果。
2. 点击扩展图标 → 弹窗内出现 **「保存为复古截图」**（或快捷键）。
3. 扩展对**当前标签页可见区域**截图（`chrome.tabs.captureVisibleTab`），此时页面已带 Y2K 样式，截图即复古图。
4. 可选：在扩展内用 Canvas 加一层复古边框/「Best viewed in 800×600」水印。
5. 提供 **下载** 或 **复制到剪贴板**。

### 2.2 复古抠图（后续）

1. 用户点击 **「复古抠图」**，选择：**整页主体** 或 **选中区域**（需在 content script 里支持框选或点击主体）。
2. 扩展截取当前可见区域 → 将图片送入**浏览器本地**抠图模型（如 MODNet/RMBG-1.4，通过 Transformers.js + WebGPU 运行）。
3. 得到前景 mask/alpha → 与复古背景（或透明底 + 复古边框）合成。
4. 输出一张图：**抠出的主体 + 复古风格背景/边框**，可下载或复制。

---

## 三、技术方案

### 3.1 复古截图（不依赖 AI）

| 环节 | 实现 |
|------|------|
| 截图 | `chrome.tabs.captureVisibleTab(tabId)`，得到 data URL 或 blob。 |
| 前置条件 | 当前页已注入 Y2K CSS（用户已开复古模式），截图自然带复古效果。 |
| 边框/水印 | 在 OffscreenCanvas 或 popup/新标签页内 Canvas 绘制边框、文字，再合成。 |
| 输出 | `chrome.downloads.download` 或 Clipboard API（需 `clipboardWrite` 权限）。 |

**权限**：现有 `activeTab` / `tabs` 已可截当前页；若用 `chrome.downloads` 需声明 `downloads`；若复制到剪贴板需 `clipboardWrite`（或通过 user gesture 的 `navigator.clipboard.write`）。

### 3.2 复古抠图（Transformers.js + WebGPU）

| 环节 | 实现 |
|------|------|
| 截图 | 同上，`captureVisibleTab` 得到当前画面。 |
| 抠图 | 在扩展的 offscreen 或新标签页中加载 **Transformers.js**，`device: 'webgpu'`，运行 **MODNet / RMBG-1.4** 等轻量 matting 模型，输入截图 → 输出 alpha/mask。 |
| 合成 | Canvas：原图 × alpha + 复古背景图（或纯色/渐变），再加复古边框。 |
| 输出 | 下载或复制。 |

**依赖**：Transformers.js（或等价 WebGPU 推理库）、MODNet/RMBG 的 ONNX 或兼容格式；模型需放入扩展或从 CDN 按需加载（注意扩展包体积与 CSP）。

**性能**：WebGPU 下轻量 matting 可接近实时，首帧可能略慢（模型加载）。

---

## 四、入口与文案

| 入口 | 文案（示例） |
|------|----------------|
| Popup | 「保存为复古截图」 / 「Save as retro screenshot」 |
| 主题页怀旧助手旁 | 「截一张复古图」 / 「做一张复古抠图」 |
| 快捷键（可选） | 如 Alt+Shift+S：保存当前页为复古截图 |

抠图入口可与截图并列，或放在「高级」里，避免弹窗过重。

---

## 五、分阶段落地

| 阶段 | 内容 | 依赖 |
|------|------|------|
| **Phase 1** | 一键复古截图：`captureVisibleTab` + 可选边框/水印 + 下载或复制 | 无，仅扩展 API |
| **Phase 2** | 引入 Transformers.js + WebGPU，集成 MODNet/RMBG，实现「复古抠图」流程 | Transformers.js、模型文件、WebGPU 兼容性处理 |

建议先上线 **Phase 1**，验证「可带走的成果」对留存和分享的带动，再投入 Phase 2 的模型与性能调优。

---

## 六、与现有架构的关系

- **截图时机**：必须在 Y2K 样式已注入的标签页上截，即用户已在该页打开复古模式。
- **执行位置**：截图由 background 或 popup 调 `chrome.tabs.captureVisibleTab`；Canvas 合成可在 background 的 OffscreenCanvas 或新开的临时页中做，避免阻塞 popup。
- **存储**：仅输出图片（下载/剪贴板），不强制存历史记录；若要做「最近截图」可再用 `chrome.storage.local` 存少量缩略图或 meta。

---

## 七、一句话

**一键复古截图** = 当前页在 Y2K 模式下截可见区域 → 可选加边框/水印 → 下载或复制，实现「可带走的成果」；**复古抠图** = 在同一截图基础上用 **Transformers.js + WebGPU + MODNet/RMBG** 在浏览器内抠图 → 与复古背景合成 → 输出梗图，二者结合可显著强化「做图、分享」的留存逻辑。
