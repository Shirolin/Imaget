import type { ImageItem } from "../../types";
import { ImageTypeDetector } from "./image-type-detector";
import { UrlResolver } from "./url-resolver";
import { WeiboResolver } from "../resolvers/weibo";

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

    const isTelegramHost = window.location.host.includes("telegram");
    const allowBlob =
      (settings?.interfaceBehavior?.identifyBlobImages || isTelegramHost) &&
      url.startsWith("blob:");
    if (!url.startsWith("http") && !allowBlob) continue;

    const isPixiv = window.location.href.includes("pixiv.net");
    if (
      isPixiv &&
      (url.includes("image/svg+xml") || url.toLowerCase().includes(".svg"))
    ) {
      continue;
    }

    // 过滤掉 weibo.com 的网页链接（如 /u/false 或 /status/ 等非真实图片）
    if (
      url.includes("weibo.com") &&
      !url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)
    ) {
      continue;
    }

    localSeen.add(url);
    seenUrls?.add(url);
    const weiboSize = WeiboResolver.parseDimensions(url);
    items.push({
      id: existingIdMap.get(url) ?? stableHash(url),
      url,
      width: weiboSize ? weiboSize.width : img.naturalWidth,
      height: weiboSize ? weiboSize.height : img.naturalHeight,
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
