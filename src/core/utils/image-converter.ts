import type { ImageItem, Settings } from "../../types";

/**
 * ImageConverter: Handles image format conversion using Canvas API
 */
export async function convertImage(
  blob: Blob,
  img: ImageItem,
  settings: Settings,
): Promise<{ blob: Blob; extension: string }> {
  const targetFormat = settings.downloadLogic?.targetFormat || "original";
  const gifStrategy = settings.gifStrategy || "keep";
  const quality = (settings.downloadLogic?.quality || 85) / 100;

  const originalFormat = img.format.toLowerCase();
  const actualMimeType = blob.type.toLowerCase();

  // 1. Check if conversion is needed
  // Use both metadata and actual blob type for robustness
  const isGif = originalFormat === "gif" || actualMimeType === "image/gif";
  const isWebp = originalFormat === "webp" || actualMimeType === "image/webp";
  const reEncodeWebp = settings.downloadLogic?.reEncodeWebp ?? false;

  let shouldConvert = false;

  // Safe extension extraction
  let extension = "png";
  if (img.url.startsWith("data:")) {
    extension = originalFormat !== "unknown" ? originalFormat : "png";
  } else {
    const urlExt = img.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
    // Prioritize original format if it's known and consistent with blob
    if (originalFormat !== "unknown" && originalFormat.length <= 5) {
      extension = originalFormat;
    } else {
      extension = urlExt && urlExt.length <= 5 ? urlExt : "png";
    }
  }

  // Final extension cleanup
  if (extension === "jpeg") extension = "jpg";

  // GIF Special Handling: This should take PRECEDENCE over targetFormat
  if (isGif) {
    if (gifStrategy === "keep") {
      // Force .gif extension for kept GIFs
      return { blob, extension: "gif" };
    } else if (gifStrategy === "firstFrame") {
      shouldConvert = true;
    } else if (gifStrategy === "skip") {
      // If we somehow reached here with skip strategy (e.g. processor sniffer failure)
      // we throw to allow processor to catch and skip
      throw new Error("SKIP_GIF");
    }
  }

  // WebP Re-encoding logic
  if (isWebp && reEncodeWebp) {
    shouldConvert = true;
  }

  // Global format conversion (only if not already handled by gifStrategy or if it's a non-GIF)
  if (targetFormat !== "original") {
    // If target format is different from original, or if it's a GIF being flattened
    if (targetFormat !== originalFormat || isGif) {
      shouldConvert = true;
    }
  }

  if (!shouldConvert) {
    return { blob, extension };
  }

  // 2. Perform conversion using Canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  try {
    try {
      // Fast Path: createImageBitmap (Ideal for JPG/PNG/WebP, memory efficient)
      const imageBitmap = await createImageBitmap(blob);
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      ctx.drawImage(imageBitmap, 0, 0);
      imageBitmap.close();
    } catch (fastPathErr) {
      // Fallback Path: <img> (Required for SVG and incompatible blobs)
      console.warn(
        `[ImageConverter] createImageBitmap failed, falling back to <img>:`,
        fastPathErr,
      );
      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const imgElement = new Image();

          imgElement.onload = () => {
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            ctx.drawImage(imgElement, 0, 0);
            imgElement.src = ""; // 释放内存
            resolve(null);
          };

          imgElement.onerror = () => {
            imgElement.src = "";
            reject(new Error("Failed to load image for conversion (fallback)"));
          };

          // 关键安全修复：仅对远程资源使用 crossOrigin，本地 blob/data 必须避免
          if (!img.url.startsWith("blob:") && !img.url.startsWith("data:")) {
            imgElement.crossOrigin = "anonymous";
          }
          imgElement.src = dataUrl;
        };
        reader.onerror = () =>
          reject(new Error("FileReader failed in fallback"));
        reader.readAsDataURL(blob);
      });
    }

    // Determine target mime type
    let finalMimeType = "image/png";
    let finalExt = "png";

    let effectiveTargetFormat = targetFormat as string;
    if (targetFormat === "original") {
      // If we are forced to convert but want to keep "original",
      // we use webp for webp re-encoding, and fallback to png for others (like GIF)
      effectiveTargetFormat = isWebp && reEncodeWebp ? "webp" : "png";
    }

    switch (effectiveTargetFormat) {
      case "webp":
        finalMimeType = "image/webp";
        finalExt = "webp";
        break;
      case "jpg":
      case "jpeg":
        finalMimeType = "image/jpeg";
        finalExt = "jpg";
        break;
      case "avif":
        finalMimeType = "image/avif";
        finalExt = "avif";
        break;
      case "bmp":
        finalMimeType = "image/bmp";
        finalExt = "bmp";
        break;
      case "png":
      default:
        finalMimeType = "image/png";
        finalExt = "png";
        break;
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (resultBlob) => {
          if (resultBlob) {
            resolve({ blob: resultBlob, extension: finalExt });
          } else {
            reject(new Error(`Canvas toBlob failed for ${finalMimeType}`));
          }
        },
        finalMimeType,
        quality,
      );
    });
  } catch (err) {
    console.error(`[ImageConverter] Final conversion failed:`, err);
    throw err;
  }
}
