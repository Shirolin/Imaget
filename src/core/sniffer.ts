import { ImageItem, ImageFormat } from "../types";
import { UrlResolver } from "./utils/url-resolver";
import { ImageTypeDetector } from "./utils/image-type-detector";

export class Sniffer {
  /**
   * 自动滚动触发懒加载
   */
  public async autoScroll(
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const totalHeight = document.body.scrollHeight;
    const distance = 400;
    let currentPosition = 0;

    while (currentPosition < totalHeight) {
      window.scrollBy(0, distance);
      currentPosition += distance;
      if (onProgress) {
        onProgress(
          Math.min(100, Math.round((currentPosition / totalHeight) * 100)),
        );
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0); // 回滚到顶部
  }

  /**
   * 基础提取：从指定根节点提取图片 URL
   */
  private async sniffDOMContent(
    root: Document | ShadowRoot | Element,
    identifyBackground: boolean = true,
  ): Promise<string[]> {
    const urls = new Set<string>();

    root.querySelectorAll("img").forEach((img) => {
      const url = UrlResolver.resolveBestUrl(img);
      if (url) urls.add(url);
    });

    root.querySelectorAll("picture source").forEach((source) => {
      const srcset = (source as HTMLSourceElement).srcset;
      if (srcset) {
        const bestUrl = UrlResolver.parseSrcset(srcset);
        if (bestUrl) {
          try {
            const absolute = new URL(bestUrl, window.location.href).href;
            urls.add(UrlResolver.transformSiteSpecificUrl(absolute));
          } catch {
            urls.add(bestUrl);
          }
        }
      }
    });

    if (identifyBackground) {
      root.querySelectorAll("*").forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        // 如果不是 img，UrlResolver 会尝试解析背景图
        if (el.tagName !== "IMG" && el.tagName !== "SOURCE") {
          const url = UrlResolver.resolveBestUrl(el);
          if (url) urls.add(url);
        }
      });
    }

    return Array.from(urls);
  }

  /**
   * 深度扫描：递归穿透 Shadow DOM 和 iFrame
   */
  public async sniffRecursive(
    root: Document | ShadowRoot | Element = document,
    searchAllFrames: boolean = true,
    identifyBackground: boolean = true,
  ): Promise<string[]> {
    let urls: string[] = [];
    const elements = root.querySelectorAll("*");

    for (const el of Array.from(elements)) {
      // 1. 处理 Shadow DOM
      if (el.shadowRoot) {
        const shadowUrls = await this.sniffRecursive(
          el.shadowRoot,
          searchAllFrames,
          identifyBackground,
        );
        urls = urls.concat(shadowUrls);

        const currentShadowUrls = await this.sniffDOMContent(
          el.shadowRoot,
          identifyBackground,
        );
        urls = urls.concat(currentShadowUrls);
      }

      // 2. 处理 iframe (如果开启)
      if (
        searchAllFrames &&
        el.tagName === "IFRAME" &&
        (el as HTMLIFrameElement).contentDocument
      ) {
        try {
          const iframe = el as HTMLIFrameElement;
          const frameDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (frameDoc) {
            const frameUrls = await this.sniffRecursive(
              frameDoc,
              searchAllFrames,
              identifyBackground,
            );
            urls = urls.concat(frameUrls);

            const currentFrameUrls = await this.sniffDOMContent(
              frameDoc,
              identifyBackground,
            );
            urls = urls.concat(currentFrameUrls);
          }
        } catch (e) {
          console.debug("Sniffer: Cannot access cross-origin iframe", e);
        }
      }
    }
    return urls;
  }

  /**
   * 利用 Performance API 追踪加载的资源
   */
  public sniffPerformance(): string[] {
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    return resources
      .filter(
        (r) =>
          r.initiatorType === "img" ||
          r.name.match(/\.(jpg|jpeg|png|webp|gif|svg)/i),
      )
      .map((r) => r.name);
  }

  /**
   * 嗅探内联 SVG 元素并转换为 Data URL
   */
  public sniffSVGElements(): string[] {
    const urls = new Set<string>();
    document.querySelectorAll("svg").forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 16) return;

      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
        urls.add(url);
      } catch (e) {
        console.warn("Failed to serialize SVG", e);
      }
    });
    return Array.from(urls);
  }

  /**
   * 核心嗅探方法：整合所有来源并获取元数据
   */
  public async sniffAll(settings?: {
    interfaceBehavior: {
      searchAllFrames: boolean;
      identifyBackgroundImages: boolean;
    };
  }): Promise<ImageItem[]> {
    const urls = new Set<string>();

    const searchAllFrames =
      settings?.interfaceBehavior?.searchAllFrames ?? true;
    const identifyBackground =
      settings?.interfaceBehavior?.identifyBackgroundImages ?? true;

    const [domUrls, shadowUrls, perfUrls, svgUrls] = await Promise.all([
      this.sniffDOMContent(document, identifyBackground),
      this.sniffRecursive(document, searchAllFrames, identifyBackground),
      Promise.resolve(this.sniffPerformance()),
      Promise.resolve(this.sniffSVGElements()),
    ]);

    [...domUrls, ...shadowUrls, ...perfUrls, ...svgUrls].forEach((url) => {
      if (url && (url.startsWith("http") || url.startsWith("data:"))) {
        urls.add(url);
      }
    });

    const urlArray = Array.from(urls);
    const results = await Promise.allSettled(
      urlArray.map((url) => this.getImageMetadata(url)),
    );

    const items: ImageItem[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        items.push({
          ...result.value,
          id: btoa(encodeURIComponent(urlArray[index])).slice(0, 10) + index,
          isSelected: false,
          pageTitle: document.title,
          pageUrl: window.location.href,
        });
      }
    });

    return items;
  }

  /**
   * 获取单张图片的元数据
   */
  private async getImageMetadata(
    url: string,
  ): Promise<Omit<ImageItem, "id" | "isSelected"> | null> {
    try {
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const img = new Image();
          img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => reject();
          img.src = url;
        },
      );

      let sizeKB = 0;
      let format: ImageFormat = "UNKNOWN";

      try {
        // 尝试获取文件大小和格式
        const isUrlExternal =
          url.startsWith("http") && !url.includes(window.location.host);
        const isExtension = window.location.protocol === "chrome-extension:";

        if (isExtension || !isUrlExternal) {
          const response = await fetch(url, {
            method: "HEAD",
            cache: "no-cache",
          });
          if (response.ok) {
            const sizeBytes = response.headers.get("content-length");
            if (sizeBytes) sizeKB = Math.round(parseInt(sizeBytes) / 1024);

            const contentType = response.headers.get("content-type");
            if (contentType) {
              format = ImageTypeDetector.getFormatFromMimeType(contentType);
            }
          }
        }
      } catch {
        // 忽略 fetch 失败
      }

      // 兜底策略：使用智能 URL 解析
      if (format === "UNKNOWN") {
        format = ImageTypeDetector.getFormatFromUrl(url);
      }

      return {
        url,
        width: dimensions.width,
        height: dimensions.height,
        sizeKB,
        format,
        filename: url.split("/").pop()?.split(/[?#]/)[0] || "image",
      };
    } catch {
      return null;
    }
  }
}
