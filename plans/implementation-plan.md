# Imaget 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按优先级修复 Imaget 项目中发现的问题，从 P0 阻塞性问题开始逐步推进。

**约束：** 浮窗按钮 [`FloatingButton.tsx`](src/ui/components/FloatingButton.tsx) 的外观样式**禁止修改**，只允许改动功能逻辑层面的代码。

**Tech Stack:** React 19, TypeScript, Vite, Mantine v8, Vitest (待安装), Chrome Extension MV3

---

## 文件变更总览

### 新文件
| 文件 | 职责 |
|------|------|
| `vitest.config.ts` | Vitest 测试框架配置 |
| `src/core/__tests__/filter.test.ts` | filter 函数单元测试 |
| `src/core/__tests__/filename-generator.test.ts` | 文件名生成器单元测试 |
| `src/core/__tests__/image-type-detector.test.ts` | 图片类型检测单元测试 |
| `src/core/__tests__/image-converter.test.ts` | 图片转换器单元测试 |
| `src/core/__tests__/i18n.test.ts` | i18n 工具函数单元测试 |
| `src/core/utils/concurrency.ts` | 公共并发执行器 |
| `src/core/utils/date-format.ts` | 日期格式化工具函数 |
| `src/ui/components/ErrorBoundary.tsx` | React Error Boundary 组件 |
| `src/types/i18n-keys.ts` | i18n key 校验脚本（或 `scripts/check-i18n.ts`）|

### 修改文件
| 文件 | 变更内容 |
|------|---------|
| `package.json` | 添加 `vitest` 依赖和 `npm run test` 脚本 |
| `tsconfig.json` | 添加 vitest 类型引用 |
| `src/core/processor.ts` | 抽取公共并发执行器，消除重复 |
| `src/core/utils/filename-generator.ts` | 导出 `formatDate` 供 processor 使用 |
| `src/core/utils/image-converter.ts` | 修复内存泄漏（显式清理 canvas/image） |
| `src/core/sniffer.ts` | 修复错误处理（reject 带错误信息） |
| `src/core/floating-controller.tsx` | 替换虚假进度模拟为真实回调数据（仅改数据流不改 UI） |
| `src/ui/App.tsx` | 添加 Error Boundary，优化 useEffect 依赖，稳定化回调 |
| `src/ui/components/ImageGrid.tsx` | 修复 unsafe flushSync |
| `src/ui/components/ImageGrid.tsx` | 替换硬编码中文为 i18n |
| `src/ui/components/SettingsPage.tsx` | 替换硬编码中文为 i18n |
| `src/ui/hooks/useSettings.ts` | 强化类型安全（any -> 泛型） |
| `src/entry/content.tsx` | 移除 eslint-disable 注释，修复类型 |
| `src/entry/background.ts` | 修复空 catch 吞错误 |
| `src/core/adapters/web.ts` | 替换 300ms timeout hack |
| `docs/PROJECT_DESIGN.md` | 清理 AI 对话残留，同步版本号 |

---

## Task 1: 安装测试框架 + 配置

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: 安装 Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
  },
});
```

- [ ] **Step 3: 更新 tsconfig.json 添加 vitest 类型**

在 `tsconfig.json` 的 `compilerOptions.types` 中添加 `"vitest/globals"`：

```json
{
  "compilerOptions": {
    "types": ["chrome", "vite/client", "vitest/globals"]
  }
}
```

- [ ] **Step 4: 更新 package.json 添加 test 脚本**

在 `scripts` 中添加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: 验证安装**

```bash
npm run test
```
Expected: No test files found, exit 0 (正常退出)

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json tsconfig.json
git commit -m "chore: add vitest test framework"
```

---

## Task 2: filterImages 单元测试

