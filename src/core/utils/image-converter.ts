import { ImageItem, Settings } from "../../types";

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

  // 1. Check if conversion is needed
  const isGif = originalFormat === "gif";

  let shouldConvert = false;

  // Safe extension extraction
  let extension = "png";
  if (img.url.startsWith("data:")) {
    extension = originalFormat !== "unknown" ? originalFormat : "png";
  } else {
    const urlExt = img.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
    extension =
      urlExt && urlExt.length <= 5
        ? urlExt
        : originalFormat !== "unknown"
          ? originalFormat
          : "png";
  }
  if (extension === "jpeg") extension = "jpg";

  if (isGif) {
    if (gifStrategy === "firstFrame") {
      shouldConvert = true;
    } else if (gifStrategy === "keep") {
      return { blob, extension };
    }
    // "skip" is handled in processor
  }

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
        case "png":
        default:
          finalMimeType = "image/png";
          finalExt = "png";
          break;
      }

      console.log(
        `[ImageConverter] ToBlob: ${finalMimeType}, quality: ${quality}`,
      );

      canvas.toBlob(
        (resultBlob) => {
          if (resultBlob) {
            console.log(
              `[ImageConverter] Success. New blob size: ${resultBlob.size}`,
            );
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
