import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Overlay, Progress, Modal, Transition } from "@mantine/core";
import { t, setLocale } from "../core/utils/i18n";
import "@mantine/core/styles.css";

import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ImageGrid from "./components/ImageGrid";
import Footer from "./components/Footer";
import { ImagePreview } from "./components/ImagePreview";
import SettingsPage from "./components/SettingsPage";

import { useSettings } from "./hooks/useSettings";

import { Sniffer } from "../core/sniffer";
import { filterImages } from "../core/filter";
import { ImageProcessor } from "../core/processor";
import { WebAdapter } from "../core/adapters/web";
import { ExtensionAdapter } from "../core/adapters/extension";
import { ImageItem, FilterOptions } from "../types";

const defaultFilters: FilterOptions = {
  minWidth: 200,
  minHeight: 200,
  excludeKeywords: "",
  searchQuery: "",
  allowedFormats: [],
  aspectRatio: "all",
  sortBy: "order",
  sortDirection: "desc",
  layout: "grid",
};

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"images" | "settings">("images");

  const { settings, updateSettings, resetSettings } = useSettings();

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
  }, [sniffer, settings]);

  // 同步 UI 语言
  useEffect(() => {
    const lang = settings.general.language;
    if (lang === "zh-CN") setLocale("zh");
    else if (lang === "en-US") setLocale("en");
    else setLocale("auto");
  }, [settings.general.language]);

  // 计算过滤后的列表
  const filteredImages: ImageItem[] = useMemo(() => {
    return filterImages(images, filters);
  }, [images, filters]);

  // 选中逻辑
  const toggleSelect = useCallback((id: string): void => {
    setImages((prev: ImageItem[]) =>
      prev.map((img: ImageItem) =>
        img.id === id ? { ...img, isSelected: !img.isSelected } : img,
      ),
    );
  }, []);

  const selectAll = (): void => {
    const allSelected = filteredImages.every(
      (img: ImageItem) => img.isSelected,
    );
    setImages((prev: ImageItem[]) =>
      prev.map((img: ImageItem) => {
        const isFiltered = filteredImages.some(
          (fi: ImageItem) => fi.id === img.id,
        );
        return isFiltered ? { ...img, isSelected: !allSelected } : img;
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
      (img: ImageItem) => img.isSelected,
    );
    if (selected.length === 0) return;

    // 多文件下载警告
    if (
      selected.length > 30 &&
      !settings.interfaceBehavior.hideDownloadWarning
    ) {
      if (!confirm(t("warnManyFiles", [selected.length.toString()]))) {
        return;
      }
    }

    setLoading(true);
    setProgress(0);
    await processor.downloadBatch(
      selected,
      settings,
      (curr: number, total: number) => {
        setProgress(Math.round((curr / total) * 100));
      },
    );
    setLoading(false);
    setTimeout(() => setProgress(0), 1000);
  };

  const handleZip = async (): Promise<void> => {
    const selected: ImageItem[] = images.filter(
      (img: ImageItem) => img.isSelected,
    );
    if (selected.length === 0) return;

    // 同样适用于 ZIP
    if (
      selected.length > 30 &&
      !settings.interfaceBehavior.hideDownloadWarning
    ) {
      if (!confirm(t("warnManyFiles", [selected.length.toString()]))) {
        return;
      }
    }

    setLoading(true);
    setProgress(0);
    await processor.downloadAsZip(
      selected,
      settings,
      (curr: number, total: number) => {
        setProgress(Math.round((curr / total) * 100));
      },
    );
    setLoading(false);
    setTimeout(() => setProgress(0), 1000);
  };

  const handleSingleDownload = async (item: ImageItem): Promise<void> => {
    await processor.downloadBatch([item], settings);
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
    window.parent.postMessage({ type: "IMAGET_CLOSE" }, "*");
  };

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewUrl) {
        setPreviewUrl(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewUrl]);

  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);

  return (
    <Box
      pos="fixed"
      inset={0}
      style={{
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={setPortalNode}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      />

      <Overlay
        color="black"
        backgroundOpacity={0.6}
        blur={4}
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
          margin: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--mantine-shadow-xl)",
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
        />
        {progress > 0 && (
          <Progress
            value={progress}
            size="xs"
            radius={0}
            color="blue"
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
                  onPreview={setPreviewUrl}
                  onDownload={handleSingleDownload}
                  portalNode={portalNode}
                />

                <Footer
                  selectedCount={selectedCount}
                  totalCount={images.length}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  onDownload={handleDownload}
                  onZip={handleZip}
                  loading={loading}
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
        opened={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
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
        {previewUrl && (
          <ImagePreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </Modal>
    </Box>
  );
};
export default App;