**Files:**
- Create: `src/core/__tests__/filter.test.ts`
- Reference: `src/core/filter.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect } from 'vitest';
import { filterImages } from '../filter';
import type { ImageItem, FilterOptions } from '../../types';

const makeImage = (overrides: Partial<ImageItem> & { url: string }): ImageItem => ({
  id: 'test',
  width: 100,
  height: 100,
  sizeKB: 10,
  format: 'PNG' as const,
  isSelected: false,
  ...overrides,
});

const defaultOptions: FilterOptions = {
  minWidth: 0,
  minHeight: 0,
  excludeKeywords: '',
  searchQuery: '',
  allowedFormats: [],
  excludeFormats: [],
  aspectRatio: 'all',
  sortBy: 'order',
  sortDirection: 'desc',
  layout: 'grid',
  resolutionMode: 'or',
};

describe('filterImages', () => {
  it('应该返回空数组当输入空数组', () => {
    expect(filterImages([], defaultOptions)).toEqual([]);
  });

  it('应该按最小尺寸过滤（resolutionMode=or）', () => {
    const images = [
      makeImage({ url: 'img1.png', width: 50, height: 50 }),
      makeImage({ url: 'img2.png', width: 200, height: 50 }),
    ];
    const options = { ...defaultOptions, minWidth: 100, minHeight: 100, resolutionMode: 'or' as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('img2.png');
  });

  it('应该按最小尺寸过滤（resolutionMode=and）', () => {
    const images = [
      makeImage({ url: 'img1.png', width: 100, height: 200 }),
      makeImage({ url: 'img2.png', width: 199, height: 199 }),
    ];
    const options = { ...defaultOptions, minWidth: 100, minHeight: 200, resolutionMode: 'and' as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('img1.png');
  });

  it('应该按格式过滤（allowedFormats）', () => {
    const images = [
      makeImage({ url: 'img1.png', format: 'PNG' }),
      makeImage({ url: 'img2.jpg', format: 'JPG' }),
    ];
    const options = { ...defaultOptions, allowedFormats: ['PNG' as const] };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].format).toBe('PNG');
  });

  it('应该按排除格式过滤（excludeFormats）', () => {
    const images = [
      makeImage({ url: 'img1.png', format: 'PNG' }),
      makeImage({ url: 'img2.gif', format: 'GIF' }),
    ];
    const options = { ...defaultOptions, excludeFormats: ['GIF' as const] };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].format).toBe('PNG');
  });

  it('应该按搜索关键词过滤', () => {
    const images = [
      makeImage({ url: 'https://example.com/photo.png' }),
      makeImage({ url: 'https://example.com/banner.png' }),
    ];
    const options = { ...defaultOptions, searchQuery: 'photo' };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain('photo');
  });

  it('应该按排除关键词过滤', () => {
    const images = [
      makeImage({ url: 'https://example.com/icon.png' }),
      makeImage({ url: 'https://example.com/hero.png' }),
    ];
    const options = { ...defaultOptions, excludeKeywords: 'icon' };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain('hero');
  });

  it('应该按宽高比过滤（square）', () => {
    const images = [
      makeImage({ url: 'square.png', width: 100, height: 100 }),
      makeImage({ url: 'landscape.png', width: 200, height: 100 }),
    ];
    const options = { ...defaultOptions, aspectRatio: 'square' as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('square.png');
  });

  it('应该按宽高比过滤（landscape）', () => {
    const images = [
      makeImage({ url: 'landscape.png', width: 200, height: 100 }),
      makeImage({ url: 'portrait.png', width: 100, height: 200 }),
    ];
    const options = { ...defaultOptions, aspectRatio: 'landscape' as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('landscape.png');
  });

  it('应该按 size 排序', () => {
    const images = [
      makeImage({ url: 'small.png', sizeKB: 10 }),
      makeImage({ url: 'large.png', sizeKB: 100 }),
    ];
    const options = { ...defaultOptions, sortBy: 'size' as const, sortDirection: 'asc' as const };
    const result = filterImages(images, options);
    expect(result[0].url).toBe('small.png');
    expect(result[1].url).toBe('large.png');
  });

  it('应该按 resolution 降序排序', () => {
    const images = [
      makeImage({ url: 'low.png', width: 100, height: 100 }),
      makeImage({ url: 'high.png', width: 500, height: 500 }),
    ];
    const options = { ...defaultOptions, sortBy: 'resolution' as const, sortDirection: 'desc' as const };
    const result = filterImages(images, options);
    expect(result[0].url).toBe('high.png');
    expect(result[1].url).toBe('low.png');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**（此时还未有实现，但实现已存在，应该全通过）

```bash
npx vitest run src/core/__tests__/filter.test.ts
```
Expected: 所有测试通过 (PASS)

- [ ] **Step 3: Commit**

```bash
git add src/core/__tests__/filter.test.ts
git commit -m "test: add filterImages unit tests"
```

---

## Task 3: filename-generator 单元测试

**Files:**
- Create: `src/core/__tests__/filename-generator.test.ts`
- Reference: `src/core/utils/filename-generator.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect } from 'vitest';
import { generateFilename } from '../utils/filename-generator';
import type { ImageItem, Settings } from '../../types';

