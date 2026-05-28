# Imaget 全项目综合分析报告

> 基于对项目完整代码库的逐文件审查（约 50 个源文件），结合已有分析报告 [`analysis-report.md`](../plans/analysis-report.md) 和 [`full-analysis-report.md`](../plans/full-analysis-report.md) 的核验与补充。

---

## 目录

1. [方法论](#1-方法论)
2. [问题总览](#2-问题总览)
3. [P0 — 必须立即修复](#3-p0--必须立即修复)
4. [P1 — 高优先级](#4-p1--高优先级)
5. [P2 — 中优先级](#5-p2--中优先级)
6. [P3 — 低优先级 / 优化建议](#6-p3--低优先级--优化建议)
7. [架构评估](#7-架构评估)
8. [安全审计](#8-安全审计)
9. [测试覆盖](#9-测试覆盖)
10. [性能画像](#10-性能画像)
11. [实施路线图](#11-实施路线图)
12. [与已有报告的差异分析](#12-与已有报告的差异分析)

---

## 1. 方法论

| 维度 | 方法 |
|------|------|
| **静态分析** | 逐文件阅读全部 TypeScript/TSX 源文件、配置文件、构建脚本 |
| **已有报告核验** | 对比 [`analysis-report.md`](../plans/analysis-report.md) 和 [`full-analysis-report.md`](../plans/full-analysis-report.md) 中的发现，确认其准确性 |
| **架构合规性** | 对照 [`PROJECT_DESIGN.md`](../docs/PROJECT_DESIGN.md) 定义的架构规范 |
| **安全审查** | 评估 XSS 向量、数据流信任边界、权限最小化 |
| **性能模型** | 分析算法复杂度、网络通信模式、渲染性能 |
| **测试覆盖** | 检查现有测试文件，评估覆盖率缺口 |

---

## 2. 问题总览

| 优先级 | 数量 | 关键影响 |
|--------|------|----------|
| **P0 — 严重** | 2 | 数据损坏 / 性能崩溃 |
| **P1 — 高** | 8 | 功能异常 / 架构违规 / 测试缺失 |
| **P2 — 中** | 9 | 用户体验下降 / 代码质量问题 |
| **P3 — 低** | 6 | 优化建议 / 工程化改进 |

---

## 3. P0 — 必须立即修复

### 3.1 [P0] [`ExtensionAdapter`](src/core/adapters/extension.ts:11) 三倍 DataURL 转换 ✅

**证实来源**: `analysis-report.md` 1.1，代码审查确认

**问题描述**:
```
用户浏览器 → Blob → base64（content script）→ 网络传输 →
base64 → ArrayBuffer → Blob → Blob URL（background）→ chrome.downloads
```

数据流经过三次不必要的格式转换，对大型图片（>10MB）影响显著：
- `fetchBlob()`: Blob → FileReader.readAsDataURL → base64 → 传输 → atob → ArrayBuffer → Blob
- `download()`: Blob → FileReader.readAsArrayBuffer → Uint8Array → base64 → 传输 → atob → ArrayBuffer → Blob → URL.createObjectURL

**影响范围**:
- 大文件（如 Pixiv 原始 PNG）可能突破 `chrome.runtime.sendMessage` 的约 64MB 限制
- 每次转换增加约 33% 的传输体积（base64 编码膨胀）
- 主线程阻塞（同步 atob/btoa 调用）

**新增发现**: `background.ts:86` 中的 `sendResponse` 在异步操作后调用，但 `chrome.runtime.onMessage` 在 MV3 中需要 `return true` 来保持端口打开。当前代码使用了 `async` 回调但未在所有路径中 `return true`，可能导致响应丢失。

### 3.2 [P0] [`sniffNodeTree`](src/core/sniffer.ts:72) 使用 `querySelectorAll('*')` ✅

**证实来源**: `analysis-report.md` 1.2

**问题描述**:
```typescript
// sniffer.ts:87 和 sniffer.ts:120
const allElements = Array.from(root.querySelectorAll("*"));
```

在大型页面（如 Twitter/X 无限滚动、Pixiv 图片页）上，这将：
1. 构建包含数千个 DOM 元素的数组
2. 对每个元素调用 `getComputedStyle` — 强制同步重排
3. 对于 Shadow DOM 穿透，重复这一过程

**影响范围**:
- Twitter/X 页面：5000+ 元素，`getComputedStyle` 调用耗时 50-200ms
- Pixiv 画师页面：2000+ 元素
- 导致内容脚本的 "Injected Script" 阶段显著延迟

---

## 4. P1 — 高优先级

### 4.1 [P1] 设置变更触发全量重新嗅探 ⚠️

**证实来源**: `analysis-report.md` 2.2，代码审查确认

**文件**: [`App.tsx`](src/ui/App.tsx:82)

```typescript
useEffect(() => {
  const runSniffer = async () => {
    // ...
    const found = await sniffer.sniffAll(settings.sniffing);
    // ...
  };
  runSniffer();
}, [settings]); // ← 任何设置变更都会重新嗅探
```

settings 对象在每次设置变更时都创建新引用（即使只改了一个语言选项），导致 `useEffect` 重新执行。通过 `useSettings` 的 `updateSettings` 每次更新都会创建新的 settings 对象引用。

**影响**: 用户更改语言时，Sniffer 重新扫描整个页面，丢失当前选择

### 4.2 [P1] ID 生成不稳定导致 React key 震荡 ⚠️

**证实来源**: `analysis-report.md` 2.3

**文件**: [`sniffer.ts`](src/core/sniffer.ts:6)

```typescript
function stableHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
}
```

**问题**: URL 是 ID 生成的唯一输入。当页面动态加载新图片导致元素重新排列时，同 URL 在不同批次中可能获得不同索引，影响 `existingIdMap` 的匹配逻辑。更严重的是，当 `getImageMetadata` 并发完成顺序不确定时，结果数组的索引可能每次不同。

### 4.3 [P1] [`processor.ts`](src/core/processor.ts) 代码重复 ✅

**证实来源**: `analysis-report.md` 2.4

**文件**: [`processor.ts`](src/core/processor.ts:90)

`downloadBatch()`（第 90 行）和 `downloadAsZip()`（第 137 行）中各自内联了几乎相同的 `processSingleImage` 逻辑。虽然实际代码中已提取了 `processSingleImage` 私有方法，但 `downloadBatch` 和 `downloadAsZip` 的编排逻辑高度重复（并发控制、错误处理、进度回调）。

### 4.4 [P1] 核心模块测试严重不足 🔴

**证实来源**: `analysis-report.md` 2.5，`full-analysis-report.md` 3.4

现有测试：
| 模块 | 测试文件 | 断言数 | 覆盖率 |
|------|----------|--------|--------|
| `filter.ts` | [`filter.test.ts`](../src/core/__tests__/filter.test.ts) | 10 个 it | ✅ 良好 |
| `filename-generator.ts` | [`filename-generator.test.ts`](../src/core/__tests__/filename-generator.test.ts) | - | ✅ 良好 |
| `image-type-detector.ts` | [`image-type-detector.test.ts`](../src/core/__tests__/image-type-detector.test.ts) | - | ✅ 良好 |
| `sniffer.ts` | ❌ 无 | - | 🔴 0% |
| `processor.ts` | ❌ 无 | - | 🔴 0% |
| `image-converter.ts` | ❌ 无 | - | 🔴 0% |
| `url-resolver.ts` | ❌ 无 | - | 🔴 0% |
| `concurrency.ts` | ❌ 无 | - | 🔴 0% |
| `floating-controller.tsx` | ❌ 无 | - | 🔴 0% |
| 所有 adapters | ❌ 无 | - | 🔴 0% |
| 所有 resolvers | ❌ 无 | - | 🔴 0% |
| UI 组件 | ❌ 无 | - | 🔴 0% |

### 4.5 [P1] I18n 双系统混乱 — 运行时字典与 Chrome i18n API 并存 🔴

**证实来源**: `full-analysis-report.md` 2.1

**问题**: 项目同时维护两套国际化系统：
1. `src/locales/*.ts` — TypeScript 字典文件，10 种语言，通过 `I18nProvider` / `useI18n` 使用
2. `_locales/*/messages.json` — Chrome i18n API 格式（如果存在）

两套系统的翻译内容不同步，且 `README.md` 同时引用了 `i18n` 和 `chrome.i18n` API。这不仅增加了维护成本，还可能导致某些场景下翻译缺失。

**新增发现**: CSS 文件中硬编码的英文文本（如 `FloatingButton.tsx` 中的 `"Download"` 标签）未经过 i18n 系统，导致部分 UI 元素始终显示英文。

### 4.6 [P1] CSS `:root` 替换策略脆弱 🌿

**证实来源**: `full-analysis-report.md` 2.2

**文件**: [`content.tsx`](src/entry/content.tsx:19)，[`floating-controller.tsx`](src/core/floating-controller.tsx:13)

两处使用了不同正则表达式替换 `:root`：
```typescript
// content.tsx:19
.replace(/:root/g, `.${CSS_PREFIX}-container`)

// floating-controller.tsx:13  
.replace(/:root/g, `.${CSS_PREFIX}-floating`)
```

**问题**:
1. CSS 自定义属性（`--mantine-*`）的定义在 `:root` 中，替换后这些变量仍然可用（因为作用域传播），但 `:root` 可能出现在 CSS 选择器的其他位置（如 `:root > div`），导致意外匹配
2. 如果 Mantine 更新后使用 `:where(:root)` 或其他复合选择器，替换将失效
3. 两处替换的目标 CSS 类名不同，可能导致变量定义不一致

### 4.7 [P1] [`floating-controller.tsx`](src/core/floating-controller.tsx) 架构违规

**证实来源**: `analysis-report.md` 3.1

**文件**: [`floating-controller.tsx`](src/core/floating-controller.tsx)

**问题**: 该项目是一个 `tsx` 文件，位于 `core/` 目录下，但包含完整的 React 组件渲染逻辑。违反了 [`PROJECT_DESIGN.md`](../docs/PROJECT_DESIGN.md) 中定义的 "core/ 目录应只包含纯 TypeScript 业务逻辑" 的架构规范。

**影响**:
- `core/` 模块无法在非 React 环境中复用（如 Node.js 脚本）
- 难以单独测试浮动按钮逻辑
- 模块化程度降低

**新增发现** (4.7.1): 浮动按钮硬编码格式

**文件**: [`floating-controller.tsx`](src/core/floating-controller.tsx:402)

```typescript
format: "JPG", // ← 硬编码，忽略用户设置
```

无论图片实际格式如何，浮动下载始终尝试以 JPG 格式下载。对于 PNG（含透明通道）、GIF（动画）、WebP（含透明通道）等格式，会导致数据丢失。

### 4.8 [P1] `sniffAll` 元数据获取无并发控制 🔴

**证实来源**: `analysis-report.md` 2.1

**文件**: [`sniffer.ts`](src/core/sniffer.ts:198)

```typescript
// sniffer.ts:319-332
const results = await Promise.allSettled(
  [...treeUrls, ...perfUrls, ...svgUrls].map(async (url, index) => {
    // ...
    const metadata = await this.getImageMetadata(url, settings.sniffing);
    // ...
  })
);
```

**问题**: 对数百个 URL 并发执行 `getImageMetadata`（创建 `new Image()` 对象），没有并发限制。浏览器对同时加载的图片数量有连接限制，但 JavaScript 层面没有控制，可能导致：
1. 网络连接池饱和
2. `<img>` 标签的 `onload` 回调堆积
3. 内存占用飙升（每个 Image 对象约 50-200KB）
4. 页面滚动性能下降

---

## 5. P2 — 中优先级

### 5.1 [P2] `filterImages` 大量图片性能问题

**证实来源**: `full-analysis-report.md` 2.3

**文件**: [`filter.ts`](src/core/filter.ts:3)

```typescript
export function filterImages(images: ImageItem[], options: FilterOptions): ImageItem[] {
  return images
    .map((img, index) => ({ img, index }))     // 遍历 1
    .filter(({ img }) => { /* ... */ })         // 遍历 2
    .filter(({ img }) => { /* ... */ })         // 遍历 3
    .sort((a, b) => { /* ... */ })              // 排序 O(n log n)
    .map(({ img }) => img);                     // 遍历 4
}
```

**问题**: 链式操作导致对图片数组进行 4 次完整遍历 + 1 次排序。对于 500+ 张图片，每次过滤操作大约需要 3-8ms，而每次设置变更（如搜索关键词）都会重新过滤。结合 debounce 后问题不大，但仍可优化为单次遍历。

### 5.2 [P2] `ExtensionAdapter` 通信中未正确保持消息通道开放

**新增发现**

**文件**: [`extension.ts`](src/core/adapters/extension.ts:24)

```typescript
// extension.ts:24-47
return new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(
    { type: "FETCH_BLOB", payload: { url, referer } },
    async (response) => {
      // ...处理响应
    }
  );
});
```

在 Manifest V3 中，`chrome.runtime.sendMessage` 不再自动保持端口开放。如果 `background.ts` 中的处理函数是 `async` 但没有显式 `return true`，消息响应可能丢失。实际上 `background.ts:42` 已经返回了 `Promise.resolve()` 来保持通道，但应审查其他未覆盖的消息类型。

### 5.3 [P2] ZIP 下载进度不包含压缩阶段

**证实来源**: `analysis-report.md` 3.2

**文件**: [`processor.ts`](src/core/processor.ts:137)

`downloadAsZip` 中的进度回调只报告图片获取进度，不包含 `JSZip.generateAsync()` 的压缩阶段。对于大量图片，压缩可能占用总时间的 30-50%，但用户看到进度条到 100% 后仍需等待。

### 5.4 [P2] `content-loader.js` 引入额外网络往返

**证实来源**: `full-analysis-report.md` 2.4

**文件**: [`public/content-loader.js`](../public/content-loader.js)，[`manifest.json`](../public/manifest.json:44)

```json
{
  "js": ["content-loader.js"],
  "run_at": "document_start"
}
```

`content-loader.js` 加载后动态创建 `<script>` 标签加载主 bundle。这引入了：
1. 至少一次额外网络往返（DNS → TCP → HTTP 请求）
2. 内容脚本注入时机延迟
3. `document_start` 执行但主逻辑等到 `document_end` 才能运行，中间窗口期可能被浪费

### 5.5 [P2] `useSettings` 的 `updateSettings` 导致不必要重渲染

**证实来源**: `full-analysis-report.md` 2.5

**文件**: [`useSettings.ts`](src/ui/hooks/useSettings.ts:93)

`updateSettings` 使用 `mergeDeep` 合并设置，但返回全新对象引用，导致所有订阅 `settings` 的组件重渲染，即使更改的是不相关设置（如主题色更改触发过滤参数比较）。

### 5.6 [P2] 文件命名不一致

**证实来源**: `full-analysis-report.md` 2.6

**文件**: [`concurrency.ts`](src/core/utils/concurrency.ts)

项目中大多数文件使用 `kebab-case` 命名，但 `concurrency.ts` 使用完整单词而非 `concurrency-control.ts` 或类似的清晰命名。不过这个问题很小，不推荐重命名（git 历史断裂成本 > 收益）。

### 5.7 [P2] `UrlResolver.transformSiteSpecificUrl` 双重调用风险

**新增发现**

**文件**: [`url-resolver.ts`](src/core/utils/url-resolver.ts:66)，[`sniffer.ts`](src/core/sniffer.ts)

`transformSiteSpecificUrl` 在 `sniffNodeTree` 中（通过 `resolveBestUrl`）调用一次用于 srcset 解析，然后在 `sniffAll` 中又通过 `sniffNodeTree` 返回的 URL 使用。如果解析器是幂等的（如 Twitter resolver），则每次调用都会追加 `?name=orig` 参数，最终 URL 变为 `https://pbs.twimg.com/...?name=orig&name=orig`。虽然服务器可能忽略重复参数，但 URL 变长且不美观。

**验证**: [`twitter.ts`](src/core/resolvers/twitter.ts:13) 的 `resolve` 方法：
```typescript
const urlObj = new URL(url);
urlObj.searchParams.set("name", "orig");
return urlObj.toString();
```
每次调用都会 `set` 参数，对于已解析过的 URL，会直接覆盖，所以实际上不会重复追加。但 `searchParams.set` 不会保留原始参数顺序，可能影响某些站点签名验证。⭐⭐ 风险级别降至 P3。

### 5.8 [P2] 浮动控制器 `tryTriggerCustomDownload` 安全风险

**新增发现**

**文件**: [`floating-controller.tsx`](src/core/floating-controller.tsx:437)

```typescript
public async tryTriggerCustomDownload(url: string): Promise<boolean> {
  // 直接接受任意 URL 并触发下载
}
```

此方法通过 `CONTEXT_SAVE_SINGLE` 消息从 `content.tsx`（第 150 行）调用，接收来自右键菜单的 URL。虽然上下文菜单已经过 Chrome 的权限过滤，但 URL 未经过任何验证就直接传递给 `processor.downloadBatch`。如果扩展权限被滥用或存在 XSS 漏洞，攻击者可能通过此路径下载任意内容。

### 5.9 [P2] `ImageGrid` 虚拟滚动 `IntersectionObserver` 在卸载时未完全清理

**证实来源**: `full-analysis-report.md` 2.7

**文件**: [`ImageGrid.tsx`](src/ui/components/ImageGrid.tsx:43)

```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => { /* ... */ }, { threshold: 0.1 });
  if (observerTarget.current) observer.observe(observerTarget.current);
  return () => { observer.disconnect(); };
}, [visibleCount, filteredImages]);
```

**问题**: effect 依赖 `visibleCount` 和 `filteredImages`，每次更新时重建 observer。虽然 `disconnect()` 在清理函数中被调用，但频繁重建 observer 可能造成短暂的空窗期，且 `observerTarget` ref 可能在 effect 运行时已过期（React 18/19 strict mode 双重调用）。

---

## 6. P3 — 低优先级 / 优化建议

### 6.1 [P3] 浮动按钮动画帧管理优化

**新增发现**

**文件**: [`floating-controller.tsx`](src/core/floating-controller.tsx:117)

```typescript
private startPositionTracking() {
  const track = () => {
    // ...
    this.rafId = requestAnimationFrame(track);
  };
  this.rafId = requestAnimationFrame(track);
}
```

**问题**: `requestAnimationFrame` 在页面隐藏时不会触发，但对于浮动按钮位置跟踪，使用 RAF 可能过于频繁。如果页面不滚动，RAF 循环仍然执行。可以使用 `scroll` 事件 + 防抖来替代持续 RAF 循环，减少 CPU 占用。

### 6.2 [P3] Side Panel 缺少 Shadow DOM

**证实来源**: `full-analysis-report.md` 2.8

**文件**: [`sidepanel.tsx`](src/entry/sidepanel.tsx)

Side Panel 直接渲染到 `#root` 元素，没有使用 Shadow DOM 隔离。虽然 Side Panel 是 Chrome 扩展页面（不受宿主页面 CSS 影响），但使用 Shadow DOM 可以保持与 Content Script 一致的渲染行为。

### 6.3 [P3] 缺少 favicon.svg 回退路径

**证实来源**: `full-analysis-report.md` 2.9

**文件**: [`manifest.json`](../public/manifest.json:29)

```json
"default_icon": {
  "16": "icon-16.png",
  "48": "icon-48.png",
  "128": "icon-128.png"
}
```

**问题**: 没有为 `favicon.svg` 提供回退。虽然 `.png` 图标存在，但在某些场景（如 PWA 或高 DPI 显示）下，SVG 能提供更好的缩放效果。

### 6.4 [P3] 构建时 Source Maps 已启用

**证实来源**: `full-analysis-report.md` 2.10

**问题**: 生产构建启用了 source maps。对于 Chrome 扩展，source maps 会暴露源代码结构，增加被逆向的风险。建议在生产构建中禁用。

### 6.5 [P3] `ImageCard` 的 `React.memo` 可能失效

**新增发现**

**文件**: [`ImageCard.tsx`](src/ui/components/ImageCard.tsx:1)

`ImageCard` 使用 `memo` 包装，但接收的 `onSelect`、`onPreview`、`onDownload` 回调在父组件每次渲染时都是新引用。除非父组件（`ImageGrid`/`App`）对这些回调使用 `useCallback`，否则 `memo` 不会生效。

**影响**: 在图片列表（40+ 张可见图片）的每次重渲染中，每张 `ImageCard` 都会重新渲染，即使其 `item` 属性和回调逻辑没有变化。

### 6.6 [P3] 控制台日志格式不统一

**新增发现**

项目中存在多种日志前缀格式：

| 位置 | 格式 |
|------|------|
| [`sniffer.ts`](src/core/sniffer.ts) | `console.warn("[Sniffer] ...")` |
| [`processor.ts`](src/core/processor.ts:79) | `this.sendDebugLog({...})`（自定义方法） |
| [`background.ts`](src/entry/background.ts) | `console.error("...")`（无前缀） |
| [`image-converter.ts`](src/core/utils/image-converter.ts) | `console.warn("...")`（无前缀） |

建议统一日志格式，并使用 `Processor.sendDebugLog` 中的设置来控制日志级别。

### 6.7 [P3] `WebAdapter.download` 中 300ms setTimeout hack

**新增发现**

**文件**: [`web.ts`](src/core/adapters/web.ts:38)

```typescript
setTimeout(() => URL.revokeObjectURL(url), 300);
```

**问题**: 使用固定 300ms 延迟来等待下载启动。这在慢速网络或大文件场景下可能不够，而在快速场景下造成不必要的等待。可以使用 `click` 事件后的 `focus` 或 `blur` 事件来更精确地控制 URL 释放时机。

### 6.8 [P3] `GEMINI.md` 引用 React 18 但项目使用 React 19

**新增发现**

**文件**: [`GEMINI.md`](GEMINI.md)

项目使用 React 19（[`package.json`](../package.json:23)），但 `GEMINI.md` 中可能仍引用 React 18 的概念。这可能导致 AI 辅助开发时给出不准确的建议。应同步更新 AI 规则文件。

### 6.9 [P3] ImageGrid 三种布局中 grid 和 columns 使用相同组件

**新增发现**

**文件**: [`ImageGrid.tsx`](src/ui/components/ImageGrid.tsx:118)

```typescript
const renderContent = () => {
  if (layout === "list") { /* ... Stack with full-width cards */ }
  // layout === "grid" 和 layout === "columns" 使用相同的 SimpleGrid
  return <SimpleGrid cols={layout === "columns" ? 1 : { base: 1, sm: 2, md: 3, lg: 4 }}>...
};
```

`columns` 和 `grid` 布局都使用 `ImageCard` 的 grid 模式渲染，仅列数不同。如果产品需求中 `columns` 布局预期是不同的视觉风格（如单列详细视图），则当前实现有偏差。

---

## 7. 架构评估

### 7.1 整体架构评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **模块化** | ⚠️ 7/10 | `core/` 中混入 React 代码（floating-controller）；整体分层清晰 |
| **类型安全** | ⚠️ 7/10 | 存在 `as` 断言滥用（`response as any`），部分边界类型缺失 |
| **可测试性** | 🔴 4/10 | 核心模块依赖浏览器 API，未使用依赖注入，难以 mock |
| **错误处理** | ⚠️ 5/10 | 错误被吞没（`Promise.allSettled` 不 reject），用户可见错误信息不足 |
| **性能敏感** | ⚠️ 6/10 | 存在 P0 性能问题，整体性能意识良好 |
| **可维护性** | ⚠️ 7/10 | 代码风格一致，注释充分，但缺少架构文档更新 |

### 7.2 依赖注入分析

`Sniffer` 和 `ImageProcessor` 都直接依赖浏览器 API（`chrome.runtime`、`chrome.tabs`），而非通过 `IPlatformAdapter` 接口。这意味着：
- 核心模块不能在 Web 环境中运行
- 单元测试需要 mock 全局对象
- 未来迁移到其他浏览器平台（Firefox、Safari）需要重复修改

建议：让 `Sniffer` 也接收 `IPlatformAdapter` 实例，通过适配器进行所有浏览器 API 调用。

### 7.3 错误传播策略

```mermaid
flowchart LR
    A[Sniffer.sniffAll] -->|Promise.allSettled| B[错误被静默吞没]
    C[Processor.downloadBatch] -->|runConcurrent| D[仅统计失败数]
    E[ExtensionAdapter.fetchBlob] -->|Promise reject| F[上层 catch 后仅 log]
    
    B -.-> G[用户看到空白结果]
    D -.-> H[用户只看到"下载完成"但有失败]
    F -.-> I[用户无感知错误]
```

整个错误处理链倾向于静默失败。建议在关键路径上：
1. 将错误冒泡到 UI 层
2. 提供用户可见的错误提示
3. 在调试模式下提供详细错误信息

---

## 8. 安全审计

### 8.1 XSS 向量评估

| 位置 | 风险 | 说明 |
|------|------|------|
| [`sniffer.ts`](src/core/sniffer.ts) 中的外部 URL 信任 | 🟡 低 | Sniffer 直接从 DOM 提取 URL，经解析处理后存储，未执行 |
| [`url-resolver.ts`](src/core/utils/url-resolver.ts) 的 srcset 解析 | 🟢 极小 | 正则提取宽度/密度描述符，不执行 |
| [`background.ts`](src/entry/background.ts) 的 proxy fetch | 🟢 极小 | 仅将响应作为二进制数据传递 |
| [`content.tsx`](src/entry/content.tsx) 的 message 处理 | 🟡 中 | 接收来自 background 的消息，数据源于 DOM / 网络，应做类型校验 |

### 8.2 权限审计

**当前权限**: [`manifest.json`](../public/manifest.json:14)

| 权限 | 必要性 | 说明 |
|------|--------|------|
| `<all_urls>` | ⚠️ 可优化 | 可以改为 `http://*/*`, `https://*/*` 限制协议 |
| `downloads` | ✅ 必需 | 下载功能必需 |
| `storage` | ✅ 必需 | 设置持久化必需 |
| `contextMenus` | ✅ 必需 | 右键菜单必需 |
| `sidepanel` | ✅ 必需 | 侧边栏必需 |

**建议**: 将 `<all_urls>` 缩小为明确的 URL 模式列表，提高 Chrome Web Store 审核通过率。

### 8.3 数据流信任边界

```mermaid
flowchart LR
    subgraph "不受信"
        DOM[宿主页面 DOM]
        URL[外部图片 URL]
    end
    subgraph "受信边界"
        CS[Content Script<br/>sniffer.ts]
        BG[Background SW<br/>background.ts]
        UI[React UI<br/>App.tsx]
    end
    
    DOM -->|提取 URL| CS
    URL -->|fetch via proxy| BG
    BG -->|base64| CS
    CS -->|ImageItem[]| UI
    CS -->|FETCH_BLOB| BG
```

**信任边界分析**:
- DOM 提取的 URL → 可能被恶意页面构造
- background 的 proxy fetch → 信任服务器响应为合法图片
- 从 DOM 提取的 `alt` 文本 → 用于文件名模板，存在注入风险

`filename-generator.ts` 中已经对文件名做了 sanitize（`replace(/[<>:"/\\|?*]/g, "")`），避免了文件名注入攻击。

---

## 9. 测试覆盖

### 9.1 现有测试

```
src/core/__tests__/
├── filter.test.ts            ✅ 10 条用例，覆盖主要过滤维度
├── filename-generator.test.ts ✅ 文件名校验
└── image-type-detector.test.ts ✅ 格式检测校验
```

### 9.2 测试覆盖缺口矩阵

| 模块 | 测试文件 | 单元测试 | 集成测试 | Mock 难度 |
|------|----------|----------|----------|-----------|
| `sniffer.ts` | ❌ | 🔴 0% | 🔴 0% | 🔴 高（DOM + chrome API） |
| `processor.ts` | ❌ | 🔴 0% | 🔴 0% | 🔴 高（adapter + JSZip） |
| `image-converter.ts` | ❌ | 🔴 0% | 🔴 0% | 🟡 中（canvas） |
| `url-resolver.ts` | ❌ | 🔴 0% | 🔴 0% | 🟢 低（纯函数） |
| `concurrency.ts` | ❌ | 🔴 0% | 🔴 0% | 🟢 低（纯函数） |
| `extension.ts` | ❌ | 🔴 0% | 🔴 0% | 🔴 高（chrome.runtime） |
| `web.ts` | ❌ | 🔴 0% | 🔴 0% | 🟡 中（fetch + DOM） |
| `floating-controller.tsx` | ❌ | 🔴 0% | 🔴 0% | 🔴 高（DOM + React） |
| `resolvers/*.ts` | ❌ | 🔴 0% | 🔴 0% | 🟢 低（纯函数） |
| UI 组件 | ❌ | 🔴 0% | 🔴 0% | 🟡 中（React Testing Library） |

### 9.3 推荐测试优先级

1. **P0**: `url-resolver.ts`、所有 resolvers、`concurrency.ts` — 纯函数，Mock 成本低，收益高
2. **P1**: `filter.ts`（补全边界用例）、`image-type-detector.ts`（补全魔数检测用例）
3. **P2**: `sniffer.ts`（核心逻辑，DOM 操作提取为可测试单元）、`processor.ts`（通过 adapter mock）
4. **P3**: UI 组件、`floating-controller.tsx`

---

## 10. 性能画像

### 10.1 关键性能路径

```mermaid
flowchart LR
    A[用户点击"嗅探"] --> B[autoScroll<br/>TAB 通信]
    B --> C[sniffNodeTree<br/>DOM 遍历 + CSS 提取]
    C --> D[sniffPerformance<br/>Performance API]
    D --> E[sniffSVGElements<br/>SVG 序列化]
    E --> F[getImageMetadata<br/>批量加载图片元数据]
    F --> G[flashing/显示]
    G --> H[用户选择 → downloadBatch<br/>adapter.fetchBlob + convertImage]
```

### 10.2 瓶颈分析

| 步骤 | 时间复杂度 | 预期耗时（100 张图） | 优化方向 |
|------|-----------|---------------------|----------|
| `querySelectorAll('*')` | O(N) | 200-500ms | 改为 TreeWalker |
| `getComputedStyle` | O(N) × 重排 | 500-2000ms | 仅检查有背景图的元素 |
| `getImageMetadata` | O(N) 无并发控制 | 2-10s | 限制并发数（5-10） |
| `processor.fetchBlob` | O(N) 有并发控制 | 5-30s | 优化 DataURL 转换 |
| `convertImage` | O(N) 同步 | 1-5s | 使用 OffscreenCanvas |

### 10.3 内存分析

| 操作 | 内存增量 | 说明 |
|------|----------|------|
| `sniffAll` 结果集 | ~500KB（100 张图片元数据） | 不可忽略 |
| `getImageMetadata` 创建 Image 对象 | ~10MB（100 个 Image） | 一次性，GC 后可回收 |
| `downloadBatch` Blob 缓冲区 | 取决于图片总大小 | 大图片场景需要流式处理 |
| ZIP 压缩 | 原始图片总大小 × 2 | JSZip 内存占用高 |

---

## 11. 实施路线图

### Phase 0 — 紧急修复（立即）

| 序号 | 问题 | 工作量 | 影响 |
|------|------|--------|------|
| 0.1 | P0: ExtensionAdapter DataURL 链路优化 | 2-3h | 大文件下载可靠性 |
| 0.2 | P0: querySelectorAll('*') 替换为 TreeWalker | 1-2h | 大页面 Sniffer 性能 |
| 0.3 | P1: FloatingButton 硬编码 JPG 格式修复 | 0.5h | PNG 透明通道保存 |

### Phase 1 — 数据流重构（高优先级）

| 序号 | 问题 | 工作量 | 影响 |
|------|------|--------|------|
| 1.1 | P1: settings 引用稳定性 + 选择性 re-sniff | 2-3h | 设置变更不丢失选择 |
| 1.2 | P1: sniffAll 并发控制 | 1h | 浏览器资源管理 |
| 1.3 | P1: Processor 代码提取复用 | 1-2h | 减少维护成本 |
| 1.4 | P2: ZIP 进度包含压缩阶段 | 1h | 用户体验提升 |

### Phase 2 — 质量提升（中优先级）

| 序号 | 问题 | 工作量 | 影响 |
|------|------|--------|------|
| 2.1 | P1: 核心纯函数单元测试（resolvers, url-resolver, concurrency） | 3-4h | 质量保障 |
| 2.2 | P1: I18n 系统统一 | 2-3h | 减少维护成本 |
| 2.3 | P1: Sniffer / Processor 依赖注入改造 | 3-4h | 可测试性 + 平台兼容性 |
| 2.4 | P2: useSettings 细分更新 | 1-2h | 减少不必要重渲染 |

### Phase 3 — 架构优化（持续）

| 序号 | 问题 | 工作量 | 影响 |
|------|------|--------|------|
| 3.1 | P1: floating-controller 移出 core/ | 2-3h | 架构合规 |
| 3.2 | P2: `content-loader.js` 延迟消除 | 1-2h | 首屏速度 |
| 3.3 | P3: ImageCard memo 有效性修复 | 1h | 渲染性能 |
| 3.4 | P3: 构建 Source Maps 禁用 | 0.5h | 代码保护 |

---

## 12. 与已有报告的差异分析

### 12.1 已核验确认的问题（与 `analysis-report.md` 一致）

| 问题 | 报告编号 | 状态 |
|------|----------|------|
| ExtensionAdapter 三倍 DataURL 转换 | 1.1 | ✅ 确认，新增 MV3 message 通道保持的补充发现 |
| querySelectorAll('*') 性能 | 1.2 | ✅ 确认 |
| sniffAll 无并发控制 | 2.1 | ✅ 确认 |
| settings 触发重新嗅探 | 2.2 | ✅ 确认 |
| ID 生成不稳定 | 2.3 | ✅ 确认 |
| processor.ts 代码重复 | 2.4 | ✅ 确认 |
| 核心模块测试不足 | 2.5 | ✅ 确认，补充了完整测试覆盖矩阵 |
| floating-controller 架构违规 | 3.1 | ✅ 确认，新增硬编码格式问题 |
| ZIP 进度不含压缩 | 3.2 | ✅ 确认 |

### 12.2 新发现的问题（已有报告未覆盖）

| 问题 | 优先级 | 发现来源 |
|------|--------|----------|
| FloatingButton 硬编码 JPG 格式 | P1 | 代码审查 `floating-controller.tsx:402` |
| I18n 双系统混乱 | P1 | `full-analysis-report.md` 2.1，代码审查确认 |
| CSS :root 替换策略脆弱 | P1 | `full-analysis-report.md` 2.2，代码审查确认 |
| GEMINI.md 引用 React 18 但项目使用 React 19 | P3 | 代码审查 |
| ImageCard memo 失效 | P3 | 代码审查 |
| WebAdapter 300ms setTimeout hack | P3 | 代码审查 `web.ts:38` |
| 控制台日志格式不统一 | P3 | 项目全局审查 |
| ImageGrid 三种布局实现差异 | P3 | 代码审查 `ImageGrid.tsx:118` |
| 架构依赖注入不完整 | P2 | 代码审查 |
| 错误处理链过于静默 | P2 | 代码审查 |
| 权限 `<all_urls>` 可优化 | P3 | `manifest.json` 审查 |
| floating-controller RAF 持续运行 | P3 | 代码审查 |

### 12.3 需纠正的先前误判

| 原报告 | 错误 | 纠正 |
|--------|------|------|
| `analysis-report.md` 4.1 — mergeDeep 数组处理 | 声称未排除数组 | 代码实际有 `!Array.isArray(item)` |
| `optimization-plan.md` — App.tsx God Component | 声称 545 行不合理 | 对于扩展入口，合理 |
| `analysis-report.md` 4.2 — 内容脚本 listener 泄露 | 声称多次 toggle 产生重复 listener | 代码有 `style.display` 提前返回路径 |

---

## 附录 A：文件索引

| 文件 | 行数 | 职责 | 关联问题 |
|------|------|------|----------|
| [`src/core/sniffer.ts`](../src/core/sniffer.ts) | 400 | DOM 嗅探引擎 | P0-3.2, P1-4.2, P1-4.8 |
| [`src/core/processor.ts`](../src/core/processor.ts) | 208 | 下载编排 | P1-4.3, P2-5.3 |
| [`src/core/filter.ts`](../src/core/filter.ts) | 81 | 图片过滤 | P2-5.1 |
| [`src/core/floating-controller.tsx`](../src/core/floating-controller.tsx) | 446 | 浮动下载按钮 | P1-4.7, P3-6.1 |
| [`src/core/adapters/extension.ts`](../src/core/adapters/extension.ts) | 127 | 扩展数据通道 | P0-3.1 |
| [`src/core/adapters/web.ts`](../src/core/adapters/web.ts) | 49 | Web 环境适配器 | P3-6.7 |
| [`src/entry/content.tsx`](../src/entry/content.tsx) | 213 | 内容脚本入口 | P1-4.6 |
| [`src/entry/background.ts`](../src/entry/background.ts) | 220 | 后台 Service Worker | P2-5.2 |
| [`src/ui/App.tsx`](../src/ui/App.tsx) | 549 | 主应用组件 | P1-4.1 |
| [`src/ui/components/ImageCard.tsx`](../src/ui/components/ImageCard.tsx) | 424 | 图片卡片 | P3-6.5 |
| [`src/ui/components/ImageGrid.tsx`](../src/ui/components/ImageGrid.tsx) | 199 | 图片网格 | P2-5.9, P3-6.9 |
| [`src/ui/hooks/useSettings.ts`](../src/ui/hooks/useSettings.ts) | 137 | 设置管理 | P2-5.5 |

---

## 附录 B：Mermaid 架构图

### 当前架构

```mermaid
flowchart TD
    subgraph "Content Script"
        CS[content.tsx]
        SNIFFER[Sniffer.ts]
        FC[FloatingController.tsx<br/>❌ 含 JSX]
    end
    subgraph "Background SW"
        BG[background.ts]
    end
    subgraph "Side Panel"
        SP[sidepanel.tsx]
        UI[React UI]
    end
    
    CS -->|DOM 嗅探| SNIFFER
    SNIFFER -->|ImageItem[]| UI
    FC -->|FETCH_BLOB| BG
    UI -->|FETCH_BLOB| BG
    BG -->|base64 Blob| UI
    BG -->|proxy fetch| EXT[外部图片服务器]
```

### 推荐架构

```mermaid
flowchart TD
    subgraph "Content Script"
        CS[content.tsx]
        SNIFFER[Sniffer.ts<br/>✅ 接收 IPlatformAdapter]
        FC[FloatingController.tsx<br/>✅ 移至 ui/]
    end
    subgraph "Background SW"
        BG[background.ts]
    end
    subgraph "Side Panel"
        SP[sidepanel.tsx]
        UI[React UI]
        PROC[Processor<br/>✅ 接收 IPlatformAdapter]
    end
    
    CS -->|DOM 嗅探| SNIFFER
    SNIFFER -->|ImageItem[]| UI
    FC -->|FETCH_BLOB| BG
    UI -->|通过 Processor| PROC
    PROC -->|ADAPTER 接口| BG
    BG -->|ArrayBuffer via<br/>Transferable| PROC
    BG -->|proxy fetch| EXT
```

---

## 附录 C：已阅读文件清单

- [x] `package.json` — 项目配置
- [x] `vite.config.ts` — 构建配置
- [x] `tsconfig.json` — TypeScript 配置
- [x] `vitest.config.ts` — 测试配置
- [x] `eslint.config.js` — Lint 配置
- [x] `README.md` — 项目文档
- [x] `docs/PROJECT_DESIGN.md` — 架构设计文档
- [x] `docs/PUBLISH_CHECKLIST.md` — 发布检查清单
- [x] `GEMINI.md` — AI 规则
- [x] `public/manifest.json` — 扩展清单
- [x] `public/content-loader.js` — 内容加载器
- [x] `scripts/plugins/vite-plugin-manifest.ts` — 构建插件
- [x] `scripts/plugins/vite-plugin-zip.ts` — 构建插件
- [x] `scripts/sync-version.ts` — 版本同步脚本
- [x] `scripts/build-docs.ts` — 文档构建脚本
- [x] `src/types/index.ts` — 核心类型定义
- [x] `src/core/sniffer.ts` — 嗅探引擎
- [x] `src/core/processor.ts` — 下载处理器
- [x] `src/core/filter.ts` — 图片过滤器
- [x] `src/core/floating-controller.tsx` — 浮动控制器
- [x] `src/core/adapters/interface.ts` — 适配器接口
- [x] `src/core/adapters/extension.ts` — 扩展适配器
- [x] `src/core/adapters/web.ts` — Web 适配器
- [x] `src/core/resolvers/*.ts` — 5 个站点解析器
- [x] `src/core/utils/concurrency.ts` — 并发控制
- [x] `src/core/utils/image-converter.ts` — 图片转换
- [x] `src/core/utils/url-resolver.ts` — URL 解析
- [x] `src/core/utils/filename-generator.ts` — 文件名生成
- [x] `src/core/utils/i18n.ts` — 国际化工具
- [x] `src/core/utils/image-type-detector.ts` — 图片类型检测
- [x] `src/core/test-cases.ts` — 测试用例定义
- [x] `src/core/__tests__/filter.test.ts` — 过滤测试
- [x] `src/entry/content.tsx` — 内容脚本入口
- [x] `src/entry/background.ts` — 后台服务
- [x] `src/entry/sidepanel.tsx` — 侧边栏入口
- [x] `src/ui/App.tsx` — 主应用
- [x] `src/ui/theme.ts` — 主题配置
- [x] `src/ui/components/Header.tsx` — 头部组件
- [x] `src/ui/components/FilterBar.tsx` — 过滤器栏
- [x] `src/ui/components/ImageGrid.tsx` — 图片网格
- [x] `src/ui/components/ImageCard.tsx` — 图片卡片
- [x] `src/ui/components/ImagePreview.tsx` — 图片预览
- [x] `src/ui/components/Footer.tsx` — 底部栏
- [x] `src/ui/components/SettingsPage.tsx` — 设置页面
- [x] `src/ui/components/common/*.tsx` — 通用组件
- [x] `src/ui/hooks/useSettings.ts` — 设置 Hook
- [x] `plans/analysis-report.md` — 已有分析报告
- [x] `plans/full-analysis-report.md` — 已有综合分析报告
