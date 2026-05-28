# Imaget Stabilization Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the remaining correctness, performance, and release-quality issues found after commit `8c32136`.

**Architecture:** Keep the existing React + Mantine + MV3 extension structure. Prefer small pure helpers in `src/core/utils` for logic that needs tests, and keep UI changes scoped to current component boundaries.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 3, Chrome Extension Manifest V3, Mantine, JSZip.

---

## File Structure

- Modify: `src/core/utils/settings-policy.ts` - add a testable sniffer-settings projection so UI-only settings do not trigger rescans.
- Modify: `src/core/__tests__/settings-policy.test.ts` - cover sniffer-settings key stability.
- Modify: `src/ui/App.tsx` - pass projected sniffer settings to `Sniffer` and remove whole-settings effect dependency.
- Modify: `src/ui/components/ImageGrid.tsx` - move visible-count reset out of render.
- Create: `src/core/utils/image-item-factory.ts` - build `ImageItem` objects from DOM elements with correct format inference.
- Create: `src/core/__tests__/image-item-factory.test.ts` - cover URL-based format inference and dimensions.
- Modify: `src/core/floating-controller.tsx` - use the factory instead of hard-coded JPG metadata.
- Modify: `src/core/processor.ts` - include ZIP compression in progress and add direct URL download fast path for original-format HTTP(S) downloads.
- Modify: `src/core/adapters/interface.ts` - add optional `downloadUrl`.
- Modify: `src/core/adapters/extension.ts` - implement direct URL download message.
- Modify: `src/core/adapters/web.ts` - implement direct URL download for browser/dev mode.
- Modify: `src/entry/background.ts` - handle `DOWNLOAD_URL_REQUEST` without Blob/Base64/Data URL conversion.
- Create: `src/core/__tests__/processor.test.ts` - cover ZIP progress and direct URL fast path.
- Modify: `public/manifest.json` - narrow match patterns from `<all_urls>` to HTTP(S).
- Modify: `package.json` - split quick build from full quality gate.
- Modify: `GEMINI.md` - update React version wording to match React 19.

---

### Task 1: Stop Non-Sniffer Settings From Triggering Rescans

**Files:**
- Modify: `src/core/utils/settings-policy.ts`
- Modify: `src/core/__tests__/settings-policy.test.ts`
- Modify: `src/core/sniffer.ts`
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/components/ImageGrid.tsx`

- [ ] **Step 1: Add failing tests for sniffer-settings stability**

Add this import in `src/core/__tests__/settings-policy.test.ts`:

```ts
import {
  applyTargetFormat,
  getSnifferSettings,
  getSnifferSettingsKey,
  isDomainDisabled,
  shouldContinueAutoScroll,
} from "../utils/settings-policy";
```

Add these tests inside `describe("settings policy helpers", () => { ... })`:

```ts
  it("keeps the sniffer settings key stable when unrelated settings change", () => {
    const baseKey = getSnifferSettingsKey(defaultSettings);
    const changed = {
      ...defaultSettings,
      general: {
        ...defaultSettings.general,
        language: "ja",
      },
      fileSaving: {
        ...defaultSettings.fileSaving,
        subfolder: "Changed/{date}",
      },
    };

    expect(getSnifferSettingsKey(changed)).toBe(baseKey);
  });

  it("changes the sniffer settings key when DOM extraction settings change", () => {
    const changed = {
      ...defaultSettings,
      interfaceBehavior: {
        ...defaultSettings.interfaceBehavior,
        identifyBackgroundImages:
          !defaultSettings.interfaceBehavior.identifyBackgroundImages,
      },
    };

    expect(getSnifferSettingsKey(changed)).not.toBe(
      getSnifferSettingsKey(defaultSettings),
    );
  });

  it("projects only the settings needed by the sniffer", () => {
    const projected = getSnifferSettings(defaultSettings);

    expect(projected.interfaceBehavior.searchAllFrames).toBe(
      defaultSettings.interfaceBehavior.searchAllFrames,
    );
    expect(projected.interfaceBehavior.identifyBackgroundImages).toBe(
      defaultSettings.interfaceBehavior.identifyBackgroundImages,
    );
    expect(projected.interfaceBehavior.identifyBlobImages).toBe(
      defaultSettings.interfaceBehavior.identifyBlobImages,
    );
    expect(projected.interfaceBehavior.disabledDomains).toEqual(
      defaultSettings.interfaceBehavior.disabledDomains,
    );
  });
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm run test -- src/core/__tests__/settings-policy.test.ts
```

Expected: FAIL because `getSnifferSettings` and `getSnifferSettingsKey` are not exported yet.

- [ ] **Step 3: Implement the sniffer-settings projection**

Append this to `src/core/utils/settings-policy.ts` after `shouldContinueAutoScroll`:

```ts
export interface SnifferSettings {
  interfaceBehavior: {
    disabledDomains?: string[];
    searchAllFrames: boolean;
    identifyBackgroundImages: boolean;
    identifyBlobImages: boolean;
  };
}

