# 📦 Imaget - Chrome 插件重构架构设计文档

## 1. 项目概述

* **项目名称**: Imaget - 智能图片嗅探与下载插件
* **目标**: 打造一个在任何复杂宿主网页中都能稳定运行、UI 极其精美（达到原生系统级质感）、且 AI 维护成本极低的 Chrome Manifest V3 插件。
* **核心策略**: 彻底分离“嗅探业务逻辑”与“界面渲染”，采用 Shadow DOM 物理隔离防止样式污染。

## 2. 核心技术栈

* **构建工具**: Vite (极简配置，针对 Content Script 统一打包)
* **核心框架**: React 19 + TypeScript (强类型约束，AI 的最佳向导)
* **UI 组件库**: **Mantine v8** (唯一合法的 UI 构建方案，严禁混用其他 CSS 框架)
* **环境隔离**: Shadow DOM (采用 ID 挂载策略，统一 Dev 与 Prod 环境)
* **插件规范**: Chrome Manifest V3

## 3. 严格的目录结构 (High Cohesion, Low Coupling)

项目严格遵循以下结构，AI 在开发时必须遵循职责边界，禁止跨模块污染：

```text
imaget-reborn/
├── public/                 # 静态资源
├── src/
│   ├── core/               # 🧠 [核心业务层] 纯 TS 逻辑，绝对禁止包含 React/UI 代码
│   │   ├── sniffer.ts      # 图片 DOM 解析、URL 提取逻辑
│   │   ├── filter.ts       # 尺寸、比例、格式过滤逻辑
│   │   └── downloader.ts   # 图片打包ZIP与下载逻辑
│   ├── types/              # 🏷️ [类型定义层] 整个项目的核心数据结构
│   │   └── index.ts        
│   ├── ui/                 # 🎨 [视图渲染层] 纯 React+Mantine，绝对禁止在此写复杂业务逻辑
│   │   ├── components/     # 细粒度 Mantine 组件 (Header, FilterBar, ImageGrid, Footer)
│   │   └── App.tsx         # 视图总容器，负责状态流转 (State Management)
│   ├── entry/              # 🚪 [环境注入层]
│   │   ├── content.tsx     # Content Script 入口 (包含 Shadow DOM 挂载黑魔法)
│   │   └── background.ts   # Chrome V3 Service Worker (用于跨域请求或下载 API)
├── index.html              # 🧪 本地极恶劣测试床 (用于验证 Shadow DOM)
├── vite.config.ts          # 构建配置 (输出纯净的 content.js 和 background.js)
└── manifest.json

```

## 4. 核心数据模型 (Types)

全局业务数据必须基于以下 TypeScript 接口进行开发：

```typescript
// src/types/index.ts
export type ImageFormat = 'PNG' | 'JPG' | 'WEBP' | 'SVG' | 'GIF' | 'UNKNOWN';

export interface ImageItem {
  id: string;          // 唯一标识符
  url: string;         // 图片真实地址
  width: number;       // 像素宽
  height: number;      // 像素高
  sizeKB: number;      // 文件大小
  format: ImageFormat; // 图片格式
  isSelected: boolean; // 选中状态
}

export interface FilterOptions {
  minWidth: number;
  minHeight: number;
  excludeKeywords: string;
  searchQuery: string;
  allowedFormats: ImageFormat[];
  sortBy: 'order' | 'size' | 'resolution';
  sortDirection: 'asc' | 'desc';
}

```

## 5. AI 开发绝对禁令与规范 (AI Coding Guidelines)

**致 AI 助手（如 Cursor / Copilot）：在本项目中生成或修改代码时，必须 100% 遵守以下规则，违者将被判定为严重错误！**

### 🚫 【严禁事项 - STOP DOING THIS】

1. **绝对禁止**使用原生 HTML 标签（如 `<div>`, `<span>`, `<button>`, `<table>`）进行页面排版。
2. **绝对禁止**手写任何自定义 CSS 文件、`className`、或者 `style={{...}}` 属性。
3. **绝对禁止**引入 Tailwind CSS 或生成相关类名（如 `flex`, `items-center`）。
4. **绝对禁止**在 Shadow DOM 环境下使用基于 `:root` 的全局变量挂载。

### ✅ 【必须遵循的 Mantine 规范 - DO THIS INSTEAD】

1. **一切皆组件**：所有 UI 必须由首字母大写的 **Mantine v8** 组件拼装而成。
2. **布局对齐**：必须且只能使用 `<Group>`, `<Stack>`, `<Flex>`, `<Grid>`, `<Container>` 来实现布局。
* 横向排列居中必须用：`<Group align="center">`
* 纵向排列必须用：`<Stack gap="md">`


3. **表单与交互**：
* 按钮必须用：`<Button variant="...">` 或 `<ActionIcon>`
* 输入框必须用：`<TextInput>`, `<Select>`, `<Checkbox>`
* 滚动区域必须用：`<ScrollArea>`，严禁出现浏览器原生滚动条。


4. **间距与尺寸**：统一使用 Mantine 的系统 token，如 `p="md"`, `mt="sm"`, `radius="lg"`，严禁硬编码像素值（如 `margin-top: 15px`）。
5. **暗色模式**：UI 默认运行在暗色模式（Dark Mode）下，不要随意硬编码具体的色值（如 `#333`），必须利用 Mantine 的预设色彩体系。

