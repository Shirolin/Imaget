import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Box, Overlay, Progress, Modal, Transition, Text } from "@mantine/core";
import { modals, ModalsProvider } from "@mantine/modals";

import { t, getLocale } from "../core/utils/i18n";
import "@mantine/core/styles.css";

import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import { ImageGrid } from "./components/ImageGrid";
import Footer from "./components/Footer";
import { ImagePreview } from "./components/ImagePreview";
import SettingsPage from "./components/SettingsPage";
import { useSettings } from "./hooks/useSettings";
import { I18nProvider } from "./contexts/I18nProvider";

import { Sniffer } from "../core/sniffer";
import { filterImages } from "../core/filter";
import { ImageProcessor } from "../core/processor";
import { WebAdapter } from "../core/adapters/web";
import { ExtensionAdapter } from "../core/adapters/extension";
import {
  getSnifferSettingsKey,
  type SnifferSettings,
} from "../core/utils/settings-policy";
import { upsertImageItems } from "./utils/image-state";
import {
  FOLLOW_SCAN_CANDIDATES,
  FOLLOW_SCAN_SCAN_NOW,
  isImagetReopenMessage,
} from "./utils/sniffer-events";
import { getRollingScanFollowSessionPolicy } from "./utils/rolling-scan-session";
import type { ImageItem, FilterOptions } from "../types";

const defaultFilters: FilterOptions = {
  minWidth: 200,
  minHeight: 200,
  excludeKeywords: "",
  searchQuery: "",
  allowedFormats: [],
  excludeFormats: [],
  aspectRatio: "all",
  sortBy: "order",
  sortDirection: "desc",
  layout: "grid",
  resolutionMode: "or",
};

function createAutoScrollRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `auto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createScanRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createFollowScanSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `follow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"images" | "settings">("images");
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const activeScanRequestId = useRef<string | null>(null);
  const activeFollowScanSessionId = useRef<string | null>(null);
  const activeFollowScanTabId = useRef<number | null>(null);
  const activeAutoScrollRequestId = useRef<string | null>(null);
  const autoScrollAbortController = useRef<AbortController | null>(null);

  const { settings, updateSettings, resetSettings } = useSettings();
  const downloadingUrls = useRef<Set<string>>(new Set());

  // 同步 settings.filterDefaults 到 filters 状态
  const initialSyncDone = useRef(false);
  const lastFilterDefaultsRef = useRef<string>(
    JSON.stringify(settings.filterDefaults),
  );

  useEffect(() => {
    const currentDefaultsStr = JSON.stringify(settings.filterDefaults);
    if (
      !initialSyncDone.current ||
      currentDefaultsStr !== lastFilterDefaultsRef.current
    ) {
      setFilters((prev) => ({
        ...prev,
        ...settings.filterDefaults,
      }));
      lastFilterDefaultsRef.current = currentDefaultsStr;
      initialSyncDone.current = true;
    }
  }, [settings.filterDefaults]);

  const handleClosePreview = useCallback(() => {
    setPreviewId(null);
  }, []);

  const sniffer = useMemo(() => new Sniffer(), []);
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
  const followScanEnabled =
    settings.interfaceBehavior.followScanEnabled ?? true;

  const processor = useMemo(() => {
    const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
    const adapter = isExtension ? new ExtensionAdapter() : new WebAdapter();
    return new ImageProcessor(adapter);
  }, []);

  // 执行初次嗅探（使用 useRef 保持对最新 images 的引用，用于 ID 稳定化）
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const isDeepScanningRef = useRef(isDeepScanning);
  isDeepScanningRef.current = isDeepScanning;
  const runSniffer = useCallback(
    async (resetList = false) => {
      const requestId = createScanRequestId();
      activeScanRequestId.current = requestId;
      if (resetList) {
        setImages([]);
        imagesRef.current = [];
      }

      try {
        const applyItems = (items: ImageItem[]) => {
          if (activeScanRequestId.current !== requestId || items.length === 0) {
            return;
          }
          setImages((prev) => upsertImageItems(prev, items));
        };

        const results = await sniffer.sniffAll(
          snifferSettings,
          imagesRef.current,
          {
            requestId,
            onCandidates: applyItems,
          },
        );
        applyItems(results);
      } finally {
        if (activeScanRequestId.current === requestId) {
          activeScanRequestId.current = null;
        }
      }
    },
    [sniffer, snifferSettings],
  );

  const applyFollowCandidates = useCallback(
    (sessionId: string, items: ImageItem[]) => {
      if (
        activeFollowScanSessionId.current !== sessionId ||
        items.length === 0
      ) {
        return;
      }
      setImages((prev) => upsertImageItems(prev, items));
    },
    [],
  );

  const stopFollowScan = useCallback(async () => {
    const sessionId = activeFollowScanSessionId.current;
    const tabId = activeFollowScanTabId.current;
    activeFollowScanSessionId.current = null;
    activeFollowScanTabId.current = null;
    await sniffer.stopFollowScan(sessionId || undefined, tabId);
  }, [sniffer]);

  const startFollowScan = useCallback(async () => {
    if (!followScanEnabled || isDeepScanningRef.current) return;
    const sessionId = createFollowScanSessionId();
    activeFollowScanSessionId.current = sessionId;
    activeFollowScanTabId.current = await sniffer.startFollowScan(
      snifferSettings,
      sessionId,
    );
  }, [followScanEnabled, sniffer, snifferSettings]);

  const startFollowScanSession = useCallback(async () => {
    const sessionId = createFollowScanSessionId();
    activeFollowScanSessionId.current = sessionId;
    activeFollowScanTabId.current = await sniffer.startFollowScan(
      snifferSettings,
      sessionId,
    );
  }, [sniffer, snifferSettings]);

  const restartFollowScan = useCallback(async () => {
    await stopFollowScan();
    await startFollowScan();
  }, [startFollowScan, stopFollowScan]);
  const restartFollowScanRef = useRef(restartFollowScan);
  restartFollowScanRef.current = restartFollowScan;

  useEffect(() => {
    const runSnifferWithLoading = async (resetList: boolean) => {
      setLoading(true);
      try {
        await runSniffer(resetList);
        await restartFollowScanRef.current();
      } catch {
        console.error("Sniffer failed");
      } finally {
        setLoading(false);
      }
    };

    // 设置变化触发的刷新采用增量合并，避免清空已嗅探列表
    void runSnifferWithLoading(false);

    // 监听侧边栏模式下的 Tab 切换
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      const handleTabChange = () => {
        // 切换到新页面时清空上一页残留，再重新嗅探
        void runSnifferWithLoading(true);
      };
      const handleTabUpdate = (
        _tabId: number,
        changeInfo: { status?: string },
        tab: { active?: boolean },
      ) => {
        // 仅响应当前窗口活动 Tab 的加载完成，避免后台 Tab 触发多余重嗅
        if (changeInfo.status === "complete" && tab.active) {
          void runSnifferWithLoading(true);
        }
      };

      chrome.tabs.onActivated.addListener(handleTabChange);
      chrome.tabs.onUpdated.addListener(handleTabUpdate);

      return () => {
        chrome.tabs.onActivated.removeListener(handleTabChange);
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      };
    }
  }, [runSniffer]);

  useEffect(() => {
    if (!followScanEnabled) {
      void stopFollowScan();
      return;
    }

    void restartFollowScan();
    return () => {
      void stopFollowScan();
    };
  }, [followScanEnabled, restartFollowScan, stopFollowScan]);

  useEffect(() => {
    const handleReopen = (event: MessageEvent) => {
      if (!isImagetReopenMessage(event.data)) return;

      setLoading(true);
      runSniffer(false)
        .then(() => restartFollowScan())
        .catch(() => {
          console.error("Sniffer failed");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    window.addEventListener("message", handleReopen);
    return () => window.removeEventListener("message", handleReopen);
  }, [restartFollowScan, runSniffer]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const message = event.data as {
        type?: string;
        payload?: { sessionId?: string; items?: ImageItem[] };
      };
      if (message.type !== FOLLOW_SCAN_CANDIDATES) return;
      if (message.payload?.sessionId && Array.isArray(message.payload.items)) {
        applyFollowCandidates(message.payload.sessionId, message.payload.items);
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [applyFollowCandidates]);

  useEffect(() => {
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.runtime?.onMessage &&
      window.location.protocol === "chrome-extension:";
    if (!isExtensionPage) return;

    const onRuntimeMessage = (message: unknown) => {
      if (
        !message ||
        typeof message !== "object" ||
        !("type" in message) ||
        !("payload" in message)
      ) {
        return;
      }

      const typedMessage = message as {
        type?: string;
        payload?: {
          requestId?: string;
          sessionId?: string;
          progress?: number;
          items?: ImageItem[];
        };
      };

      if (typedMessage.type === "AUTOSCROLL_PROGRESS") {
        if (
          typedMessage.payload?.requestId &&
          typedMessage.payload.requestId ===
            activeAutoScrollRequestId.current &&
          typeof typedMessage.payload.progress === "number"
        ) {
          setProgress(
            Math.max(0, Math.min(100, typedMessage.payload.progress)),
          );
        }
        return;
      }

      if (typedMessage.type === "SNIFF_PROGRESS") {
        if (
          typedMessage.payload?.requestId &&
          typedMessage.payload.requestId === activeScanRequestId.current &&
          Array.isArray(typedMessage.payload.items)
        ) {
          setImages((prev) =>
            upsertImageItems(prev, typedMessage.payload?.items ?? []),
          );
        }
      }

      if (typedMessage.type === FOLLOW_SCAN_CANDIDATES) {
        if (
          typedMessage.payload?.sessionId &&
          Array.isArray(typedMessage.payload.items)
        ) {
          applyFollowCandidates(
            typedMessage.payload.sessionId,
            typedMessage.payload.items,
          );
        }
      }
    };

    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(onRuntimeMessage);
  }, [applyFollowCandidates]);

  const currentLang = useMemo(() => {
    const lang = settings.general.language;
    if (lang === "auto") return getLocale();
    return lang.replace("_", "-"); // HTML lang attribute normalization (zh_CN -> zh-CN)
  }, [settings.general.language]);

  // 计算过滤后的列表
  const filteredImages: ImageItem[] = useMemo(() => {
    return filterImages(images, filters);
  }, [images, filters]);

  // 预览索引与导航控制 (必须在 filteredImages 之后)
  const previewIndex = useMemo(
    () => filteredImages.findIndex((img) => img.id === previewId),
    [filteredImages, previewId],
  );

  const handleNextPreview = useCallback(() => {
    if (previewIndex < filteredImages.length - 1) {
      setPreviewId(filteredImages[previewIndex + 1].id);
    }
  }, [previewIndex, filteredImages]);

  const handlePrevPreview = useCallback(() => {
    if (previewIndex > 0) {
      setPreviewId(filteredImages[previewIndex - 1].id);
    }
  }, [previewIndex, filteredImages]);

  // 选中逻辑
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
          newImages[currentIndex] = {
            ...newImages[currentIndex],
            isSelected: targetValue,
          };
        }

        lastSelectedIndexRef.current = currentIndex;
        return newImages;
      });
    },
    [], // empty deps - ref doesn't need to be in deps
  );

  const selectAll = (): void => {
    const allSelected = filteredImages.every(
      (img: ImageItem) => img.isSelected,
    );
    const filteredIds = new Set(filteredImages.map((fi: ImageItem) => fi.id));
    setImages((prev: ImageItem[]) =>
      prev.map((img: ImageItem) => {
        return filteredIds.has(img.id)
          ? { ...img, isSelected: !allSelected }
          : img;
      }),
    );
  };

  const deselectAll = (): void => {
    setImages((prev: ImageItem[]) =>
      prev.map((img: ImageItem) => ({ ...img, isSelected: false })),
    );
  };

  // 下载逻辑
  const handleDownload = async (): Promise<void> => {
    const selected: ImageItem[] = images.filter(
      (img: ImageItem) =>
        img.isSelected && !downloadingUrls.current.has(img.url),
    );
    if (selected.length === 0) return;

    const startDownload = async (items: ImageItem[]) => {
      items.forEach((img) => downloadingUrls.current.add(img.url));
      setLoading(true);
      setProgress(0);
      try {
        await processor.downloadBatch(
          items,
          settings,
          (curr: number, total: number) => {
            setProgress(Math.round((curr / total) * 100));
          },
        );
      } finally {
        items.forEach((img) => downloadingUrls.current.delete(img.url));
        setLoading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    };

    // 多文件下载警告
    if (
      selected.length > 30 &&
      !settings.interfaceBehavior.hideDownloadWarning
    ) {
      modals.openConfirmModal({
        title: t("warning"),
        children: (
          <Text size="sm">
            {t("warnManyFiles", [selected.length.toString()])}
          </Text>
        ),
        labels: { confirm: t("confirm"), cancel: t("cancel") },
        onConfirm: () => startDownload(selected),
      });
      return;
    }

    await startDownload(selected);
  };

  const handleZip = async (): Promise<void> => {
    const selected: ImageItem[] = images.filter(
      (img: ImageItem) => img.isSelected,
    );
    if (selected.length === 0) return;

    const startZip = async (items: ImageItem[]) => {
      setLoading(true);
      setProgress(0);
      try {
        await processor.downloadAsZip(
          items,
          settings,
          (curr: number, total: number) => {
            setProgress(Math.round((curr / total) * 100));
          },
        );
      } finally {
        setLoading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    };

    // 同样适用于 ZIP
    if (
      selected.length > 30 &&
      !settings.interfaceBehavior.hideDownloadWarning
    ) {
      modals.openConfirmModal({
        title: t("warning"),
        children: (
          <Text size="sm">
            {t("warnManyFiles", [selected.length.toString()])}
          </Text>
        ),
        labels: { confirm: t("confirm"), cancel: t("cancel") },
        onConfirm: () => startZip(selected),
      });
      return;
    }

    await startZip(selected);
  };

  const handleSingleDownload = async (item: ImageItem): Promise<void> => {
    if (downloadingUrls.current.has(item.url)) return;

    downloadingUrls.current.add(item.url);
    try {
      await processor.downloadBatch([item], settings);
    } finally {
      downloadingUrls.current.delete(item.url);
    }
  };

  // 统计
  const selectedCount = useMemo(
    () => images.filter((img) => img.isSelected).length,
    [images],
  );

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await runSniffer(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepScan = async () => {
    setLoading(true);
    setIsDeepScanning(true);
    setProgress(0);
    const requestId = createAutoScrollRequestId();
    const controller = new AbortController();
    const followSessionPolicy = getRollingScanFollowSessionPolicy({
      hasActiveSession: Boolean(activeFollowScanSessionId.current),
      followScanEnabled,
    });
    activeAutoScrollRequestId.current = requestId;
    autoScrollAbortController.current = controller;
    try {
      if (followSessionPolicy.startSession) {
        await startFollowScanSession();
      }
      await sniffer.autoScroll(
        snifferSettings,
        (p) => setProgress(p),
        undefined,
        requestId,
        controller.signal,
        {
          onSettledStep: () =>
            window.postMessage({ type: FOLLOW_SCAN_SCAN_NOW }, "*"),
          onBeforeRestore: () =>
            window.postMessage({ type: FOLLOW_SCAN_SCAN_NOW }, "*"),
        },
      );
      await runSniffer(false);
    } finally {
      if (followSessionPolicy.stopAfterScan) {
        await stopFollowScan();
      }
      activeAutoScrollRequestId.current = null;
      autoScrollAbortController.current = null;
      setIsDeepScanning(false);
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleStopDeepScan = () => {
    autoScrollAbortController.current?.abort();
    const requestId = activeAutoScrollRequestId.current;
    if (requestId) {
      void sniffer.cancelAutoScroll(requestId);
    }
  };

  const handleClose = () => {
    void stopFollowScan();
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      window.close();
    } else {
      window.parent.postMessage({ type: "IMAGET_CLOSE" }, "*");
    }
  };

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewId) {
        handleClosePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewId, handleClosePreview]);

  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);

  return (
    <Box
      pos="fixed"
      inset={0}
      lang={currentLang}
      style={{
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        ref={setPortalNode}
        pos="absolute"
        inset={0}
        style={{
          zIndex: 99999,
          pointerEvents: "none",
        }}
      />

      <I18nProvider language={settings.general.language}>
        <ModalsProvider
          modalProps={{
            portalProps: { target: portalNode || undefined },
            zIndex: 99999,
            centered: true,
          }}
        >
          <Overlay
            color="var(--mantine-color-dark-9)"
            backgroundOpacity={0.5}
            blur={10}
            onClick={handleClose}
            zIndex={0}
          />{" "}
          <Box
            w={{ base: "100vw", sm: "85vw" }}
            h={{ base: "100vh", sm: "90vh" }}
            maw={1200}
            bg="dark.7"
            style={{
              borderRadius: "var(--mantine-radius-lg)",
              boxShadow: "var(--mantine-shadow-xl)",
              margin: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--mantine-color-dark-4)",
              zIndex: 1,
              transition: "all 0.2s ease",
            }}
          >
            <Header
              onClose={handleClose}
              onRefresh={handleRefresh}
              onDeepScan={handleDeepScan}
              onStopDeepScan={handleStopDeepScan}
              followScanEnabled={followScanEnabled}
              onFollowScanToggle={(enabled) =>
                updateSettings((prev) => ({
                  ...prev,
                  interfaceBehavior: {
                    ...prev.interfaceBehavior,
                    followScanEnabled: enabled,
                  },
                }))
              }
              isScanning={loading}
              isDeepScanning={isDeepScanning}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              portalNode={portalNode}
            />
            {progress > 0 && (
              <Progress
                value={progress}
                size="xs"
                radius={0}
                color="brand"
                animated
                style={{ transition: "opacity 0.3s ease" }}
              />
            )}

            <Box style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <Transition
                mounted={activeTab === "images"}
                transition="fade"
                duration={150}
                timingFunction="ease"
                exitDuration={100}
              >
                {(styles) => (
                  <Box
                    style={{
                      ...styles,
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <FilterBar
                      options={filters}
                      onChange={setFilters}
                      portalNode={portalNode}
                    />

                    <ImageGrid
                      items={filteredImages}
                      loading={loading}
                      layout={filters.layout}
                      onSelect={toggleSelect}
                      onPreview={setPreviewId}
                      onDownload={handleSingleDownload}
                      portalNode={portalNode}
                    />
                    <Footer
                      selectedCount={selectedCount}
                      filteredCount={filteredImages.length}
                      totalCount={images.length}
                      onSelectAll={selectAll}
                      onDeselectAll={deselectAll}
                      onDownload={handleDownload}
                      onZip={handleZip}
                      loading={loading}
                      portalNode={portalNode}
                    />
                  </Box>
                )}
              </Transition>

              <Transition
                mounted={activeTab === "settings"}
                transition="fade"
                duration={150}
                timingFunction="ease"
                exitDuration={100}
              >
                {(styles) => (
                  <Box
                    style={{
                      ...styles,
                      position: "absolute",
                      inset: 0,
                      overflowY: "auto",
                    }}
                  >
                    <SettingsPage
                      settings={settings}
                      onUpdate={updateSettings}
                      onReset={resetSettings}
                      portalNode={portalNode}
                    />
                  </Box>
                )}
              </Transition>
            </Box>
          </Box>
          <Modal
            opened={!!previewId}
            onClose={handleClosePreview}
            withCloseButton={false}
            padding={0}
            fullScreen
            portalProps={{ target: portalNode || undefined }}
            transitionProps={{ transition: "fade", duration: 200 }}
            styles={{
              content: {
                backgroundColor: "transparent",
                boxShadow: "none",
                pointerEvents: "auto",
              },
              body: {
                padding: 0,
                height: "100%",
                overflow: "hidden",
              },
            }}
          >
            {previewId && filteredImages[previewIndex] && (
              <ImagePreview
                item={filteredImages[previewIndex]}
                onClose={handleClosePreview}
                onNext={
                  previewIndex < filteredImages.length - 1
                    ? handleNextPreview
                    : undefined
                }
                onPrev={previewIndex > 0 ? handlePrevPreview : undefined}
                total={filteredImages.length}
                currentIndex={previewIndex}
                portalNode={portalNode}
              />
            )}
          </Modal>
        </ModalsProvider>
      </I18nProvider>
    </Box>
  );
};
export default App;