const makeImage = (overrides: Partial<ImageItem> & { url: string }): ImageItem => ({
  id: 'abc123def',
  width: 100,
  height: 100,
  sizeKB: 10,
  format: 'PNG' as const,
  isSelected: false,
  ...overrides,
});

const defaultSettings: Settings = {
  general: { language: 'en' },
  fileSaving: { subfolder: '', filenameTemplate: '{page_title}_{date}_{time}_{index}' },
  interfaceBehavior: {
    showInSidebar: false, hideDownloadWarning: false, searchAllFrames: true,
    identifyBackgroundImages: true, identifyBlobImages: false, showFloatingButton: true,
    minImageSize: 128, disabledDomains: [],
  },
  downloadLogic: { targetFormat: 'original', quality: 85, reEncodeWebp: false },
  gifStrategy: 'keep',
  downloadControl: { conflictResolution: 'uniquify', maxConcurrency: 5 },
  filterDefaults: {
    minWidth: 0, minHeight: 0, excludeKeywords: '', searchQuery: '',
    allowedFormats: [], excludeFormats: [], aspectRatio: 'all', resolutionMode: 'or',
  },
};

describe('generateFilename', () => {
  it('应该使用默认模板生成文件名', () => {
    const img = makeImage({ url: 'https://example.com/photo.png', pageTitle: 'MyPage' });
    const result = generateFilename(img, defaultSettings, { index: 1, total: 10 });
    expect(result).toMatch(/^MyPage_\d{8}_\d{6}_01\.png$/);
  });

  it('应该从 URL 中提取原始文件名', () => {
    const img = makeImage({ url: 'https://example.com/photo.png' });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: '', filenameTemplate: '{origin}' },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toBe('photo.png');
  });

  it('应该处理 data URL', () => {
    const img = makeImage({ url: 'data:image/png;base64,abc123' });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: '', filenameTemplate: '{origin}' },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toMatch(/^data_image_\w+\.png$/);
  });

  it('应该替换模板变量 {index} 并补零', () => {
    const img = makeImage({ url: 'https://example.com/img.jpg' });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: '', filenameTemplate: '{index}' },
    };
    const result = generateFilename(img, settings, { index: 7, total: 100 });
    expect(result).toMatch(/^007\.(jpg|jpeg)$/);
  });

  it('应该创建子文件夹路径', () => {
    const img = makeImage({ url: 'https://example.com/img.jpg', pageTitle: 'MyPage' });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: 'images/{page_title}', filenameTemplate: '{origin}' },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toBe('images/MyPage/img.jpg');
  });

  it('应该过滤文件名中的非法字符', () => {
    const img = makeImage({ url: 'https://example.com/photo.jpg' });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: '', filenameTemplate: 'test:file/name' },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    // 非法字符 : / 被替换为 _
    expect(result).not.toContain(':');
    expect(result).not.toContain('/');
  });

  it('应该使用自定义扩展名', () => {
    const img = makeImage({ url: 'https://example.com/photo.png' });
    const result = generateFilename(img, defaultSettings, { index: 1, total: 1 }, 'webp');
    expect(result).toMatch(/\.webp$/);
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
npx vitest run src/core/__tests__/filename-generator.test.ts
```
Expected: 所有测试通过 (PASS)

- [ ] **Step 3: Commit**

```bash
git add src/core/__tests__/filename-generator.test.ts
git commit -m "test: add filename-generator unit tests"
```

---

## Task 4: image-type-detector 单元测试

**Files:**
- Create: `src/core/__tests__/image-type-detector.test.ts`
- Reference: `src/core/utils/image-type-detector.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect } from 'vitest';
import { ImageTypeDetector } from '../utils/image-type-detector';

describe('ImageTypeDetector.getFormatFromUrl', () => {
  it('应该从 URL 后缀识别 PNG', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.png')).toBe('PNG');
  });

  it('应该从 URL 后缀识别 JPG', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.jpg')).toBe('JPG');
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.jpeg')).toBe('JPG');
  });

  it('应该从 URL 后缀识别 GIF', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.gif')).toBe('GIF');
  });

  it('应该从 URL 后缀识别 WEBP', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.webp')).toBe('WEBP');
  });

  it('应该从 URL 后缀识别 SVG', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image.svg')).toBe('SVG');
  });

  it('应该识别 Twitter format 参数', () => {
    const url = 'https://pbs.twimg.com/media/abc123?format=jpg&name=small';
    expect(ImageTypeDetector.getFormatFromUrl(url)).toBe('JPG');
  });

  it('应该识别微信 wx_fmt 参数', () => {
    const url = 'https://mp.weixin.qq.com/abc?wx_fmt=png&tp=webp';
    expect(ImageTypeDetector.getFormatFromUrl(url)).toBe('PNG');
  });

  it('应该对未知 URL 返回 UNKNOWN', () => {
    expect(ImageTypeDetector.getFormatFromUrl('https://example.com/image')).toBe('UNKNOWN');
  });

  it('应该处理 null/undefined 输入', () => {
    expect(ImageTypeDetector.getFormatFromUrl(null)).toBe('UNKNOWN');
    expect(ImageTypeDetector.getFormatFromUrl(undefined)).toBe('UNKNOWN');
  });
});