## 6. 开发与调试工作流

1. **UI 与逻辑本地联调**：运行 `npm run dev`，在本地 `index.html` 的高强度污染测试页中打开。只要这里显示完美，生产环境就绝对完美。
2. **打包注入**：运行 `npm run build`，在 Chrome 扩展管理页面加载 `dist` 目录进行最终的端到端测试。

## 7. 核心功能与业务细节 (Functional Requirements)

**致 AI：在编写 `src/core` 目录下的业务逻辑和 `src/ui` 下的组件交互时，必须严格实现以下功能模块：**

### 7.1 核心嗅探引擎 (Sniffer Engine)

负责从宿主网页中全方位提取图片资源。

* **基础提取**：遍历并提取页面中所有的 `<img>` 标签的 `src`、`<picture>` 标签的 `source`、以及带有 `background-image` 的内联样式元素。
* **深度提取（引擎默认）**：
    * **Performance API 追踪**：利用 `performance.getEntriesByType('resource')` 捕捉通过 JS 加载或样式表引用的资源。
    * **Shadow DOM 穿透**：递归遍历页面中的所有 Shadow Root，确保能获取到复杂社交平台（如 Twitter/Instagram）中的图片。
    * **SVG 转换**：支持解析 `<svg>` 节点并将其转化为可下载的图片格式。
* **滚动扫描 (Scroll & Scan)**：顶栏主动触发的自动滚页 + 全量重新嗅探，适配无限流/懒加载页面；与设置中的**跟随嗅探**（用户滚动时被动补图）区分。
    * **智能自动滚动 (Auto Scroll)**：模拟人类滚动行为以加载动态内容后再扫描。

* **元数据获取**：针对提取到的每个 URL，必须计算或获取其实际的**像素尺寸（宽 x 高）**、**文件大小（KB/MB）**和**真实格式（JPG/PNG/WEBP/SVG 等）**，剔除无效的 Base64 占位符或极小像素的埋点图片。

### 7.2 图像处理引擎 (Image Process Engine)

* **工业级 WebP 转换**：内置基于 OffscreenCanvas 的转换引擎，支持在下载前将图片统一转换为 WebP 格式，提高存储效率。
* **批量打包 (JSZip)**：支持将选中的图片在客户端内存中快速生成 `.zip` 压缩包。

### 7.3 顶部过滤与控制台 (Toolbar & Filters)

提供多维度的筛选和视图控制能力，状态变更必须实时反映在图片列表中。

* **文本检索**：
* `Search by URL or name` (输入框)：根据图片的文件名或 URL 路径进行模糊匹配。
* `Exclude keywords` (输入框)：支持以空格分隔的屏蔽词，命中屏蔽词的图片将被隐藏。


* **规格过滤**：
* `Min Width` & `Min Height` (数字输入框)：过滤掉小于指定尺寸的图标或碎图。
* `Format Filter` (多选标签组)：支持只看特定格式（如仅查看 PNG 和 WEBP），默认全选。


* **排序与视图**：
* `Sort by` (下拉菜单)：支持按“网页原始顺序(Order)”、“文件大小(Size)”或“分辨率(Resolution)”排序，支持升序/降序切换。
* `Layout` (图标组按钮)：支持在网格(Grid)、瀑布流(Masonry/Columns)、列表(List)视图间切换。



### 7.4 图片网格展示 (Image Grid & Cards)

用于可视化展示被嗅探到的图片实体，统一采用 **Mantine v8** 标准化 UI 体系。

* **卡片设计细节**：
    * **规范化布局**：居中展示图片缩略图，长条图片需使用 `object-fit: cover` 或 `contain` 保证美观，需处理跨域图片的显示问题。
    * **信息 Badge**：
        * 左上角悬浮深色半透明 Badge：显示分辨率（如 `1920x1080`）和文件大小（如 `1.2 MB`）。
        * 右上角悬浮 Badge：显示文件格式（如 `WEBP`）。
* **交互体验**：
    * **悬浮反馈**：鼠标悬浮（Hover）时，卡片需有明显的阴影或边框提亮反馈。
    * **状态切换**：点击卡片任意区域或 Checkbox，切换图片的选中状态。
    * **强调显示**：选中状态下，卡片需呈现明显的视觉强调（如 Mantine 预设的高亮边框）。

### 7.5 底部操作与下载模块 (Footer & Downloader)

全局状态统计与最终的导出操作。

* **状态统计**：左侧实时显示当前选中数量与总数量（如 `Selected 15 / 50`）。
* **批量选择**：提供 `Select All` (全选当前过滤出的图片) 和 `Deselect All` (取消全选) 功能。
* **打包与下载逻辑**：
* `Download Selected`：触发 Chrome Downloads API，将选中的图片批量下载到本地文件夹。
* `Download as ZIP`：利用 JSZip 等库，将选中的图片在内存中打包压缩成一个 `.zip` 文件后单次下载。
* 在执行下载或打包时，需有明确的 Loading 状态和进度提示，防止用户重复点击。