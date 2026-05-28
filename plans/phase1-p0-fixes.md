# Phase 1 — 稳定性修复（低投入高回报）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 verified stability/code-quality issues: `sniffNodeTree` DOM traversal, settings effect dependency, unstable image ID generation, and processor code duplication.

**Architecture:** All changes are localized to 3 files: `src/core/sniffer.ts`, `src/ui/App.tsx`, `src/core/processor.ts`. No new files. No API changes.

**Tech Stack:** TypeScript, React 19, Chrome Extension MV3

---

### Task 1: Optimize `sniffNodeTree` — replace `querySelectorAll('*')` with TreeWalker + phased background image check

**Files:**
- Modify: [`src/core/sniffer.ts:56-131`](src/core/sniffer.ts:56)

**Current problem:**
- `root.querySelectorAll("*")` (L66) collects ALL elements upfront — on large pages this can be 10K+ DOM nodes
- `getComputedStyle` is called for every `instanceof HTMLElement` (L92-95) — synchronous reflow, even for elements with no inline `style` or background
- The full NodeList is allocated in memory before iteration begins

**Fix approach:**
Replace with [`document.createTreeWalker`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker) using `NodeFilter.SHOW_ELEMENT` and a custom `acceptNode` filter. Split into two phases:

1. **Phase 1 (TreeWalker):** Walk the tree once. For each element:
   - If `tagName === "IMG"` → extract URL
   - If `tagName === "SOURCE"` in `<picture>` → extract srcset
   - If has `shadowRoot` → recurse
   - If `tagName === "IFRAME"` → recurse
   - If has inline `style` attribute containing `background` → mark for Phase 2

2. **Phase 2 (separate loop):** Only for elements marked in Phase 1, call `getComputedStyle` and check background-image

- [ ] **Step 1: Add `TreeWalkerFilterResult` type and the two-phase helper structure**

  Add at the top of the class (before `sniffNodeTree`):

  ```typescript
  // 匹配项标记：记录需要第二阶段背景图检查的元素
  interface BgCandidate {
    element: Element;
  }
  ```

- [ ] **Step 2: Rewrite `sniffNodeTree` method body (lines 56-131)**

  Replace the current implementation:

  ```typescript
  private async sniffNodeTree(
    root: Document | ShadowRoot | Element,
    searchAllFrames: boolean = true,
    identifyBackground: boolean = true,
    visited: Set<Document | ShadowRoot | Element> = new Set(),
  ): Promise<string[]> {
    if (visited.has(root)) return [];
    visited.add(root);

    const urls = new Set<string>();
    const bgCandidates: BgCandidate[] = [];

    // Phase 1: TreeWalker — 仅遍历一次 DOM 树
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => NodeFilter.FILTER_ACCEPT,
      },
    );

    let el: Element | null;
    while ((el = treeWalker.nextNode() as Element | null)) {
      // 1. 处理普通图片
      if (el.tagName === "IMG") {
        const url = UrlResolver.resolveBestUrl(el as HTMLElement);
        if (url) urls.add(url);
      } else if (
        el.tagName === "SOURCE" &&
        el.parentElement?.tagName === "PICTURE"
      ) {
        const srcset = (el as HTMLSourceElement).srcset;
        if (srcset) {
          const bestUrl = UrlResolver.parseSrcset(srcset);
          if (bestUrl) {
            try {
              const absolute = new URL(bestUrl, window.location.href).href;
              urls.add(UrlResolver.transformSiteSpecificUrl(absolute));
            } catch {
              urls.add(bestUrl);
            }
          }
        }
      }

      // 2. 收集背景图候选（延迟到 Phase 2 检查 getComputedStyle）
      if (identifyBackground && el instanceof HTMLElement) {
        // 先通过 style 属性快速过滤：没有 style 属性则不可能有 background-image
        if (el.hasAttribute("style") || el.hasAttribute("background")) {
          bgCandidates.push({ element: el });
        }
      }

      // 3. 处理 Shadow DOM
      if (el.shadowRoot) {
        const shadowUrls = await this.sniffNodeTree(
          el.shadowRoot,
          searchAllFrames,
          identifyBackground,
          visited,
        );
        for (const u of shadowUrls) urls.add(u);
      }

      // 4. 处理 iframe
      if (searchAllFrames && el.tagName === "IFRAME") {
        const iframe = el as HTMLIFrameElement;
        try {
          const frameDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (frameDoc) {
            const frameUrls = await this.sniffNodeTree(
              frameDoc,
              searchAllFrames,
              identifyBackground,
              visited,
            );
            for (const u of frameUrls) urls.add(u);
          }
        } catch {
          // 忽略跨域 iframe 报错
        }
      }
    }

    // Phase 2: 仅对候选元素执行 getComputedStyle（避免对无关元素触发重排）
    if (identifyBackground) {
      for (const candidate of bgCandidates) {
        const url = UrlResolver.resolveBestUrl(candidate.element as HTMLElement);
        if (url) urls.add(url);
      }
    }

    return Array.from(urls);
  }
  ```