describe('ImageTypeDetector.getFormatFromMimeType', () => {
  it('应该从 MIME 识别 PNG', () => {
    expect(ImageTypeDetector.getFormatFromMimeType('image/png')).toBe('PNG');
  });

  it('应该从 MIME 识别 JPEG', () => {
    expect(ImageTypeDetector.getFormatFromMimeType('image/jpeg')).toBe('JPG');
  });

  it('应该从 MIME 识别 WEBP', () => {
    expect(ImageTypeDetector.getFormatFromMimeType('image/webp')).toBe('WEBP');
  });

  it('应该处理 null/空 MIME', () => {
    expect(ImageTypeDetector.getFormatFromMimeType(null)).toBe('UNKNOWN');
    expect(ImageTypeDetector.getFormatFromMimeType('')).toBe('UNKNOWN');
  });
});

describe('ImageTypeDetector.getFormatFromMagicNumber', () => {
  it('应该从魔数识别 JPEG', () => {
    const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe('JPG');
  });

  it('应该从魔数识别 PNG', () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe('PNG');
  });

  it('应该从魔数识别 GIF', () => {
    const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe('GIF');
  });

  it('应该处理过短的 buffer', () => {
    const buffer = new Uint8Array([0x00, 0x01]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe('UNKNOWN');
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
npx vitest run src/core/__tests__/image-type-detector.test.ts
```
Expected: 所有测试通过 (PASS)

- [ ] **Step 3: Commit**

```bash
git add src/core/__tests__/image-type-detector.test.ts
git commit -m "test: add image-type-detector unit tests"
```

---

## Task 5: 修复硬编码文本 + 补全 i18n

**Files:**
- Modify: `src/ui/components/ImageGrid.tsx`
- Modify: `src/ui/components/SettingsPage.tsx`
- Modify (可能): `src/locales/en.ts` 及所有语言文件

- [ ] **Step 1: 修复 ImageGrid.tsx 硬编码中文**

在 [`src/ui/components/ImageGrid.tsx:79-81`](src/ui/components/ImageGrid.tsx:79) 附近，将：

```tsx
<Text size="xs" c="dimmed">
  探索网页中的图片中...
</Text>
```

改为：

```tsx
<Text size="xs" c="dimmed">
  {t("exploringImages")}
</Text>
```

- [ ] **Step 2: 修复 SettingsPage.tsx 硬编码中文**

在 [`src/ui/components/SettingsPage.tsx:205`](src/ui/components/SettingsPage.tsx:205) 附近，将：

```tsx
{t("statusSaved") || "已保存"}
```

改为：

```tsx
{t("statusSaved")}
```

- [ ] **Step 3: 补全 i18n 字典**

检查所有语言文件（`src/locales/*.ts`），确保以下 key 都存在：

- `exploringImages` - "探索网页中的图片中..." / "Exploring images on the page..."
- 检查所有使用 `t("key") || "fallback"` 模式的调用，补全字典或删除 fallback

修改 [`src/locales/en.ts`](src/locales/en.ts) 添加：

```typescript
exploringImages: { message: "Exploring images on the page..." },
```

修改 [`src/locales/zh_CN.ts`](src/locales/zh_CN.ts) 添加：

```typescript
exploringImages: { message: "探索网页中的图片中..." },
```

对其他语言文件做同样操作。

- [ ] **Step 4: 搜索并修复所有 `|| "xxx"` fallback 模式**

```bash
findstr /snip "t(\".*\")\s*||" src/ui/components/*.tsx src/ui/components/**/*.tsx
```

检查结果，逐个修复：如果字典中存在该 key 则删除 fallback，如果不存在则添加到字典。

- [ ] **Step 5: 运行测试确保没有破坏**

```bash
npx vitest run
```
Expected: 所有测试通过

- [ ] **Step 6: Commit**

```bash
git add src/ui/components/ImageGrid.tsx src/ui/components/SettingsPage.tsx src/locales/*.ts
git commit -m "fix: replace hardcoded text with i18n keys and complete dictionaries"
```

---

## Task 6: 修复浮窗控制器进度模拟（仅改数据流）

**Files:**
- Modify: `src/core/floating-controller.tsx`
- Constraint: 不能改变 UI 渲染外观

- [ ] **Step 1: 分析现有进度模拟逻辑**

查看 [`floating-controller.tsx:387-389`](src/core/floating-controller.tsx:387)：

```typescript
inst.progressInterval = window.setInterval(() => {
  inst.progress = Math.min(95, inst.progress + 5);
  this.renderReact();
}, 200);
```

- [ ] **Step 2: 使用真实进度替换模拟逻辑**

修改 `triggerDownload` 方法，将 `processor.downloadBatch` 的 `onProgress` 回调连接到浮窗进度：

```typescript
private async triggerDownload(inst: ActiveInstance) {
  if (inst.status !== "idle") return;

  inst.status = "downloading";
  inst.progress = 0;
  this.renderReact();

  // 移除旧的 setInterval 模拟，改用真实回调
  try {
    let width = inst.target.getBoundingClientRect().width;
    let height = inst.target.getBoundingClientRect().height;

    if (inst.target instanceof HTMLImageElement) {
      if (inst.target.naturalWidth) width = inst.target.naturalWidth;
      if (inst.target.naturalHeight) height = inst.target.naturalHeight;
    }

    const item: ImageItem = {
      id: "f-" + Date.now(),
      url: inst.url,
      width: Math.round(width),
      height: Math.round(height),
      format: "JPG",
      isSelected: true,
      pageTitle: document.title,
      pageUrl: window.location.href,
      sizeKB: 0,
    };

    await this.processor.downloadBatch(
      [item],
      this.settings,
      (curr: number, total: number) => {
        inst.progress = Math.round((curr / total) * 100);
        this.renderReact();
      },
    );
    inst.status = "success";
    inst.progress = 100;
  } catch {
    inst.status = "error";
  } finally {
    this.renderReact();
    setTimeout(() => {
      const currentInst = this.instances.get(inst.target);
      if (currentInst) {
        currentInst.status = "idle";
        if (!currentInst.isHovering) {
          this.scheduleHideInstance(currentInst.target);
        } else {
          this.renderReact();
        }
      }
    }, 2000);
  }
}
```

> **注意**：此改动只更改了进度数据的来源（从 setInterval 模拟改为 downloadBatch 的真实 onProgress 回调），不涉及任何 UI 渲染外观的修改。

- [ ] **Step 3: 确认构建通过**

```bash
npm run type-check
```
Expected: 类型检查通过

- [ ] **Step 4: Commit**

```bash
git add src/core/floating-controller.tsx
git commit -m "fix: replace fake progress with real download progress callback"
```

---

## Task 7: 抽取公共并发执行器 + 消除重复日期格式化

**Files:**
- Create: `src/core/utils/concurrency.ts`
- Modify: `src/core/utils/filename-generator.ts`
- Modify: `src/core/processor.ts`

- [ ] **Step 1: 创建 concurrency.ts**

```typescript
/**
 * 并发执行器：以限定并发数执行一组异步任务
 */
export async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<void>,
  onProgress?: (current: number, total: number) => void,
): Promise<{ success: number; fail: number }> {
  const total = items.length;
  let currentIndex = 0;
  let completed = 0;
  let failCount = 0;

  const worker = async () => {
    while (currentIndex < total) {
      const index = currentIndex++;
      const item = items[index];
      try {
        await handler(item, index);
      } catch {
        failCount++;
      } finally {
        completed++;
        onProgress?.(completed, total);
      }
    }
  };

  const effectiveConcurrency = concurrency > 0 ? Math.min(concurrency, total) : total;
  const workers = Array(effectiveConcurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  return { success: total - failCount, fail: failCount };
}
```

- [ ] **Step 2: 在 filename-generator.ts 中导出日期格式化函数**

在 [`src/core/utils/filename-generator.ts`](src/core/utils/filename-generator.ts) 末尾添加导出：

```typescript
/**
 * 格式化日期/时间为标准字符串
 */
export function formatDate(now: Date = new Date()): { dateStr: string; timeStr: string; year: string; month: string; day: string; hour: string; minute: string; second: string } {
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const second = now.getSeconds().toString().padStart(2, "0");
  return {
    dateStr: `${year}${month}${day}`,
    timeStr: `${hour}${minute}${second}`,
    year, month, day, hour, minute, second,
  };
}
```

同时修改 [`filename-generator.ts:17-25`](src/core/utils/filename-generator.ts:17) 使用 `formatDate`：

```typescript
const { dateStr, timeStr, year, month, day, hour, minute, second } = formatDate(now);
```

- [ ] **Step 3: 重写 processor.ts 使用 concurrency 和 formatDate**

修改 [`processor.ts`](src/core/processor.ts)：

1. 顶部添加 import：
```typescript
import { runConcurrent } from "./utils/concurrency";
import { formatDate } from "./utils/filename-generator";
```

2. 将 `downloadBatch` 中旧的并发 worker 逻辑替换为 `runConcurrent`：

```typescript
async downloadBatch(
  images: ImageItem[],
  settings: Settings,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const CONCURRENCY =
    settings.downloadControl?.maxConcurrency > 0
      ? settings.downloadControl.maxConcurrency
      : settings.downloadControl?.maxConcurrency === 0
        ? images.length
        : 5;

  const { failCount } = await runConcurrent(
    images,
    CONCURRENCY,
    async (img, index) => {
      // GIF skip
      if (img.format.toLowerCase() === "gif" && settings.gifStrategy === "skip") {
        return;
      }

      try {
        // Debug log (first item only)
        if (index === 0 && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: "DEBUG_LOG",
            payload: { message: `Processor using settings: ${JSON.stringify(settings)}` },
          }).catch(() => {});
        }

        let blob = await this.adapter.fetchBlob(img.url, img.pageUrl || window.location.href);
        let extension: string | undefined;

        try {
          const converted = await convertImage(blob, img, settings);
          blob = converted.blob;
          extension = converted.extension;
        } catch (convErr) {
          if (convErr instanceof Error && convErr.message === "SKIP_GIF") {
            console.log(`[Processor] Skipping GIF after fetch: ${img.url}`);
            return;
          }
          console.warn(`[Processor] Format conversion failed, using original:`, convErr);
        }

        const finalPath = generateFilename(img, settings, { index: index + 1, total: images.length }, extension);
        const conflictAction = settings.downloadControl?.conflictResolution === "overwrite" ? "overwrite" : "uniquify";

        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: "DEBUG_LOG",
            payload: { message: `Preparing download: ${finalPath}`, filename: finalPath },
          }).catch(() => {});
        }

        await this.adapter.download(blob, finalPath, conflictAction);
      } catch (err) {
        console.error(`[Processor] Failed at index ${index} (${img.url}):`, err);
        throw err; // 让 runConcurrent 计数失败
      }
    },
    onProgress,
  );

  if (images.length > 0 && failCount === images.length) {
    throw new Error(`All ${images.length} downloads failed`);
  }
}
```

3. 同样将 `downloadAsZip` 中的重复并发逻辑替换为 `runConcurrent`。

4. 将 `downloadAsZip` 中的日期格式化替换为 `formatDate`：

```typescript
const { dateStr, timeStr } = formatDate(now);
// 删除此前的 7 行手动格式化代码
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
npm run type-check
```
Expected: 测试通过，类型检查通过

- [ ] **Step 5: Commit**

```bash
git add src/core/utils/concurrency.ts src/core/utils/filename-generator.ts src/core/processor.ts
git commit -m "refactor: extract common concurrency executor and date format function"
```

---

## Task 8: 修复 unsafe flushSync + 组件重渲染优化

**Files:**
- Modify: `src/ui/components/ImageGrid.tsx`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: 修复 ImageGrid.tsx 渲染中直接 setState**

将 [`ImageGrid.tsx:40-43`](src/ui/components/ImageGrid.tsx:40) 这段代码：

```typescript
if (items !== prevItems) {
  setPrevItems(items);
  setVisibleCount(40);
}
```

改为使用 `useEffect`：

```typescript
// 移除 if 块，改为 useEffect
useEffect(() => {
  setPrevItems(items);
  setVisibleCount(40);
}, [items]);
```

- [ ] **Step 2: 稳定化 App.tsx 中的回调**

在 [`src/ui/App.tsx`](src/ui/App.tsx) 中，找到传递给 `ImageCard`/`ImageGrid` 的回调函数。

`toggleSelect` 已经使用了 `useCallback`，但依赖 `lastSelectedIndex`，这会导致每次选择变化时都重新创建。可以改为使用 `useRef` 来避免依赖：

```typescript
const lastSelectedIndexRef = useRef<number | null>(null);

