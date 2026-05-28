import { describe, it, expect } from "vitest";
import { generateFilename } from "../utils/filename-generator";
import type { ImageItem, Settings } from "../../types";

const makeImage = (
  overrides: Partial<ImageItem> & { url: string },
): ImageItem => ({
  id: "abc123def",
  width: 100,
  height: 100,
  sizeKB: 10,
  format: "PNG" as const,
  isSelected: false,
  ...overrides,
});

const defaultSettings: Settings = {
  general: { language: "en" },
  fileSaving: {
    subfolder: "",
    filenameTemplate: "{page_title}_{date}_{time}_{index}",
  },
  interfaceBehavior: {
    showInSidebar: false,
    hideDownloadWarning: false,
    searchAllFrames: true,
    identifyBackgroundImages: true,
    identifyBlobImages: false,
    followScanEnabled: true,
    showFloatingButton: true,
    minImageSize: 128,
    disabledDomains: [],
  },
  downloadLogic: { targetFormat: "original", quality: 85, reEncodeWebp: false },
  gifStrategy: "keep",
  downloadControl: { conflictResolution: "uniquify", maxConcurrency: 5 },
  filterDefaults: {
    minWidth: 0,
    minHeight: 0,
    excludeKeywords: "",
    searchQuery: "",
    allowedFormats: [],
    excludeFormats: [],
    aspectRatio: "all",
    resolutionMode: "or",
  },
};

describe("generateFilename", () => {
  it("应该使用默认模板生成文件名", () => {
    const img = makeImage({
      url: "https://example.com/photo.png",
      pageTitle: "MyPage",
    });
    const result = generateFilename(img, defaultSettings, {
      index: 1,
      total: 10,
    });
    expect(result).toMatch(/^MyPage_\d{8}_\d{6}_01\.png$/);
  });

  it("应该从 URL 中提取原始文件名", () => {
    const img = makeImage({ url: "https://example.com/photo.png" });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: "", filenameTemplate: "{origin}" },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toBe("photo.png");
  });

  it("应该处理 data URL", () => {
    const img = makeImage({ url: "data:image/png;base64,abc123" });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: "", filenameTemplate: "{origin}" },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toMatch(/^data_image_\w+\.png$/);
  });

  it("应该替换模板变量 {index} 并补零", () => {
    const img = makeImage({ url: "https://example.com/img.jpg" });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: "", filenameTemplate: "{index}" },
    };
    const result = generateFilename(img, settings, { index: 7, total: 100 });
    expect(result).toMatch(/^007\.(jpg|jpeg)$/);
  });

  it("应该创建子文件夹路径", () => {
    const img = makeImage({
      url: "https://example.com/img.jpg",
      pageTitle: "MyPage",
    });
    const settings = {
      ...defaultSettings,
      fileSaving: {
        subfolder: "images/{page_title}",
        filenameTemplate: "{origin}",
      },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).toBe("images/MyPage/img.jpg");
  });

  it("应该过滤文件名中的非法字符", () => {
    const img = makeImage({ url: "https://example.com/photo.jpg" });
    const settings = {
      ...defaultSettings,
      fileSaving: { subfolder: "", filenameTemplate: "test:file/name" },
    };
    const result = generateFilename(img, settings, { index: 1, total: 1 });
    expect(result).not.toContain(":");
    expect(result).not.toContain("/");
  });

  it("应该使用自定义扩展名", () => {
    const img = makeImage({ url: "https://example.com/photo.png" });
    const result = generateFilename(
      img,
      defaultSettings,
      { index: 1, total: 1 },
      "webp",
    );
    expect(result).toMatch(/\.webp$/);
  });
});