- [ ] **Step 3: Run existing tests to confirm no regression**

  Run: `npx vitest run --reporter verbose 2>&1`
  Expected: All test suites pass (filter, filename-generator, image-type-detector)

- [ ] **Step 4: Verify TreeWalker works correctly with Shadow DOM**

  Key behavioral check: `document.createTreeWalker` traverses into Shadow DOM only if `root` is the shadow root itself. Since we pass `el.shadowRoot` explicitly as the `root` parameter in the recursive call (line `this.sniffNodeTree(el.shadowRoot, ...)`), Shadow DOM traversal is preserved.

  No additional code change needed — the existing recursive pattern handles this correctly.

---

### Task 2: Fix settings dependency — prevent re-sniff on unrelated setting changes

**Files:**
- Modify: [`src/ui/App.tsx:56-63, 78-113`](src/ui/App.tsx:56)

**Current problem:**
- `useEffect` at L113 depends on `[sniffer, settings]` — `settings` is a new object reference on every `updateSettings` call (due to `mergeDeep`), so ANY setting change triggers re-sniff
- `useEffect` at L63 depends on `[settings.filterDefaults]` — same problem, filter defaults get reset on every settings change

**Fix approach:**
1. Sniff effect should only depend on the specific fields that actually affect sniffing behavior
2. `filterDefaults` effect should compare deeply or only sync once at mount

- [ ] **Step 1: Update sniff effect dependency (line 113)**

  Change from:
  ```typescript
  }, [sniffer, settings]);
  ```
  To:
  ```typescript
  }, [sniffer, settings.interfaceBehavior?.searchAllFrames, settings.interfaceBehavior?.identifyBackgroundImages, settings.interfaceBehavior?.identifyBlobImages]);
  ```

  This ensures re-sniff only triggers when sniffing-relevant settings actually change (e.g., user toggles "search all frames" or "identify blob images"), not when changing language, filename template, or other unrelated settings.

- [ ] **Step 2: Fix filterDefaults effect (lines 56-63)**

  Replace with a mount-only sync + explicit sync point:

  ```typescript
  // 初始加载时同步 filterDefaults（后续通过设置页保存时显式同步）
  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (settings?.filterDefaults && !initialSyncDone.current) {
      setFilters((prev) => ({
        ...prev,
        ...settings.filterDefaults,
      }));
      initialSyncDone.current = true;
    }
  }, [settings.filterDefaults]);
  ```

  Add the import for `useRef` at the top of App.tsx (already imported if not present, check).

  > Note: This means changing filterDefaults in settings will NOT automatically update current filters until the next sniff. If the user wants live sync, we'd need a different approach (e.g., a `useEffect` with deep comparison via `JSON.stringify`). But given that filterDefaults is set-and-forget, the mount-only approach is appropriate.

- [ ] **Step 3: Run existing tests to confirm no regression**

  Run: `npx vitest run --reporter verbose 2>&1`
  Expected: All test suites pass

---