const toggleSelect = useCallback(
  (id: string, isShift: boolean = false): void => {
    setImages((prev: ImageItem[]) => {
      const currentIndex = prev.findIndex((img) => img.id === id);
      if (currentIndex === -1) return prev;

      const newImages = [...prev];
      const targetValue = !prev[currentIndex].isSelected;

      if (isShift && lastSelectedIndexRef.current !== null) {
        const start = Math.min(lastSelectedIndexRef.current, currentIndex);
        const end = Math.max(lastSelectedIndexRef.current, currentIndex);
        for (let i = start; i <= end; i++) {
          newImages[i] = { ...newImages[i], isSelected: targetValue };
        }
      } else {
        newImages[currentIndex] = { ...newImages[currentIndex], isSelected: targetValue };
      }

      lastSelectedIndexRef.current = currentIndex;
      return newImages;
    });
  },
  [], // 不再依赖 lastSelectedIndex
);
```

- [ ] **Step 3: 运行测试 + 类型检查**

```bash
npx vitest run
npm run type-check
```
Expected: 通过

- [ ] **Step 4: Commit**

```bash
git add src/ui/components/ImageGrid.tsx src/ui/App.tsx
git commit -m "fix: remove unsafe render-time setState and stabilize callbacks"
```

---

## Task 9: 修复错误处理一致性

**Files:**
- Modify: `src/core/sniffer.ts`
- Modify: `src/entry/background.ts`

- [ ] **Step 1: 修复 sniffer.ts 中空 reject**

在 [`sniffer.ts:297`](src/core/sniffer.ts:297)：
```typescript
img.onerror = () => reject();
```
改为：
```typescript
img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 100)}`));
```

