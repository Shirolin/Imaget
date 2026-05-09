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
  return new Promise((resolve, reject) => {
    const imgElement = new Image();
    const url = URL.createObjectURL(blob);

    imgElement.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(imgElement, 0, 0);

      // Determine target mime type
      let finalMimeType = "image/png";
      let finalExt = "png";

      const effectiveTargetFormat =
        targetFormat === "original" ? "png" : targetFormat;

      switch (effectiveTargetFormat as string) {
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

      canvas.toBlob(
        (resultBlob) => {
          if (resultBlob) {
            resolve({ blob: resultBlob, extension: finalExt });
          } else {
            console.error(
              `[ImageConverter] Canvas toBlob returned null for ${finalMimeType}`,
            );
            reject(new Error("Canvas toBlob failed"));
          }
        },
        finalMimeType,
        quality,
      );
    };

    imgElement.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for conversion"));
    };

    // 关键：对于某些环境可能需要 crossOrigin
    imgElement.crossOrigin = "anonymous";
    imgElement.src = url;
  });
}
