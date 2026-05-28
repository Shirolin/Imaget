# Imaget Settings Effectiveness Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every setting item in the SettingsPage is effective and implement missing debug/logic features.

**Architecture:** 
1. Fix `reEncodeWebp` logic in `image-converter.ts`.
2. Implement `simulateDownloadFailure` in `ImageProcessor.ts` (or adapters).
3. Add/Update unit tests to verify these settings.
4. Perform manual verification for UI-heavy settings (e.g., `showInSidebar`).

**Tech Stack:** React 19, TypeScript, Vitest, Mantine v8.

---

### Task 1: Fix `reEncodeWebp` Effectiveness

**Files:**
- Modify: `src/core/utils/image-converter.ts`
- Test: `src/core/__tests__/processor.test.ts` (or create a new test for converter)

- [ ] **Step 1: Update `image-converter.ts` to respect `reEncodeWebp`**

Modify `src/core/utils/image-converter.ts` to force conversion when `reEncodeWebp` is enabled for WebP images.

```typescript
// src/core/utils/image-converter.ts

// Inside convertImage function:
  const isGif = originalFormat === "gif" || actualMimeType === "image/gif";
  const isWebp = originalFormat === "webp" || actualMimeType === "image/webp";

  let shouldConvert = false;
  // ... (extension logic)

  if (isGif) {
    // ... (gif strategy logic)
  }

  // Force re-encode for WebP if requested
  if (isWebp && settings.downloadLogic?.reEncodeWebp) {
    shouldConvert = true;
  }

  // Global format conversion
  if (targetFormat !== "original") {
    // ...
  }
```

- [ ] **Step 2: Add unit test to verify `reEncodeWebp`**

Add a test case in `src/core/__tests__/processor.test.ts` or a new `src/core/utils/__tests__/image-converter.test.ts`.

- [ ] **Step 3: Run tests and verify**

Run: `pnpm vitest run src/core/__tests__/processor.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/core/utils/image-converter.ts src/core/__tests__/processor.test.ts
git commit -m "fix(core): ensure reEncodeWebp setting is effective"
```

---

### Task 2: Fix `conflictResolution` Mapping and Implement `simulateDownloadFailure`

**Files:**
- Modify: `src/core/processor.ts`
- Test: `src/core/__tests__/processor.test.ts`

- [ ] **Step 1: Fix `conflictResolution` mapping in `ImageProcessor.ts`**

Ensure `prompt` is correctly passed through if selected.

```typescript
// src/core/processor.ts

// Update logic to:
const conflictAction = settings.downloadControl?.conflictResolution || "uniquify";
```

- [ ] **Step 2: Update `ImageProcessor.ts` to support failure simulation**

Add check for `settings.debug.simulateDownloadFailure` in `processSingleImage` or `downloadBatch`.
Prefer adding it to `processSingleImage` to ensure it affects ZIP downloads too, or at the start of the task handler in `downloadBatch`/`downloadAsZip`.

```typescript
// src/core/processor.ts

// Inside handler for runConcurrent in downloadBatch:
if (settings.debug?.simulateDownloadFailure) {
  throw new Error("Simulated download failure");
}
```

- [ ] **Step 3: Add unit tests for both fixes**

Verify `conflictAction` is correctly passed to adapters and `simulateDownloadFailure` works.

- [ ] **Step 4: Run tests and verify**

- [ ] **Step 5: Commit**

```bash
git add src/core/processor.ts src/core/__tests__/processor.test.ts
git commit -m "fix(core): correct conflictResolution mapping and implement simulateDownloadFailure"
```

---

### Task 3: Fix `filterDefaults` Synchronization in `App.tsx`

**Files:**
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Update `useEffect` for `filterDefaults` in `App.tsx`**

Ensure all default fields, especially `allowedFormats` and `excludeFormats`, are synchronized to the local `filters` state on initial load.

```typescript
// src/ui/App.tsx

// Around line 93:
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
*(Note: I already checked this code and it uses `...settings.filterDefaults`, which SHOULD include `allowedFormats`. I will re-verify why the user reported it as ineffective. It might be because `initialSyncDone` prevents updates if settings load late or if the user expects live-sync.)*

- [ ] **Step 2: Investigate if live-sync is needed for `filterDefaults`**

If the user changes defaults in settings, they might expect the current session's filters to update. However, the current logic only syncs once. I will consider if deep-comparison sync is better.

---

### Task 4: Audit and Verify Remaining Settings

**Files:**
- Test: `src/core/__tests__/settings-policy.test.ts`
- Test: `src/core/__tests__/filename-generator.test.ts`

- [ ] **Step 1: Verify `minWidth`/`minHeight` defaults**

Ensure `filterDefaults` are correctly applied in `App.tsx` and the filter logic works. (Existing tests might cover this, but verify).

- [ ] **Step 2: Verify `subfolder` and `filenameTemplate`**

Ensure `generateFilename` correctly uses these from settings.

- [ ] **Step 3: Verify `showInSidebar` logic in `background.ts`**

(Manual verification or logic check). Ensure the `storage.onChanged` listener in `background.ts` correctly calls `updateSidePanelBehavior`.

- [ ] **Step 4: Commit any test updates**

```bash
git commit -m "test(core): comprehensive verification of settings effectiveness"
```

---

### Task 4: Final Cleanup

- [ ] **Step 1: Remove any unused settings if found**

If `showInSidebar` is determined to be unused (unlikely after background check), remove it. (It seems used).

- [ ] **Step 2: Verify all tests pass**

Run: `pnpm vitest run`

- [ ] **Step 3: Final Commit**

```bash
git commit -m "chore: settings effectiveness audit complete"
```