export function getSnifferSettings(settings: Settings): SnifferSettings {
  return {
    interfaceBehavior: {
      disabledDomains: settings.interfaceBehavior.disabledDomains,
      searchAllFrames: settings.interfaceBehavior.searchAllFrames,
      identifyBackgroundImages:
        settings.interfaceBehavior.identifyBackgroundImages,
      identifyBlobImages: settings.interfaceBehavior.identifyBlobImages,
    },
  };
}

export function getSnifferSettingsKey(settings: Settings): string {
  const projected = getSnifferSettings(settings);
  const disabledDomains = [
    ...(projected.interfaceBehavior.disabledDomains ?? []),
  ]
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .sort();

  return JSON.stringify({
    ...projected.interfaceBehavior,
    disabledDomains,
  });
}
```

Update `src/core/sniffer.ts` imports:

```ts
import {
  isDomainDisabled,
  shouldContinueAutoScroll,
  type SnifferSettings,
} from "./utils/settings-policy";
```

Change the `sniffAll` signature:

```ts
  public async sniffAll(
    settings?: SnifferSettings,
    existingItems?: ImageItem[],
  ): Promise<ImageItem[]> {
```

- [ ] **Step 4: Use the projection in App**

Update `src/ui/App.tsx` import:

```ts
import {
  getSnifferSettingsKey,
  type SnifferSettings,
} from "../core/utils/settings-policy";
```

Add after `const sniffer = useMemo(() => new Sniffer(), []);`:

```ts
  const snifferSettingsKey = useMemo(
    () => getSnifferSettingsKey(settings),
    [settings],
  );

  const snifferSettings: SnifferSettings = useMemo(
    () => ({
      interfaceBehavior: JSON.parse(
        snifferSettingsKey,
      ) as SnifferSettings["interfaceBehavior"],
    }),
    [snifferSettingsKey],
  );
```

Replace all `sniffer.sniffAll(settings` calls with `sniffer.sniffAll(snifferSettings`.

Change the first sniffer effect dependency list to:

```ts
  }, [sniffer, snifferSettings]);
```

- [ ] **Step 5: Move ImageGrid state reset out of render**

Change the import in `src/ui/components/ImageGrid.tsx`:

```ts
import React, { useState, useEffect, useRef, useMemo, memo } from "react";
```

Replace this render-time state update:

```ts
  const [prevItems, setPrevItems] = useState(items);
  const observerTarget = useRef<HTMLDivElement>(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setVisibleCount(40);
  }
```

With:

```ts
  const observerTarget = useRef<HTMLDivElement>(null);
  const itemIdentity = useMemo(
    () => items.map((item) => item.id).join("\u0001"),
    [items],
  );

  useEffect(() => {
    setVisibleCount(40);
  }, [itemIdentity]);
```

- [ ] **Step 6: Verify Task 1**

Run:

```bash
npm run test -- src/core/__tests__/settings-policy.test.ts
npm run type-check
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/core/utils/settings-policy.ts src/core/__tests__/settings-policy.test.ts src/core/sniffer.ts src/ui/App.tsx src/ui/components/ImageGrid.tsx
git commit -m "fix(ui): avoid unnecessary rescans from unrelated settings"
```

---

### Task 2: Fix Floating Download Image Metadata

**Files:**
- Create: `src/core/utils/image-item-factory.ts`
- Create: `src/core/__tests__/image-item-factory.test.ts`
- Modify: `src/core/floating-controller.tsx`

- [ ] **Step 1: Write failing tests for DOM-to-ImageItem creation**

Create `src/core/__tests__/image-item-factory.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createImageItemFromElement } from "../utils/image-item-factory";

