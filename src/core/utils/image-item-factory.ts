import type { ImageItem } from "../../types";
import { ImageTypeDetector } from "./image-type-detector";

interface CreateImageItemFromElementOptions {
  id: string;
  url: string;
  target: HTMLElement;
  pageTitle: string;
  pageUrl: string;
}

export function createImageItemFromElement({
  id,
  url,
  target,
  pageTitle,
  pageUrl,
}: CreateImageItemFromElementOptions): ImageItem {
  const rect = target.getBoundingClientRect();
  let width = rect.width;
  let height = rect.height;

  if (target instanceof HTMLImageElement) {
    if (target.naturalWidth) width = target.naturalWidth;
    if (target.naturalHeight) height = target.naturalHeight;
  }

  return {
    id,
    url,
    width: Math.round(width),
    height: Math.round(height),
    format: ImageTypeDetector.getFormatFromUrl(url),
    filename: url.split("/").pop()?.split(/[?#]/)[0] || "image",
    isSelected: true,
    pageTitle,
    pageUrl,
    sizeKB: 0,
  };
}
