export type ImageFormat =
  | "PNG"
  | "JPG"
  | "WEBP"
  | "SVG"
  | "GIF"
  | "AVIF"
  | "BMP"
  | "ICO"
  | "TIFF"
  | "HEIC"
  | "HEIF"
  | "DPG"
  | "UNKNOWN";

/**
 * 获取格式对应的语义化色彩
 */
export const getFormatColor = (format: string): string => {
  const f = format.toUpperCase();
  if (f === "JPG" || f === "JPEG") return "orange.4";
  if (f === "PNG") return "blue.4";
  if (f === "SVG") return "violet.4";
  if (f === "WEBP") return "teal.4";
  if (f === "GIF") return "pink.4";
  if (f === "AVIF") return "cyan.4";
  if (f === "BMP") return "yellow.4";
  if (f === "ICO") return "lime.4";
  if (f === "TIFF" || f === "TIF") return "indigo.4";
  if (f === "HEIC" || f === "HEIF") return "grape.4";
  if (f === "DPG") return "red.5";
  return "gray.4";
};

export type AspectRatioType = "all" | "square" | "landscape" | "portrait";

export interface ImageItem {
  id: string; // 唯一标识符
  url: string; // 图片真实地址
  width: number; // 像素宽
  height: number; // 像素高
  sizeKB: number; // 文件大小
  format: ImageFormat; // 图片格式
  isSelected: boolean; // 选中状态
  pageTitle?: string; // 来源页面标题
  pageUrl?: string; // 来源页面 URL
  filename?: string; // 文件名
}

export interface FilterOptions {
  minWidth: number;
  minHeight: number;
  excludeKeywords: string;
  searchQuery: string;
  allowedFormats: ImageFormat[];
  excludeFormats: ImageFormat[];
  aspectRatio: AspectRatioType;
  sortBy: "order" | "size" | "resolution";
  sortDirection: "asc" | "desc";
  layout: "grid" | "columns" | "list";
  resolutionMode: "or" | "and";
}

export interface Settings {
  general: {
    language:
      | "zh_CN"
      | "zh_TW"
      | "en"
      | "ja"
      | "ko"
      | "de"
      | "fr"
      | "es"
      | "pt_BR"
      | "tr"
      | "auto";
  };
  fileSaving: {
    subfolder: string;
    filenameTemplate: string;
  };
  interfaceBehavior: {
    showInSidebar: boolean;
    hideDownloadWarning: boolean;
    searchAllFrames: boolean;
    identifyBackgroundImages: boolean;
    identifyBlobImages: boolean;
    followScanEnabled: boolean;
    showFloatingButton: boolean;
    minImageSize: number;
    disabledDomains?: string[];
  };
  downloadLogic: {
    targetFormat: "original" | "webp" | "png" | "jpg" | "avif" | "bmp";
    quality: number;
    reEncodeWebp: boolean;
  };
  gifStrategy: "keep" | "firstFrame" | "skip";
  downloadControl: {
    conflictResolution: "uniquify" | "overwrite" | "prompt";
    maxConcurrency: number;
  };
  filterDefaults: {
    minWidth: number;
    minHeight: number;
    excludeKeywords: string;
    searchQuery: string;
    allowedFormats: ImageFormat[];
    excludeFormats: ImageFormat[];
    aspectRatio: AspectRatioType;
    resolutionMode: "or" | "and";
  };
  debug?: {
    simulateDownloadFailure: boolean;
  };
}

export const defaultSettings: Settings = {
  general: {
    language: "auto",
  },
  fileSaving: {
    subfolder: "Imaget",
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
  downloadLogic: {
    targetFormat: "original",
    quality: 85,
    reEncodeWebp: false,
  },
  gifStrategy: "keep",
  downloadControl: {
    conflictResolution: "uniquify",
    maxConcurrency: 5,
  },
  filterDefaults: {
    minWidth: 200,
    minHeight: 200,
    excludeKeywords: "",
    searchQuery: "",
    allowedFormats: [],
    excludeFormats: [],
    aspectRatio: "all",
    resolutionMode: "or",
  },
  debug: {
    simulateDownloadFailure: false,
  },
};
