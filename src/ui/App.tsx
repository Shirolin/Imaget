import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Box, Overlay, Progress, Modal, Transition, Text } from "@mantine/core";
import { modals, ModalsProvider } from "@mantine/modals";

import { t, setLocale, getLocale } from "../core/utils/i18n";
import "@mantine/core/styles.css";

import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ImageGrid from "./components/ImageGrid";
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

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"images" | "settings">("images");

  const { settings, updateSettings, resetSettings } = useSettings();
  const downloadingUrls = useRef<Set<string>>(new Set());

  // 当默认配置发生变化时，立即同步到当前筛选（包括初始加载和设置页修改）
  useEffect(() => {
    if (settings?.filterDefaults) {
      setFilters((prev) => ({
        ...prev,
        ...settings.filterDefaults,
      }));
    }
  }, [settings.filterDefaults]);

  const handleClosePreview = useCallback(() => {
    setPreviewId(null);
  }, []);

  const sniffer = useMemo(() => new Sniffer(), []);

  const processor = useMemo(() => {
    const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
    const adapter = isExtension ? new ExtensionAdapter() : new WebAdapter();
    return new ImageProcessor(adapter);
  }, []);

  // 执行初次嗅探
  useEffect(() => {
    const runSniffer = async () => {
      setLoading(true);
      try {
        const results = await sniffer.sniffAll(settings);
        setImages(results);
      } catch {
        console.error("Sniffer failed");
      } finally {
        setLoading(false);
      }
    };

    runSniffer();

    // 监听侧边栏模式下的 Tab 切换
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      const handleTabChange = () => runSniffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleTabUpdate = (_tabId: number, changeInfo: any) => {
        if (changeInfo.status === "complete") runSniffer();
      };

      chrome.tabs.onActivated.addListener(handleTabChange);
      chrome.tabs.onUpdated.addListener(handleTabUpdate);

      return () => {
        chrome.tabs.onActivated.removeListener(handleTabChange);
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      };
    }
  }, [sniffer, settings]);

  const currentLang = useMemo(() => {
    const lang = settings.general.language;
    if (lang === "auto") return getLocale();
    return lang.replace("_", "-"); // HTML lang attribute normalization (zh_CN -> zh-CN)
  }, [settings.general.language]);

  // 同步 UI 语言与 lang 属性
  useEffect(() => {
    setLocale(settings.general.language);
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
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const toggleSelect = useCallback(
    (id: string, isShift: boolean = false): void => {
      setImages((prev: ImageItem[]) => {
        const currentIndex = prev.findIndex((img) => img.id === id);
        if (currentIndex === -1) return prev;

        const newImages = [...prev];
        const targetValue = !prev[currentIndex].isSelected;

        if (isShift && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            newImages[i] = { ...newImages[i], isSelected: targetValue };
          }
        } else {
          newImages[currentIndex] = {
            ...newImages[currentIndex],
            isSelected: targetValue,
          };
        }

        setLastSelectedIndex(currentIndex);
        return newImages;
      });
    },
    [lastSelectedIndex],
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
      const results = await sniffer.sniffAll(settings);
      setImages(results);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepScan = async () => {
    setLoading(true);
    setProgress(0);
    try {
      await sniffer.autoScroll((p) => setProgress(p));
      const results = await sniffer.sniffAll(settings);
      setImages(results);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleClose = () => {
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
            backgroundOpacity={0.65}
            onClick={handleClose}
            zIndex={0}
          />

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
              isScanning={loading}
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
