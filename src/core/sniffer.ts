import { type ImageItem, type ImageFormat } from "../types";
import { UrlResolver } from "./utils/url-resolver";
import { ImageTypeDetector } from "./utils/image-type-detector";
import { runConcurrent } from "./utils/concurrency";
import {
  isDomainDisabled,
  type SnifferSettings,
} from "./utils/settings-policy";
import {
  calculateAutoScrollStep,
  getCurrentScrollTop,
  getTargetMaxScrollTop,
  pickAutoScrollTarget,
  resolveAutoScrollPolicy,
  type AutoScrollPolicy,
  type AutoScrollStopReason,
} from "./utils/auto-scroll-policy";
import { collectLoadedImageItems } from "./utils/loaded-image-candidates";
import {
  FOLLOW_SCAN_PAUSE,
  FOLLOW_SCAN_RESUME,
  FOLLOW_SCAN_START,
  FOLLOW_SCAN_STOP,
  type FollowScanCommandType,
} from "../ui/utils/sniffer-events";

const METADATA_CONCURRENCY = 12;
const IMAGE_METADATA_TIMEOUT_MS = 1500;
const FETCH_METADATA_TIMEOUT_MS = 1000;

/** 为字符串生成稳定的数字哈希（不依赖索引位置） */
function stableHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

// 匹配项标记：记录需要第二阶段背景图检查的元素
interface BgCandidate {
  element: Element;
}

export interface AutoScrollResult {
  reason: AutoScrollStopReason;
  steps: number;
  durationMs: number;
  targetKind: "document" | "container" | "none";
  requestId?: string;
}

export interface SniffAllOptions {
  requestId?: string;
  onCandidates?: (items: ImageItem[]) => void;
}

export class Sniffer {
  public async startFollowScan(
    settings: SnifferSettings,
    sessionId: string,
  ): Promise<number | null> {
    return this.sendFollowScanCommand(FOLLOW_SCAN_START, {
      settings,
      sessionId,
    });
  }

  public async stopFollowScan(
    sessionId?: string,
    targetTabId?: number | null,
  ): Promise<void> {
    await this.sendFollowScanCommand(
      FOLLOW_SCAN_STOP,
      { sessionId },
      targetTabId,
    );
  }

  public async pauseFollowScan(
    sessionId?: string,
    targetTabId?: number | null,
  ): Promise<void> {
    await this.sendFollowScanCommand(
      FOLLOW_SCAN_PAUSE,
      { sessionId },
      targetTabId,
    );
  }

  public async resumeFollowScan(
    sessionId?: string,
    targetTabId?: number | null,
  ): Promise<void> {
    await this.sendFollowScanCommand(
      FOLLOW_SCAN_RESUME,
      { sessionId },
      targetTabId,
    );
  }

