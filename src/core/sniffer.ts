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
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      return new Promise((resolve) => {
        chrome.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) return resolve();
            chrome.tabs.sendMessage(
              activeTab.id,
              { action: "AUTOSCROLL_REQUEST" },
              () => resolve(),
            );
          })
          .catch(() => resolve());
      });
    }

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
   * 单遍深度扫描：合并普通元素、背景图、Shadow DOM 和 iframe 的扫描，大幅优化性能
   */
  private async sniffNodeTree(
    root: Document | ShadowRoot | Element,
    searchAllFrames: boolean = true,
    identifyBackground: boolean = true,
    visited: Set<Document | ShadowRoot | Element> = new Set(),
  ): Promise<string[]> {
    if (visited.has(root)) return [];
    visited.add(root);

    const urls = new Set<string>();
    const elements = root.querySelectorAll("*");

    // 使用标准 for 循环，避免 Array.from 造成的大量内存分配
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // 1. 处理普通图片
      if (el.tagName === "IMG") {
        const url = UrlResolver.resolveBestUrl(el as HTMLElement);
        if (url) urls.add(url);
      } else if (
        el.tagName === "SOURCE" &&
        el.parentElement?.tagName === "PICTURE"
      ) {
        const srcset = (el as HTMLSourceElement).srcset;
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
      } else if (identifyBackground && el instanceof HTMLElement) {
        // 2. 处理背景图
        const url = UrlResolver.resolveBestUrl(el);
        if (url) urls.add(url);
      }

      // 3. 处理 Shadow DOM
      if (el.shadowRoot) {
        const shadowUrls = await this.sniffNodeTree(
          el.shadowRoot,
          searchAllFrames,
          identifyBackground,
          visited,
        );
        for (const u of shadowUrls) urls.add(u);
      }

      // 4. 处理 iframe
      if (searchAllFrames && el.tagName === "IFRAME") {
        const iframe = el as HTMLIFrameElement;
        try {
          const frameDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (frameDoc) {
            const frameUrls = await this.sniffNodeTree(
              frameDoc,
              searchAllFrames,
              identifyBackground,
              visited,
            );
            for (const u of frameUrls) urls.add(u);
          }
        } catch {
          // 忽略跨域 iframe 报错
        }
      }
    }

    return Array.from(urls);
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
      identifyBlobImages: boolean;
    };
  }): Promise<ImageItem[]> {
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      return new Promise((resolve) => {
        chrome.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) return resolve([]);
            chrome.tabs.sendMessage(
              activeTab.id,
              { action: "SNIFF_REQUEST", payload: { settings } },
              (response) => {
                if (chrome.runtime.lastError || !response) {
                  console.warn(
                    "[SidePanel Sniffer] Error connecting to content script:",
                    chrome.runtime.lastError,
                  );
                  resolve([]);
                } else {
                  resolve(response.results || []);
                }
              },
            );
          })
          .catch((err) => {
            console.error("[SidePanel Sniffer] Error querying tabs:", err);
            resolve([]);
          });
      });
    }

    const urls = new Set<string>();

    const searchAllFrames =
      settings?.interfaceBehavior?.searchAllFrames ?? true;
    const identifyBackground =
      settings?.interfaceBehavior?.identifyBackgroundImages ?? true;
    const identifyBlob =
      settings?.interfaceBehavior?.identifyBlobImages ?? false;

    const [treeUrls, perfUrls, svgUrls] = await Promise.all([
      this.sniffNodeTree(document, searchAllFrames, identifyBackground),
      Promise.resolve(this.sniffPerformance()),
      Promise.resolve(this.sniffSVGElements()),
    ]);
    [...treeUrls, ...perfUrls, ...svgUrls].forEach((url) => {
      if (
        url &&
        (url.startsWith("http") ||
          url.startsWith("data:") ||
          (identifyBlob && url.startsWith("blob:")))
      ) {
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
        const isBlob = url.startsWith("blob:");

        if (isExtension || !isUrlExternal || isBlob) {
          const response = await fetch(url, {
            method: isBlob ? "GET" : "HEAD",
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
