import { ImageItem, Settings } from "./src/types";

// 模拟逻辑测试函数 (简化版，不包含 DOM 操作)
function simulateConvertLogic(blobType: string, img: ImageItem, settings: Settings) {
  const targetFormat = settings.downloadLogic?.targetFormat || "original";
  const gifStrategy = settings.gifStrategy || "keep";
  
  const originalFormat = img.format.toLowerCase();
  const actualMimeType = blobType.toLowerCase();

  const isGif = originalFormat === "gif" || actualMimeType === "image/gif";
  
  let shouldConvert = false;
  let extension = "png";
  
  // 模拟后缀逻辑
  const urlExt = img.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
  if (originalFormat !== "unknown" && originalFormat.length <= 5) {
    extension = originalFormat;
  } else {
    extension = urlExt && urlExt.length <= 5 ? urlExt : "png";
  }
  if (extension === "jpeg") extension = "jpg";

  console.log(`- 输入: URL=${img.url}, SnifferFormat=${img.format}, BlobType=${blobType}`);
  console.log(`- 识别结果: isGif=${isGif}, 策略=${gifStrategy}, 目标格式=${targetFormat}`);

  if (isGif) {
    if (gifStrategy === "keep") {
      return { action: "KEEP", extension: "gif" };
    } else if (gifStrategy === "firstFrame") {
      shouldConvert = true;
    } else if (gifStrategy === "skip") {
      return { action: "SKIP" };
    }
  }

  if (targetFormat !== "original") {
    if (targetFormat !== originalFormat || isGif) {
      shouldConvert = true;
    }
  }

  return { action: shouldConvert ? "CONVERT" : "DOWNLOAD", extension };
}

// 测试用例
const settings: Settings = {
  gifStrategy: "keep",
  downloadLogic: { targetFormat: "webp", quality: 80 }
} as any;

console.log("场景 1: GIF 保持原图 (即使开启了 WebP 转换)");
console.log(simulateConvertLogic("image/gif", { url: "test.gif", format: "GIF" } as any, settings));

console.log("\n场景 2: 伪装 URL 的 GIF (Sniffer 识别错误)");
console.log(simulateConvertLogic("image/gif", { url: "test.jpg", format: "JPG" } as any, settings));

console.log("\n场景 3: 跳过 GIF");
console.log(simulateConvertLogic("image/gif", { url: "test.gif", format: "GIF" } as any, { ...settings, gifStrategy: "skip" } as any));

console.log("\n场景 4: GIF 提取首帧");
console.log(simulateConvertLogic("image/gif", { url: "test.gif", format: "GIF" } as any, { ...settings, gifStrategy: "firstFrame" } as any));
