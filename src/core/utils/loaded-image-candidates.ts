import type { ImageItem } from "../../types";
import { ImageTypeDetector } from "./image-type-detector";
import { UrlResolver } from "./url-resolver";

export interface LoadedImageCandidateSettings {
  interfaceBehavior?: {
    identifyBlobImages?: boolean;
  };
}

interface CollectLoadedImageItemsOptions {
  root: ParentNode;
  settings?: LoadedImageCandidateSettings;
  existingItems?: ImageItem[];
  seenUrls?: Set<string>;
  batchLimit?: number;
}

function stableHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

export function collectLoadedImageItems({
  root,
  settings,
  existingItems,
  seenUrls,
  batchLimit = Number.POSITIVE_INFINITY,
}: CollectLoadedImageItemsOptions): ImageItem[] {
  const existingIdMap = new Map<string, string>();
  if (existingItems) {
    for (const item of existingItems) {
      existingIdMap.set(item.url, item.id);
    }
  }

  const items: ImageItem[] = [];
  const localSeen = new Set<string>();
  const images =
    root instanceof HTMLImageElement
      ? [root]
      : Array.from(root.querySelectorAll("img"));

  for (const img of images) {
    if (items.length >= batchLimit) break;
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) continue;
    if (img.naturalWidth < 16 || img.naturalHeight < 16) continue;
    if (img.closest("#imaget-reborn-root")) continue;

    const url = UrlResolver.resolveBestUrl(img);
    if (!url || localSeen.has(url) || seenUrls?.has(url)) continue;
    if (url.startsWith("data:")) continue;

    const allowBlob =
      settings?.interfaceBehavior?.identifyBlobImages &&
      url.startsWith("blob:");
    if (!url.startsWith("http") && !allowBlob) continue;

    localSeen.add(url);
    seenUrls?.add(url);
    items.push({
      id: existingIdMap.get(url) ?? stableHash(url),
      url,
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeKB: 0,
      format: ImageTypeDetector.getFormatFromUrl(url),
      filename: url.split("/").pop()?.split(/[?#]/)[0] || "image",
      isSelected: false,
      pageTitle: document.title,
      pageUrl: window.location.href,
    });
  }

  return items;
}