### Task 3: Fix unstable image ID generation

**Files:**
- Modify: [`src/core/sniffer.ts:277`](src/core/sniffer.ts:277)

**Current problem:**
```typescript
id: btoa(encodeURIComponent(urlArray[index])).slice(0, 10) + index,
```
- `urlArray` order depends on `Set` iteration (insertion order), which varies between sniff runs
- Performance API entries change between runs → `urlArray` order changes → `index` changes → ID changes
- React sees all keys as new on each sniff → full DOM teardown and rebuild of ImageGrid

**Fix approach:**
Use a stable hash of the URL itself, removing dependency on `index`. Since we can't use `crypto.subtle` synchronously, and the URL is already unique within a sniff result, use `url.hashCode()` (or a simple hash function).

- [ ] **Step 1: Add a stable hash function**

  Add this helper at the top of `sniffer.ts` (before the class):

  ```typescript
  /** 为字符串生成稳定的数字哈希（不依赖索引位置） */
  function stableHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(36);
  }
  ```

  This is DJB2 hash — deterministic, fast (O(n)), no async overhead, no base64 size issues.

- [ ] **Step 2: Replace the ID generation (line 277)**

  Change from:
  ```typescript
  id: btoa(encodeURIComponent(urlArray[index])).slice(0, 10) + index,
  ```
  To:
  ```typescript
  id: stableHash(urlArray[index]),
  ```

- [ ] **Step 3: Run existing tests to confirm no regression**

  Run: `npx vitest run --reporter verbose 2>&1`
  Expected: All test suites pass

---

### Task 4: Extract common download logic in `processor.ts`

**Files:**
- Modify: [`src/core/processor.ts`](src/core/processor.ts)

**Current problem:**
`downloadBatch` (L22-132) and `downloadAsZip` (L137-247) share ~50 lines of duplicated code for:
1. GIF filtering (L40-45, L155-160)
2. `adapter.fetchBlob` + error handling (L64-68, L164-168)
3. `convertImage` + GIF SKIP handling (L70-85, L170-182)
4. `generateFilename` call (L87-96, L184-193)

**Fix approach:**
Extract a private helper method `processSingleImage` that returns `{ blob, filename } | null`.

- [ ] **Step 1: Add `ProcessResult` interface and private helper method**

  Add after the constructor (before `downloadBatch`):

  ```typescript
  interface ProcessResult {
    blob: Blob;
    filename: string;
  }

  private async processSingleImage(
    img: ImageItem,
    settings: Settings,
    index: number,
    total: number,
  ): Promise<ProcessResult | null> {
    // GIF 过滤
    if (
      img.format.toLowerCase() === "gif" &&
      settings.gifStrategy === "skip"
    ) {
      return null;
    }

    let blob = await this.adapter.fetchBlob(
      img.url,
      img.pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
    );

    let extension: string | undefined;
    try {
      const converted = await convertImage(blob, img, settings);
      blob = converted.blob;
      extension = converted.extension;
    } catch (convErr) {
      if (convErr instanceof Error && convErr.message === "SKIP_GIF") {
        return null;
      }
      console.warn(`[Processor] Format conversion failed, using original:`, convErr);
    }

    const filename = generateFilename(img, settings, { index: index + 1, total }, extension);
    return { blob, filename };
  }
  ```

