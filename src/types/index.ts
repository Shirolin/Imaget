export type ImageFormat =
  | "PNG"
  | "JPG"
  | "WEBP"
  | "SVG"
  | "GIF"
  | "AVIF"
  | "BMP"
  | "ICO"
  | "UNKNOWN";
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
  aspectRatio: AspectRatioType;
  sortBy: "order" | "size" | "resolution";
  sortDirection: "asc" | "desc";
  layout: "grid" | "columns" | "list";
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
    showFloatingButton: boolean;
    minImageSize: number;
    disabledDomains?: string[];
  };
  downloadLogic: {
    targetFormat: "original" | "webp" | "png" | "jpg";
    quality: number;
    reEncodeWebp: boolean;
  };
  gifStrategy: "keep" | "firstFrame" | "skip";
  downloadControl: {
    conflictResolution: "uniquify" | "overwrite" | "prompt";
    maxConcurrency: number;
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
    maxConcurrency: 0, // 0 means no limit
  },
  debug: {
    simulateDownloadFailure: false,
  },
};