- [ ] **Step 2: 修复 sniffer.ts 中 catch(() => resolve())**

在 [`sniffer.ts:29`](src/core/sniffer.ts:29) 附近：
```typescript
.catch(() => resolve());
```
改为：
```typescript
.catch((err) => {
  console.warn("[Sniffer] Failed to send AUTOSCROLL_REQUEST:", err);
  resolve();
});
```

- [ ] **Step 3: 修复 background.ts 中空 catch**

在 [`background.ts:52`](src/entry/background.ts:52) 附近，查找所有 `catch { /* ignore */ }` 模式，添加至少 `console.warn`：

```typescript
.catch((err) => {
  console.warn("[Background] sendResponse failed:", err);
});
```

- [ ] **Step 4: 运行测试 + 类型检查**

- [ ] **Step 5: Commit**

```bash
git add src/core/sniffer.ts src/entry/background.ts
git commit -m "fix: improve error handling consistency - add proper error messages to rejections and catch blocks"
```

---

## Task 10: 强化类型安全

**Files:**
- Modify: `src/ui/hooks/useSettings.ts`

- [ ] **Step 1: 重写 mergeDeep 为泛型**

将 [`useSettings.ts:121-137`](src/ui/hooks/useSettings.ts:121) 改为：

```typescript
function mergeDeep<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    if (sourceVal !== undefined && isObject(sourceVal) && isObject(target[key])) {
      output[key] = mergeDeep(target[key] as Record<string, unknown>, sourceVal as Record<string, unknown>) as T[keyof T];
    } else if (sourceVal !== undefined) {
      output[key] = sourceVal as T[keyof T];
    }
  }
  return output;
}
```

