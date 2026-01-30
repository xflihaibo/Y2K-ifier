# Chrome 网上应用店上架信息补充

本文档用于填写 Chrome 扩展上架时的**商店列表**、**单一用途说明**及**权限说明**，可直接复制到开发者后台对应字段。

---

## 一、商店列表 (Store Listing)

### 1. 简短说明 (Short description)

**字数限制：132 个字符（含空格）**

**英文（推荐用于主语言）：**
```
Surgically transforms modern web pages into a 2000s retro aesthetic. Toggle Y2K style, CRT scanlines, marquee & theme page with search.
```

**中文（若商店语言选中文）：**
```
将现代网页一键变成 2000 年代复古风格：复古模式、CRT 扫描线、跑马灯与主题页搜索，纯视觉重塑。
```

---

### 2. 详细说明 (Detailed description)

**英文：**

```markdown
**Y2K-ifier** turns today’s web into a nostalgic 2000s look—without changing layout or breaking pages.

**What it does**
- **Retro mode**: Applies classic fonts (Arial, Times New Roman), 3D gray buttons, underlined blue links, pixel-style cursors, and straight edges (no rounded corners) across the page.
- **CRT effect** (optional): Scanlines, subtle flicker, and vignette to mimic an old monitor; includes a marquee bar and “Under Construction” widget.
- **Theme page**: A dedicated options page with your own wallpaper and a search bar. Choose Google, Bing, or Baidu and search in a new tab.

**How it works**
- Click the extension icon to open the popup. Toggle “Retro mode” and “CRT scanlines” on or off. Your choices are saved and apply to all tabs.
- Open the theme page from the popup (“Open theme page”) or via the extension’s Options. Set your wallpaper image (see README for setup) and use the search bar.

**Privacy**
- No data is collected or sent to any server. All settings are stored locally in your browser.
- The extension only injects CSS and minimal script into pages you visit to apply the visual style.

**Single purpose**
This extension has one purpose: to change the visual appearance of web pages to a 2000s retro style. The theme page search is a small, optional convenience and does not change this core purpose.
```

**中文：**

```markdown
**Y2K-ifier** 把现代网页变成 2000 年代复古风格，不改变页面布局，也不破坏原有功能。

**功能概览**
- **复古模式**：为页面应用经典字体（Arial、Times New Roman）、灰色 3D 按钮、蓝色下划线链接、像素风格光标，并去掉圆角。
- **CRT 效果**（可关）：扫描线、轻微闪烁与暗角，模拟老显示器；含跑马灯与“正在建设中”挂件。
- **主题页**：独立选项页，使用您自己的壁纸和搜索栏，可选择谷歌、必应或百度在新标签页中搜索。

**使用方式**
- 点击扩展图标打开弹窗，可开关“复古模式”和“CRT 扫描线”，设置会保存并应用于所有标签页。
- 在弹窗中点击“打开主题页”或通过扩展的“选项”进入主题页，可设置壁纸（见 README）并使用搜索栏。

**隐私**
- 不收集、不上传任何数据，所有设置仅保存在本机浏览器中。
- 扩展仅向您访问的页面注入 CSS 和少量脚本以应用视觉样式。

**单一用途**
本扩展仅用于将网页视觉改为 2000 年代复古风格；主题页搜索为附加小功能，不改变该核心用途。
```

---

### 3. 分类 (Category)

建议选择：

- **Fun**（趣味），或  
- **Productivity**（效率 / 工具）

---

### 4. 宣传图与截图 (Graphics)

| 类型 | 尺寸 | 说明 |
|------|------|------|
| 小图 (Small tile) | 440×280 px | 用于商店列表展示，建议包含：扩展图标 + “Y2K-ifier” + 一句卖点（如 “2000s retro style”）。 |
| 大图 (Marquee, 可选) | 1400×560 px | 用于商店详情顶部横幅，可展示：复古前后对比或主题页 + 搜索栏。 |
| 截图 (Screenshots) | 1280×800 或 640×400 | 至少 1 张，最多 5 张。建议：弹窗开关、开启复古的网页、CRT+跑马灯效果、主题页。 |

---

## 二、单一用途说明 (Single Purpose)

**供审核 / 政策表单使用：**

- **英文**  
  This extension has a single purpose: to apply a 2000s-era retro visual style to web pages (fonts, buttons, links, cursors, optional CRT scanlines and marquee). A theme/options page with a search bar is provided for convenience and does not change this core purpose.

- **中文**  
  本扩展仅有一个用途：为网页应用 2000 年代复古视觉风格（字体、按钮、链接、光标，以及可选的 CRT 扫描线与跑马灯）。提供的主题页与搜索栏为附加便利功能，不改变上述核心用途。

---

## 三、权限说明 (Permission justifications)

| 权限 | 用途说明（可填在开发者后台） |
|------|------------------------------|
| `scripting` | 向用户访问的网页注入复古样式表（CSS）及用于挂件/跑马灯的脚本，以应用视觉效果。 |
| `storage` | 在本地保存用户设置（复古模式开/关、CRT 开/关、主题页搜索引擎选择），不涉及上传。 |
| `tabs` | 在用户开启/关闭复古模式时，对所有标签页应用或移除样式；主题页搜索时在新标签页打开搜索结果。 |
| `activeTab` | 在用户点击扩展图标时访问当前标签页，用于弹窗中切换复古/CRT 时立即生效。 |
| `<all_urls>` (host) | 允许在用户访问的任意网页上注入样式与脚本，以实现全站复古效果。不读取页面内容或向第三方发送数据。 |

---

## 四、隐私与数据处理 (Privacy)

- **是否收集用户数据**：否。  
- **是否将数据发送到外部服务器**：否。  
- **本地存储**：仅使用 `chrome.storage.local` 存储开关状态与主题页搜索引擎选择，数据仅存在于用户设备。  
- **隐私政策**：若不收集个人数据，可在商店“隐私实践”中勾选“不收集数据”；若商店要求提供隐私政策链接，可使用一句说明页，例如：“本扩展不收集、不传输任何用户数据，所有设置仅保存在您的浏览器本地。”并附上项目 README 或单独隐私说明页链接。

---

## 五、支持与链接 (Support)

- **主页 / 项目链接**：可填 GitHub 仓库或项目主页 URL。  
- **支持邮箱**：可填维护者邮箱，用于用户与审核联系。  

---

## 六、版本与更新说明 (Version & What’s new)

**当前版本示例（1.0.2）：**

- 英文：Added theme/options page with custom wallpaper and search bar (Google, Bing, Baidu). Retro mode and CRT toggles; no data collection.  
- 中文：新增主题页，支持自定义壁纸与搜索栏（谷歌/必应/百度）；复古模式与 CRT 开关；不收集数据。

---

填写上架表单时，将上述对应段落复制到 Chrome 开发者后台的“商店列表”“单一用途”“权限说明”等栏目即可。如需根据审核反馈微调措辞，可在本文件中修改后再次提交。