describe("createImageItemFromElement", () => {
  it("infers PNG format from the resolved URL", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/image.png";

    const item = createImageItemFromElement({
      id: "test-1",
      url: img.src,
      target: img,
      pageTitle: "Gallery",
      pageUrl: "https://example.com/gallery",
    });

    expect(item.format).toBe("PNG");
    expect(item.filename).toBe("image.png");
    expect(item.pageTitle).toBe("Gallery");
    expect(item.pageUrl).toBe("https://example.com/gallery");
  });

  it("uses natural dimensions for image elements when available", () => {
    const img = document.createElement("img");
    Object.defineProperty(img, "naturalWidth", { value: 1280 });
    Object.defineProperty(img, "naturalHeight", { value: 720 });

    const item = createImageItemFromElement({
      id: "test-2",
      url: "https://cdn.example.com/photo.webp?size=large",
      target: img,
      pageTitle: "Gallery",
      pageUrl: "https://example.com/gallery",
    });

    expect(item.width).toBe(1280);
    expect(item.height).toBe(720);
    expect(item.format).toBe("WEBP");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm run test -- src/core/__tests__/image-item-factory.test.ts
```

Expected: FAIL because `src/core/utils/image-item-factory.ts` does not exist.

- [ ] **Step 3: Implement the factory**

Create `src/core/utils/image-item-factory.ts`:

```ts
import type { ImageItem } from "../../types";
import { ImageTypeDetector } from "./image-type-detector";

interface CreateImageItemFromElementOptions {
  id: string;
  url: string;
  target: HTMLElement;
  pageTitle: string;
  pageUrl: string;
}

export function createImageItemFromElement({
  id,
  url,
  target,
  pageTitle,
  pageUrl,
}: CreateImageItemFromElementOptions): ImageItem {
  let width = target.getBoundingClientRect().width;
  let height = target.getBoundingClientRect().height;

  if (target instanceof HTMLImageElement) {
    if (target.naturalWidth) width = target.naturalWidth;
    if (target.naturalHeight) height = target.naturalHeight;
  }

  return {
    id,
    url,
    width: Math.round(width),
    height: Math.round(height),
    format: ImageTypeDetector.getFormatFromUrl(url),
    filename: url.split("/").pop()?.split(/[?#]/)[0] || "image",
    isSelected: true,
    pageTitle,
    pageUrl,
    sizeKB: 0,
  };
}
```

- [ ] **Step 4: Use the factory in FloatingController**

In `src/core/floating-controller.tsx`, add:

```ts
import { createImageItemFromElement } from "./utils/image-item-factory";
```

Replace the local `ImageItem` construction in `triggerDownload` with:

```ts
      const item = createImageItemFromElement({
        id: "f-" + Date.now(),
        url: inst.url,
        target: inst.target,
        pageTitle: document.title,
        pageUrl: window.location.href,
      });
```

Remove unused `type ImageItem` from the import from `../types`.

- [ ] **Step 5: Verify Task 2**

Run:

```bash
npm run test -- src/core/__tests__/image-item-factory.test.ts src/core/__tests__/image-type-detector.test.ts
npm run type-check
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/core/utils/image-item-factory.ts src/core/__tests__/image-item-factory.test.ts src/core/floating-controller.tsx
git commit -m "fix(core): infer floating download image format"
```

---

### Task 3: Report ZIP Compression Progress

**Files:**
- Modify: `src/core/processor.ts`
- Create: `src/core/__tests__/processor.test.ts`

- [ ] **Step 1: Write failing processor progress test**

Create `src/core/__tests__/processor.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { ImageProcessor } from "../processor";
import type { IPlatformAdapter } from "../adapters/interface";
import { defaultSettings, type ImageItem } from "../../types";

function makeImage(url: string): ImageItem {
  return {
    id: url,
    url,
    width: 10,
    height: 10,
    format: "PNG",
    filename: "image.png",
    isSelected: true,
    pageTitle: "Page",
    pageUrl: "https://example.com/page",
    sizeKB: 1,
  };
}

function makeAdapter(): IPlatformAdapter {
  return {
    env: "web",
    fetchBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
    download: vi.fn(async () => undefined),
    storage: {
      get: vi.fn(async (_key, defaultVal) => defaultVal),
      set: vi.fn(async () => undefined),
    },
    getSettings: vi.fn(async () => defaultSettings),
  };
}

describe("ImageProcessor", () => {
  it("reports ZIP compression as part of total progress", async () => {
    const adapter = makeAdapter();
    const processor = new ImageProcessor(adapter);
    const progress: Array<[number, number]> = [];

    await processor.downloadAsZip([makeImage("https://example.com/a.png")], {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original",
      },
    }, (current, total) => {
      progress.push([current, total]);
    });

    expect(progress[0]).toEqual([1, 2]);
    expect(progress.at(-1)).toEqual([2, 2]);
    expect(adapter.download).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm run test -- src/core/__tests__/processor.test.ts
```

Expected: FAIL because current ZIP progress reports total as image count only.

- [ ] **Step 3: Implement ZIP compression progress**

In `src/core/processor.ts`, replace the `runConcurrent` progress argument in `downloadAsZip`:

```ts
      onProgress,
```

With:

```ts
      onProgress
        ? (current) => onProgress(current, total + 1)
        : undefined,
```

Replace:

```ts
    const content = await zip.generateAsync({ type: "blob" });
```

With:

```ts
    const progressTotal = total + 1;
    const content = await zip.generateAsync(
      { type: "blob" },
      (metadata) => {
        if (onProgress) {
          onProgress(total + metadata.percent / 100, progressTotal);
        }
      },
    );
    onProgress?.(progressTotal, progressTotal);
```

- [ ] **Step 4: Verify Task 3**

Run:

```bash
npm run test -- src/core/__tests__/processor.test.ts
npm run test
npm run type-check
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/core/processor.ts src/core/__tests__/processor.test.ts
git commit -m "fix(core): include zip compression in progress"
```

---

### Task 4: Add Direct URL Download Fast Path

**Files:**
- Modify: `src/core/adapters/interface.ts`
- Modify: `src/core/adapters/extension.ts`
- Modify: `src/core/adapters/web.ts`
- Modify: `src/entry/background.ts`
- Modify: `src/core/processor.ts`
- Modify: `src/core/__tests__/processor.test.ts`

- [ ] **Step 1: Add failing processor test for the fast path**

Append this test to `src/core/__tests__/processor.test.ts`:

```ts
  it("uses direct URL download for original HTTP images when the adapter supports it", async () => {
    const adapter = {
      ...makeAdapter(),
      downloadUrl: vi.fn(async () => undefined),
    };
    const processor = new ImageProcessor(adapter);

    await processor.downloadBatch([makeImage("https://example.com/a.png")], {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original",
        reEncodeWebp: false,
      },
    });

    expect(adapter.downloadUrl).toHaveBeenCalledWith(
      "https://example.com/a.png",
      expect.stringContaining(".png"),
      expect.any(String),
      "https://example.com/page",
    );
    expect(adapter.fetchBlob).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm run test -- src/core/__tests__/processor.test.ts
```

Expected: FAIL because `downloadUrl` is not part of the adapter interface and processor always calls `fetchBlob`.

- [ ] **Step 3: Extend the adapter interface**

In `src/core/adapters/interface.ts`, add this optional method to `IPlatformAdapter`:

```ts
  downloadUrl?(
    url: string,
    filename: string,
    conflictAction?: "uniquify" | "overwrite",
    referer?: string,
  ): Promise<void>;
```

- [ ] **Step 4: Implement the processor fast path**

In `src/core/processor.ts`, add this private method:

```ts
  private canDownloadOriginalUrlDirectly(
    img: ImageItem,
    settings: Settings,
  ): boolean {
    if (!this.adapter.downloadUrl) return false;
    if (!/^https?:\/\//i.test(img.url)) return false;
    if (settings.downloadLogic?.targetFormat !== "original") return false;
    if (
      img.format.toLowerCase() === "gif" &&
      settings.gifStrategy === "skip"
    ) {
      return false;
    }
    if (
      img.format.toLowerCase() === "webp" &&
      settings.downloadLogic?.reEncodeWebp
    ) {
      return false;
    }
    return true;
  }
```

Inside `downloadBatch` worker, before `const result = await this.processSingleImage(...)`, insert:

```ts
          if (this.canDownloadOriginalUrlDirectly(img, settings)) {
            const extension = img.format === "UNKNOWN" ? undefined : img.format;
            const filename = generateFilename(
              img,
              settings,
              { index: index + 1, total },
              extension?.toLowerCase(),
            );
            const conflictAction =
              settings.downloadControl?.conflictResolution === "overwrite"
                ? "overwrite"
                : "uniquify";
            await this.adapter.downloadUrl!(
              img.url,
              filename,
              conflictAction,
              img.pageUrl ||
                (typeof window !== "undefined" ? window.location.href : ""),
            );
            return;
          }
```

- [ ] **Step 5: Implement adapter methods**

In `src/core/adapters/extension.ts`, add:

```ts
  async downloadUrl(
    url: string,
    filename: string,
    conflictAction?: "uniquify" | "overwrite",
    referer?: string,
  ): Promise<void> {
    if (!this.isValidContext()) return;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "DOWNLOAD_URL_REQUEST",
          payload: {
            url,
            filename,
            conflictAction: conflictAction || "uniquify",
            referer,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response && !response.success) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        },
      );
    });
  }
```

In `src/core/adapters/web.ts`, add:

```ts
  async downloadUrl(
    url: string,
    filename: string,
  ): Promise<void> {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
```

- [ ] **Step 6: Add background message handling**

In `src/entry/background.ts`, add before `DOWNLOAD_REQUEST` handling:

```ts
  if (message.type === "DOWNLOAD_URL_REQUEST") {
    const { url, filename, conflictAction } = message.payload;
    chrome.downloads.download(
      {
        url,
        filename,
        conflictAction: conflictAction || "uniquify",
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true, downloadId });
        }
      },
    );
    return true;
  }
```

- [ ] **Step 7: Verify Task 4**

Run:

```bash
npm run test -- src/core/__tests__/processor.test.ts
npm run test
npm run type-check
npm run lint
npx vite build
```

Expected: all commands exit 0. The build may still warn about large chunks; that warning is handled in a later optimization pass, not this task.

- [ ] **Step 8: Manual extension smoke test**

Load `dist/` as an unpacked extension in Chrome and verify:

```text
1. Open https://picsum.photos/.
2. Open Imaget and sniff images.
3. Select one JPG image and download with target format "original".
4. Confirm the file downloads with the configured filename.
5. Change target format to PNG and download the same image.
6. Confirm conversion still works, which means the Blob path is preserved.
```

- [ ] **Step 9: Commit Task 4**

```bash
git add src/core/adapters/interface.ts src/core/adapters/extension.ts src/core/adapters/web.ts src/entry/background.ts src/core/processor.ts src/core/__tests__/processor.test.ts
git commit -m "fix(core): add direct original image download path"
```

---

### Task 5: Release Hygiene and Documentation Cleanup

**Files:**
- Modify: `public/manifest.json`
- Modify: `package.json`
- Modify: `GEMINI.md`

- [ ] **Step 1: Narrow extension match patterns**

In `public/manifest.json`, replace each `<all_urls>` with both HTTP(S) patterns:

```json
"host_permissions": [
  "http://*/*",
  "https://*/*"
]
```

For `content_scripts[0].matches`:

```json
"matches": [
  "http://*/*",
  "https://*/*"
]
```

For `web_accessible_resources[0].matches`:

```json
"matches": [
  "http://*/*",
  "https://*/*"
]
```

- [ ] **Step 2: Split quick build and full checks**

In `package.json`, replace the build script block with:

```json
    "build": "npm run sync-version && npm run build:docs && vite build",
    "build:check": "npm run format && npm run lint && npm run type-check && npm run test && npm run build",
```

Keep the existing `format`, `lint`, `type-check`, and `test` scripts unchanged.

- [ ] **Step 3: Update AI guidance to React 19**

In `GEMINI.md`, change the first line from:

```md
CRITICAL: You are building a React 18 UI inside a Chrome Extension Shadow DOM. Violating these 5 rules is a Fatal Error.
```

To:

```md
CRITICAL: You are building a React 19 UI inside a Chrome Extension Shadow DOM. Violating these 5 rules is a Fatal Error.
```

- [ ] **Step 4: Verify Task 5**

Run:

```bash
npm run build:check
```

Expected: command exits 0. If Prettier changes files, inspect the diff and include those formatting changes in the commit.

- [ ] **Step 5: Commit Task 5**

```bash
git add public/manifest.json package.json GEMINI.md
git commit -m "chore(release): tighten manifest and build checks"
```

---

## Final Verification

- [ ] Run the full automated gate:

```bash
npm run build:check
```

Expected: exit 0.

- [ ] Confirm the working tree is clean:

```bash
git status --short
```

Expected: no output.

- [ ] Run manual extension smoke tests:

```text
1. Load dist/ as an unpacked extension.
2. Open a normal HTTP(S) image-heavy page.
3. Confirm opening the side panel sniffs images.
4. Change language and save-folder settings; confirm the page is not rescanned.
5. Toggle "identify background images"; confirm a rescan happens.
6. Hover a PNG image and use the floating button; confirm the downloaded filename/format is not treated as JPG.
7. Download selected images as ZIP; confirm progress reaches 100 only after ZIP generation completes.
8. Download one original HTTP image; confirm it completes through the direct URL path.
9. Download one converted image; confirm conversion still completes through the Blob path.
```

---

## Execution Notes

- Execute tasks in order. Task 1 and Task 2 are behavior correctness fixes; Task 3 and Task 4 touch download flow; Task 5 is release hygiene.
- Keep one commit per task.
- Do not refactor `FloatingButton` visual JSX or styling while doing Task 2; only replace metadata construction.
- If Task 4 direct URL download fails on a hotlink-protected site during manual testing, keep the fast path limited to sites that download successfully and document the failing host in the commit body.