- [ ] **Step 2: 运行类型检查**

```bash
npm run type-check
```
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add src/ui/hooks/useSettings.ts
git commit -m "refactor: strengthen type safety in mergeDeep with generics"
```

---

## Task 11: 修复内存泄漏 + 添加 Error Boundary

**Files:**
- Modify: `src/core/utils/image-converter.ts`
- Create: `src/ui/components/ErrorBoundary.tsx`
- Modify: `src/entry/content.tsx`

- [ ] **Step 1: 修复 image-converter.ts 内存泄漏**

在 [`image-converter.ts:71-143`](src/core/utils/image-converter.ts:71) 的 `onload` 和 `onerror` 回调中，添加 `imgElement.src = ""` 来释放资源。在 `URL.revokeObjectURL(url)` 之后添加：

```typescript
imgElement.onload = () => {
  URL.revokeObjectURL(url);
  // ... 现有 canvas 逻辑 ...
  
  // 在 resolve/reject 后清理
  imgElement.src = ""; // 释放图片资源
};
```

- [ ] **Step 2: 创建 ErrorBoundary 组件**

新建 `src/ui/components/ErrorBoundary.tsx`：

```typescript
import React from "react";
import { Box, Text, Button, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box p="xl" style={{ textAlign: "center" }}>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Text fw={700} size="lg">Something went wrong</Text>
            <Text size="sm" c="dimmed">
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
            <Button
              variant="light"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 3: 在 content.tsx 中添加 Error Boundary**

在 [`content.tsx:89-99`](src/entry/content.tsx:89) 的 `ReactDOM.createRoot` 渲染中包裹 ErrorBoundary：

```typescript
import { ErrorBoundary } from "../ui/components/ErrorBoundary";

// ...

ReactDOM.createRoot(appMountPoint).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MantineProvider
        theme={theme}
        forceColorScheme="dark"
        cssVariablesSelector={SELECTOR}
        getRootElement={() => extensionRoot}
      >
        <App />
      </MantineProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
```

- [ ] **Step 4: 运行类型检查**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/core/utils/image-converter.ts src/ui/components/ErrorBoundary.tsx src/entry/content.tsx
git commit -m "fix: add ErrorBoundary and fix image converter memory leak"
```

---

## Task 12: 清理文档 + 同步版本号

**Files:**
- Modify: `docs/PROJECT_DESIGN.md`

- [ ] **Step 1: 清理 AI 对话残留**

在 [`docs/PROJECT_DESIGN.md:106`](docs/PROJECT_DESIGN.md:106) 删除从 `"我的错！刚才光顾着帮你解决最头疼的架构..."` 开始到 `"...被追加到刚才那个 PROJECT_DESIGN.md 文档的末尾。"` 的元对话文本，只保留实际的第 7 节功能需求内容。

- [ ] **Step 2: 同步版本号**

将 [`docs/PROJECT_DESIGN.md:13`](docs/PROJECT_DESIGN.md:13) 的 `"React 18"` 改为 `"React 19"`。

- [ ] **Step 3: Commit**

```bash
git add docs/PROJECT_DESIGN.md
git commit -m "docs: clean up AI dialog residue and sync React version to 19"
```

---

## 未纳入本实施计划的项目

以下问题因范围较广或优先级较低，建议后续迭代处理：

| 问题 | 原因 |
|------|------|
| Web 适配器 300ms download hack | 需要浏览器 API 层面的研究，当前方案在各浏览器上表现稳定 |
| 浮窗格式硬编码 "JPG" | 功能影响小，且当前通过 URL 解析可获取正确格式 |
| 魔法数字提取为常量 | 纯代码风格改进，功能无影响 |
| 缺少开发工具配置（launch.json、husky） | 属于开发者体验优化，不影响最终用户 |
| 构建脚本优化（分离 format/lint） | 当前构建时间尚可接受 |
| 数据流优化（避免不必要嗅探） | 需要更深入的架构改动，建议在重写状态管理时统一处理 |

---

*计划编写完成于 2026-05-11。执行时请以最新代码状态为准。*