  private async sendFollowScanCommand(
    type: FollowScanCommandType,
    payload: { settings?: SnifferSettings; sessionId?: string },
    targetTabId?: number | null,
  ): Promise<number | null> {
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (!isExtensionPage) {
      window.postMessage({ type, payload }, "*");
      return null;
    }

    try {
      const tabId =
        targetTabId ??
        (
          await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })
        )[0]?.id;
      if (!tabId) return null;
      await chrome.tabs.sendMessage(tabId, { action: type, payload });
      return tabId;
    } catch {
      // Content script may be unavailable on restricted pages.
      return null;
    }
  }

  public async cancelAutoScroll(requestId: string): Promise<void> {
    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (!isExtensionPage) return;

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      if (!activeTab?.id) return;
      await chrome.tabs.sendMessage(activeTab.id, {
        action: "AUTOSCROLL_CANCEL_REQUEST",
        payload: { requestId },
      });
    } catch {
      // The scroll request may already have completed.
    }
  }

  /**
   * 自动滚动触发懒加载
   */
  public async autoScroll(
    settings?: SnifferSettings,
    onProgress?: (percent: number) => void,
    policyOverrides?: Partial<AutoScrollPolicy>,
    externalRequestId?: string,
    signal?: AbortSignal,
    hooks?: {
      onSettledStep?: () => void | Promise<void>;
      onBeforeRestore?: () => void | Promise<void>;
    },
  ): Promise<AutoScrollResult> {
    if (
      isDomainDisabled(
        window.location.href,
        settings?.interfaceBehavior?.disabledDomains,
      )
    ) {
      return {
        reason: "disabled-domain",
        steps: 0,
        durationMs: 0,
        targetKind: "none",
      };
    }

    const isExtensionPage =
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      window.location.protocol === "chrome-extension:";
    if (isExtensionPage) {
      const requestId =
        externalRequestId ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `auto-${Date.now()}-${Math.random().toString(36).slice(2)}`);

      return new Promise((resolve) => {
        chrome.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) {
              return resolve({
                reason: "not-scrollable",
                steps: 0,
                durationMs: 0,
                targetKind: "none",
                requestId,
              });
            }
            chrome.tabs.sendMessage(
              activeTab.id,
              {
                action: "AUTOSCROLL_REQUEST",
                payload: { settings, requestId },
              },
              (response) =>
                resolve({
                  reason: response?.result?.reason || "not-scrollable",
                  steps: response?.result?.steps || 0,
                  durationMs: response?.result?.durationMs || 0,
                  targetKind: response?.result?.targetKind || "none",
                  requestId,
                }),
            );
          })
          .catch((err) => {
            console.warn("[Sniffer] Failed to send AUTOSCROLL_REQUEST:", err);
            resolve({
              reason: "not-scrollable",
              steps: 0,
              durationMs: 0,
              targetKind: "none",
              requestId,
            });
          });
      });
    }

    const policy = resolveAutoScrollPolicy(policyOverrides);
    const target = pickAutoScrollTarget(document);
    if (!target.element) {
      return {
        reason: "not-scrollable",
        steps: 0,
        durationMs: 0,
        targetKind: target.kind,
      };
    }

    const startTime = Date.now();
    const initialScrollTop = getCurrentScrollTop(target);
    let maxScrollTop = getTargetMaxScrollTop(target);
    if (maxScrollTop <= 0) {
      return {
        reason: "not-scrollable",
        steps: 0,
        durationMs: 0,
        targetKind: target.kind,
      };
    }

    const stepDistance = calculateAutoScrollStep(target.viewportHeight, policy);
    let steps = 0;
    let idleRounds = 0;
    let reason: AutoScrollStopReason = "completed";

    onProgress?.(0);
    try {
      while (true) {
        if (signal?.aborted) {
          reason = "cancelled";
          break;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= policy.maxDurationMs) {
          reason = "max-duration";
          break;
        }
        if (steps >= policy.maxSteps) {
          reason = "max-steps";
          break;
        }

        const currentScrollTop = getCurrentScrollTop(target);
        if (currentScrollTop >= maxScrollTop - 1) {
          await new Promise((r) => setTimeout(r, policy.settleMs));
          if (signal?.aborted) {
            reason = "cancelled";
            break;
          }

          const latestMaxScrollTop = getTargetMaxScrollTop(target);
          if (latestMaxScrollTop > maxScrollTop + 1) {
            idleRounds = 0;
            maxScrollTop = latestMaxScrollTop;
            continue;
          }

          idleRounds += 1;
          onProgress?.(99);

          if (idleRounds >= policy.idleRounds) {
            reason = "completed";
            break;
          }
          continue;
        }

        if (target.kind === "document") {
          window.scrollBy(0, stepDistance);
        } else {
          target.element.scrollTop = Math.min(
            target.element.scrollTop + stepDistance,
            maxScrollTop,
          );
        }
        steps += 1;

        await new Promise((r) => setTimeout(r, policy.settleMs));
        if (signal?.aborted) {
          reason = "cancelled";
          break;
        }
        await hooks?.onSettledStep?.();

        const latestMaxScrollTop = getTargetMaxScrollTop(target);
        if (latestMaxScrollTop > maxScrollTop + 1) {
          idleRounds = 0;
          maxScrollTop = latestMaxScrollTop;
        } else {
          idleRounds = 0;
        }

        const latestScrollTop = getCurrentScrollTop(target);
        const progressPercent =
          maxScrollTop > 0
            ? Math.min(99, Math.round((latestScrollTop / maxScrollTop) * 100))
            : 0;
        onProgress?.(progressPercent);
      }
    } finally {
      await hooks?.onBeforeRestore?.();
      if (target.kind === "document") {
        window.scrollTo(0, initialScrollTop);
      } else {
        target.element.scrollTop = initialScrollTop;
      }
    }

    onProgress?.(100);
    return {
      reason,
      steps,
      durationMs: Date.now() - startTime,
      targetKind: target.kind,
    };
  }

  /**
   * 单遍深度扫描：合并普通元素、背景图、Shadow DOM 和 iframe 的扫描，大幅优化性能
   * 使用 TreeWalker 替代 querySelectorAll('*')，减少内存分配；
   * 分两阶段：Phase 1 遍历 DOM 树收集候选，Phase 2 仅对候选调用 getComputedStyle
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
    const bgCandidates: BgCandidate[] = [];

    // Phase 1: TreeWalker — 仅遍历一次 DOM 树
    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      () => NodeFilter.FILTER_ACCEPT,
    );

    let el: Element | null;
    while ((el = treeWalker.nextNode() as Element | null)) {
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
      }

      // 2. 收集背景图候选（延迟到 Phase 2 检查 getComputedStyle）
      if (identifyBackground && el instanceof HTMLElement) {
        // 先通过 style 属性快速过滤：没有 style 属性则不可能有 background-image
        if (el.hasAttribute("style") || el.hasAttribute("background")) {
          bgCandidates.push({ element: el });
        }
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

    // Phase 2: 仅对候选元素执行 getComputedStyle（避免对无关元素触发重排）
    if (identifyBackground) {
      for (const candidate of bgCandidates) {
        const url = UrlResolver.resolveBestUrl(
          candidate.element as HTMLElement,
        );
        if (url) urls.add(url);
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
      // 忽略作为宿主容器的 root 元素或过小的图标
      if (svg.id === "imaget-reborn-root" || svg.closest("#imaget-reborn-root"))
        return;

      const rect = svg.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 16) return;

      try {
        const serializer = new XMLSerializer();
        // 克隆一份以防修改原始 DOM
        const clone = svg.cloneNode(true) as SVGSVGElement;

        // 核心修复：确保 SVG 具有显式的 width/height，否则作为 <img> 加载时可能显示为 0x0
        if (!clone.getAttribute("width") && rect.width > 0) {
          clone.setAttribute("width", rect.width.toString());
        }
        if (!clone.getAttribute("height") && rect.height > 0) {
          clone.setAttribute("height", rect.height.toString());
        }
        // 确保命名空间存在
        if (!clone.getAttribute("xmlns")) {
          clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }

        const svgString = serializer.serializeToString(clone);
        // 使用更现代且安全的 Unicode 转 Base64 方式
        const encoded = btoa(
          encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16)),
          ),
        );
        const url = `data:image/svg+xml;base64,${encoded}`;
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
  public async sniffAll(
    settings?: SnifferSettings,
    existingItems?: ImageItem[],
    options?: SniffAllOptions,
  ): Promise<ImageItem[]> {
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
              {
                action: "SNIFF_REQUEST",
                payload: { settings, requestId: options?.requestId },
              },
              (response) => {
                if (chrome.runtime.lastError || !response) {
                  const errMsg = chrome.runtime.lastError?.message || "";
                  if (!errMsg.includes("Receiving end does not exist")) {
                    console.warn(
                      "[SidePanel Sniffer] Error connecting to content script:",
                      chrome.runtime.lastError,
                    );
                  }
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

    if (
      isDomainDisabled(
        window.location.href,
        settings?.interfaceBehavior?.disabledDomains,
      )
    ) {
      return [];
    }

    const earlyItems = this.sniffLoadedElementItems(settings, existingItems);
    if (earlyItems.length > 0) {
      options?.onCandidates?.(earlyItems);
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
    const metadataResults: Array<Omit<ImageItem, "id" | "isSelected"> | null> =
      Array(urlArray.length).fill(null);
    await runConcurrent(urlArray, METADATA_CONCURRENCY, async (url, index) => {
      metadataResults[index] = await this.getImageMetadata(url);
    });

    // 构建已有图片的 URL→ID 映射，保持 ID 稳定
    const existingIdMap = new Map<string, string>();
    if (existingItems) {
      for (const item of existingItems) {
        existingIdMap.set(item.url, item.id);
      }
    }

    const items: ImageItem[] = [];
    metadataResults.forEach((metadata, index) => {
      if (metadata) {
        const url = urlArray[index];
        // 优先复用已有 ID，否则生成新的稳定哈希
        const id = existingIdMap.get(url) ?? stableHash(url);
        items.push({
          ...metadata,
          id,
          isSelected: false,
          pageTitle: document.title,
          pageUrl: window.location.href,
        });
      }
    });

    return items;
  }

  private sniffLoadedElementItems(
    settings?: SnifferSettings,
    existingItems?: ImageItem[],
  ): ImageItem[] {
    return collectLoadedImageItems({
      root: document,
      settings,
      existingItems,
    });
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
          const timeoutId = window.setTimeout(() => {
            cleanup();
            reject(
              new Error(
                `Timed out loading image metadata: ${String(url).slice(0, 100)}`,
              ),
            );
          }, IMAGE_METADATA_TIMEOUT_MS);
          const cleanup = () => {
            window.clearTimeout(timeoutId);
            img.onload = null;
            img.onerror = null;
            try {
              img.src = "";
            } catch {
              // 忽略清理失败
            }
          };

          img.onload = () => {
            const size = {
              width: img.naturalWidth,
              height: img.naturalHeight,
            };
            cleanup();
            resolve(size);
          };
          img.onerror = () => {
            cleanup();
            reject(
              new Error(`Failed to load image: ${String(url).slice(0, 100)}`),
            );
          };
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
          const controller = new AbortController();
          const timeoutId = window.setTimeout(
            () => controller.abort(),
            FETCH_METADATA_TIMEOUT_MS,
          );
          let response: Response | undefined;
          try {
            response = await fetch(url, {
              method: isBlob ? "GET" : "HEAD",
              cache: "no-cache",
              signal: controller.signal,
            });
            if (response.ok) {
              const sizeBytes = response.headers.get("content-length");
              if (sizeBytes) sizeKB = Math.round(parseInt(sizeBytes) / 1024);

              const contentType = response.headers.get("content-type");
              if (contentType) {
                format = ImageTypeDetector.getFormatFromMimeType(contentType);
              }
            }
          } finally {
            if (response?.body) {
              await response.body.cancel();
            }
            window.clearTimeout(timeoutId);
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
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug(
          "[Sniffer] Failed to load image metadata:",
          String(url).slice(0, 100),
          err,
        );
      }
      return null;
    }
  }
}
