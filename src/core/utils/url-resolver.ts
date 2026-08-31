import { RESOLVERS } from "../resolvers";

/**
 * UrlResolver: 负责从 DOM 元素中提取或解析出最高质量的图片 URL
 * 已解耦：通过外部 Site Resolvers 支持多站点原图解析
 */
export class UrlResolver {
  /**
   * 从给定的 HTMLElement (通常是 <img>) 中解析出最佳 URL
   */
  public static resolveBestUrl(el: HTMLElement): string {
    let bestUrl = "";

    if (el instanceof HTMLImageElement || el.tagName === "SOURCE") {
      const srcEl = el as HTMLImageElement | HTMLSourceElement;
      bestUrl =
        (srcEl as HTMLImageElement).currentSrc ||
        (srcEl as HTMLImageElement).src ||
        (srcEl as HTMLSourceElement).srcset;

      // 1. 优先尝试解析 srcset (取最高倍率/宽度)
      const srcset =
        (srcEl as HTMLImageElement).srcset ||
        (srcEl as HTMLSourceElement).srcset;
      if (srcset) {
        const srcsetBest = this.parseSrcset(srcset);
        if (srcsetBest) bestUrl = srcsetBest;
      }

      // 2. 尝试解析 dataset 中的高清图 (适配 lazyload)
      const dataCandidates = [
        el.dataset.src,
        el.dataset.original,
        el.dataset.hq,
        el.dataset.full,
        el.getAttribute("data-lazy-src"),
        el.getAttribute("data-src-hq"),
      ].filter(Boolean) as string[];

      if (dataCandidates.length > 0) {
        const candidate = dataCandidates[0];
        try {
          bestUrl = new URL(candidate, window.location.href).href;
        } catch {
          bestUrl = candidate;
        }
      }
    } else {
      // 如果是背景图元素
      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage;
      if (bg && bg !== "none" && bg.startsWith("url(")) {
        bestUrl = bg.slice(4, -1).replace(/['"]/g, "");
      }
    }

    // 3. 站点特定规则转换 (Twitter/X)
    bestUrl = this.transformSiteSpecificUrl(bestUrl);

    return bestUrl;
  }

  /**
   * 针对特定站点的 URL 转换逻辑 (已解耦为独立模块)
   */
  public static transformSiteSpecificUrl(url: string): string {
    if (!url) return url;

    for (const resolver of RESOLVERS) {
      if (resolver.matches(url)) {
        return resolver.resolve(url);
      }
    }

    return url;
  }

  /**
   * 主 URL 拉取失败时按序尝试的回退候选（由命中站点的 resolver 提供）
   */
  public static getFallbackUrls(url: string): string[] {
    if (!url) return [];

    for (const resolver of RESOLVERS) {
      if (resolver.matches(url)) {
        return resolver.getFallbackUrls?.(url) ?? [];
      }
    }

    return [];
  }

  /**
   * 解析 srcset 字符串并返回最高质量的 URL
   */
  public static parseSrcset(srcset: string): string | null {
    try {
      const parts = srcset.split(",").map((s) => s.trim());
      let maxWeight = -1;
      let bestUrl = null;

      for (const part of parts) {
        const [url, descriptor] = part.split(/\s+/);
        if (!url) continue;

        let weight = 0;
        if (descriptor) {
          if (descriptor.endsWith("w")) {
            weight = parseInt(descriptor.slice(0, -1), 10);
          } else if (descriptor.endsWith("x")) {
            weight = parseFloat(descriptor.slice(0, -1)) * 1000;
          }
        }

        if (weight >= maxWeight) {
          maxWeight = weight;
          bestUrl = url;
        }
      }

      if (bestUrl) {
        return new URL(bestUrl, window.location.href).href;
      }
    } catch {
      // 忽略解析错误
    }
    return null;
  }
}