- [ ] **Step 2: Refactor `downloadBatch` to use the helper (lines 22-132)**

  Replace the body of `downloadBatch`:

  ```typescript
  async downloadBatch(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const total = images.length;
    const CONCURRENCY =
      settings.downloadControl?.maxConcurrency > 0
        ? settings.downloadControl.maxConcurrency
        : settings.downloadControl?.maxConcurrency === 0
          ? total
          : 5;

    const { fail: failCount } = await runConcurrent(
      images,
      CONCURRENCY,
      async (img, index) => {
        try {
          // 调试消息（仅保留 downloadBatch 特有的）
          if (
            index === 0 &&
            typeof chrome !== "undefined" &&
            chrome.runtime?.sendMessage
          ) {
            chrome.runtime
              .sendMessage({
                type: "DEBUG_LOG",
                payload: {
                  message: `Processor using settings: ${JSON.stringify(settings)}`,
                },
              })
              .catch(() => {});
          }

          const result = await this.processSingleImage(img, settings, index, total);
          if (!result) return;

          const { blob, filename } = result;

          // 执行下载
          const conflictAction =
            settings.downloadControl?.conflictResolution === "overwrite"
              ? "overwrite"
              : "uniquify";

          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime
              .sendMessage({
                type: "DEBUG_LOG",
                payload: {
                  message: `Preparing download: ${filename}`,
                  filename,
                },
              })
              .catch(() => {});
          }

          await this.adapter.download(blob, filename, conflictAction);
        } catch (err) {
          console.error(
            `[Processor] Failed at index ${index} (${img.url}):`,
            err,
          );
          throw err;
        }
      },
      onProgress,
    );

    if (total > 0 && failCount === total) {
      throw new Error(`All ${total} downloads failed`);
    }
  }
  ```

- [ ] **Step 3: Refactor `downloadAsZip` to use the helper (lines 137-247)**

  Replace the body of `downloadAsZip`:

  ```typescript
  async downloadAsZip(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const zip = new JSZip();
    const total = images.length;
    const CONCURRENCY =
      settings.downloadControl?.maxConcurrency > 0
        ? settings.downloadControl.maxConcurrency
        : settings.downloadControl?.maxConcurrency === 0
          ? total
          : 5;

    const { fail: failCount } = await runConcurrent(
      images,
      CONCURRENCY,
      async (img, index) => {
        try {
          const result = await this.processSingleImage(img, settings, index, total);
          if (!result) return;

          const { blob, filename } = result;

          // ZIP 模式下不需要发 DEBUG_LOG（Batch 特有）

          // 写入 ZIP
          zip.file(filename, blob);
        } catch (err) {
          console.error(
            `[Processor] ZIP resource fetch failed (${img.url}):`,
            err,
          );
          throw err;
        }
      },
      onProgress,
    );

    if (total > 0 && failCount === total) {
      throw new Error(`All ${total} resources failed to fetch for ZIP`);
    }

    // 生成 ZIP Blob（添加进度回调）
    const content = await zip.generateAsync(
      { type: "blob" },
      (metadata) => {
        if (onProgress) {
          // 将压缩进度映射到 0-100，基于总进度权重
          // 资源获取占 70%，压缩占 30%
          onProgress(total, total + Math.round(metadata.percent));
        }
      },
    );

    // 解析当前时间与基础模板变量用于 ZIP 命名
    const now = new Date();
    const { dateStr, timeStr } = formatDate(now);
    const pageTitle = images[0]?.pageTitle || document.title || "Imaget";

    let cleanSub = settings.fileSaving?.subfolder || "Imaget";
    cleanSub = cleanSub
      .split("{date}").join(dateStr)
      .split("{time}").join(timeStr)
      .split("{title}").join(pageTitle)
      .split("{page_title}").join(pageTitle)
      .replace(/[\\:*?"<>|]/g, "_")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    const baseName = cleanSub
      ? cleanSub.split("/").pop() || "Imaget"
      : "Imaget";
    const zipFileName = `${baseName}_batch_${dateStr}_${timeStr}.zip`;
    const finalZipPath = cleanSub ? `${cleanSub}/${zipFileName}` : zipFileName;

    await this.adapter.download(content, finalZipPath, "uniquify");
  }
  ```

- [ ] **Step 4: Run existing tests to confirm no regression**

  Run: `npx vitest run --reporter verbose 2>&1`
  Expected: All test suites pass

---

## Verification

After all 4 tasks:

- [ ] **Final check: Build the project**

  Run: `npx tsc --noEmit 2>&1`
  Expected: No TypeScript errors

- [ ] **Final check: Run all unit tests**

  Run: `npx vitest run --reporter verbose 2>&1`
  Expected: All test suites pass
