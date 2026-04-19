import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import type { Sniffer } from "./sniffer";
import type { ImageProcessor } from "./processor";
import { FloatingButton } from "../ui/components/FloatingButton";
import { type Settings, defaultSettings, type ImageItem } from "../types";
import { UrlResolver } from "./utils/url-resolver";
import mantineStyles from "@mantine/core/styles.css?inline";

const SELECTOR = ".imaget-floating-container";
const finalCSS = mantineStyles.replaceAll(":root", SELECTOR);

interface FloatingInstance {
  host: HTMLElement;
  root: ReactDOM.Root;
  rootElement: HTMLElement;
  target: HTMLElement; // 这里的 target 是解析出的 candidateEl
  url: string;
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  progressInterval: number | null;
  observer: MutationObserver | null;
  visibilityObserver: IntersectionObserver | null;
  hideTimer: number | null;
  isHovering: boolean;
  isVisible: boolean;
  isFrozen: boolean;
  rafId: number | null;
}

export class FloatingController {
  private instances: Map<HTMLElement, FloatingInstance> = new Map();
  private isMuted: boolean = false;
  private isTemporarilyDisabled: boolean = false;
  private settings: Settings = defaultSettings;

  // 状态机变量
  private hoverTimer: number | null = null;
  private pendingTarget: HTMLElement | null = null;
  private graceTimer: number | null = null;

  constructor(
    _sniffer: Sniffer,
    private processor: ImageProcessor,
  ) {
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.loadSettings();
  }

  private async loadSettings() {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      try {
        const result = await chrome.storage.local.get("imaget_settings");
        if (result.imaget_settings) {
          this.settings = result.imaget_settings as Settings;
        }
      } catch (e) {
        console.error("FloatingController: Failed to load settings", e);
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.instances.forEach((_, t) => this.removeInstance(t));
      if (this.hoverTimer) window.clearTimeout(this.hoverTimer);
      this.pendingTarget = null;
    }
  }

  public init() {
    document.addEventListener("pointerover", this.handleMouseOver, true);
    document.addEventListener("pointerout", this.handleMouseOut, true);
  }

  public destroy() {
    document.removeEventListener("pointerover", this.handleMouseOver, true);
    document.removeEventListener("pointerout", this.handleMouseOut, true);
    this.instances.forEach((_, target) => this.removeInstance(target));
    if (this.hoverTimer) window.clearTimeout(this.hoverTimer);
    if (this.graceTimer) window.clearTimeout(this.graceTimer);
  }

  private async handleMouseOver(e: MouseEvent) {
    // 🚀 核心逻辑加固：只要触发 mouseover，立即拦截并取消任何来自 mouseout 的清理延时
    // 这解决了用户在同一个图片容器内的子元素之间移动导致计时器被错误清理的问题
    if (this.graceTimer) {
      window.clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;

    const path = e.composedPath();
    const target = (path[0] as HTMLElement) || (e.target as HTMLElement);

    // 1. 检查是否进入我们的 UI
    const isOverOurUI = path.some(
      (el) =>
        el instanceof HTMLElement &&
        (el.classList.contains("imaget-floating-host") ||
          el.classList.contains("imaget-floating-container")),
    );

    if (isOverOurUI) {
      // 交互中：冻结所有追踪循环，确保点击位置绝对稳定
      this.instances.forEach((inst) => (inst.isFrozen = true));
      return;
    }

    // 2. 解析出实际的图片实体 (candidateEl)
    let candidateUrl = UrlResolver.resolveBestUrl(target);
    let candidateEl = target;

    if (
      !candidateUrl &&
      (["A", "DIV", "PICTURE", "SECTION", "ARTICLE", "CARD"].includes(
        target.tagName,
      ) ||
        target.className.includes("card"))
    ) {
      const imgInside = target.querySelector("img");
      if (imgInside) {
        candidateUrl = UrlResolver.resolveBestUrl(imgInside);
        candidateEl = imgInside;
      }
    }

    if (!candidateUrl || candidateUrl.startsWith("data:")) {
      return;
    }

    // 3. 尺寸判定
    const minSize = this.settings.interfaceBehavior.minImageSize;
    const rect = candidateEl.getBoundingClientRect();
    if (rect.width < minSize - 10 && rect.height < minSize - 10) {
      return;
    }

    // 4. 解除冻结（闲置状态的实例恢复追踪）
    this.instances.forEach((inst) => {
      if (inst.status === "idle") {
        inst.isFrozen = false;
      }
    });

    // 5. 稳定状态机逻辑：如果目标未变，直接 return，保持原有 hoverTimer
    if (this.pendingTarget === candidateEl) return;

    // 发现真正的新图片目标
    if (this.hoverTimer) window.clearTimeout(this.hoverTimer);
    this.pendingTarget = candidateEl;

    // 如果已经有实例了，只需恢复其 hover 状态
    const existing = this.instances.get(candidateEl);
    if (existing) {
      existing.isHovering = true;
      existing.isFrozen = false;
      if (existing.hideTimer) window.clearTimeout(existing.hideTimer);
      return;
    }

    // 启动 300ms 延迟触发
    this.hoverTimer = window.setTimeout(() => {
      if (this.pendingTarget === candidateEl) {
        this.createInstance(candidateEl, candidateUrl!);
      }
      this.hoverTimer = null;
    }, 300);
  }

  private handleMouseOut(e: MouseEvent) {
    const related = e.relatedTarget as Node;

    // 检查是否真的离开了图片及其关联的所有 UI
    for (const [target, inst] of this.instances.entries()) {
      const movedToUI = related && inst.host.contains(related);
      const movedToTarget = related === target;

      if (movedToUI || movedToTarget) {
        inst.isHovering = true;
        if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
        continue;
      }

      // 真的离开了
      inst.isHovering = false;
      if (inst.status !== "idle") continue;

      if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
      inst.hideTimer = window.setTimeout(() => {
        if (!inst.isHovering && inst.status === "idle") {
          this.removeInstance(target);
        }
      }, 400);
    }

    // 🚀 核心逻辑加固：延缓清理 pendingTarget。
    // 这给 handleMouseOver 留出了 50ms 时间来执行取消动作（如果鼠标只是移动到了子元素上）
    if (this.graceTimer) window.clearTimeout(this.graceTimer);
    this.graceTimer = window.setTimeout(() => {
      this.pendingTarget = null;
      if (this.hoverTimer) {
        window.clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      this.graceTimer = null;
    }, 50);
  }

  private createInstance(target: HTMLElement, url: string) {
    const host = document.createElement("div");
    host.className = "imaget-floating-host";
    Object.assign(host.style, {
      all: "initial",
      position: "absolute",
      pointerEvents: "none",
      zIndex: "2147483646",
    });

    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const styleTag = document.createElement("style");
    styleTag.textContent = finalCSS;
    shadow.appendChild(styleTag);

    const rootElement = document.createElement("div");
    rootElement.className = SELECTOR.replace(".", "");
    rootElement.style.width = "100%";
    rootElement.style.height = "100%";
    shadow.appendChild(rootElement);

    const root = ReactDOM.createRoot(rootElement);
    const instance: FloatingInstance = {
      host,
      root,
      rootElement,
      target,
      url,
      status: "idle",
      progress: 0,
      progressInterval: null,
      observer: null,
      visibilityObserver: null,
      hideTimer: null,
      isHovering: true,
      isVisible: true,
      isFrozen: false,
      rafId: null,
    };

    this.instances.set(target, instance);
    this.setupVisibilityObserver(instance);
    this.startTracking(instance);
    this.setupObserver(instance);
    this.renderInstance(instance);
  }

  private setupVisibilityObserver(instance: FloatingInstance) {
    instance.visibilityObserver = new IntersectionObserver(
      (entries) => {
        // 🚀 核心加固：如果目标图片已被原网页从 DOM 中彻底移除，立即销毁实例释放内存
        if (!document.contains(instance.target)) {
          this.removeInstance(instance.target);
          return;
        }

        instance.isVisible = entries[0].isIntersecting;
        if (!instance.isVisible && instance.rafId) {
          cancelAnimationFrame(instance.rafId);
          instance.rafId = null;
        } else if (
          instance.isVisible &&
          !instance.rafId &&
          !instance.isFrozen
        ) {
          this.startTracking(instance);
        }
      },
      { threshold: 0 },
    );
    instance.visibilityObserver.observe(instance.target);
  }

  private startTracking(instance: FloatingInstance) {
    if (instance.rafId) return;
    const update = () => {
      if (!this.instances.has(instance.target)) return;
      if (!instance.isVisible) {
        instance.rafId = null;
        return;
      }
      if (!instance.isFrozen) this.updateInstanceRect(instance);
      instance.rafId = requestAnimationFrame(update);
    };
    instance.rafId = requestAnimationFrame(update);
  }

  private updateInstanceRect(instance: FloatingInstance) {
    const rect = instance.target.getBoundingClientRect();
    const targetLeft = Math.round(rect.left + window.scrollX);
    const targetTop = Math.round(rect.top + window.scrollY);

    // 🚀 核心加固：同时监控宽高变化，确保缩放动效也能被实时同步
    const curL = parseFloat(instance.host.style.left) || 0;
    const curT = parseFloat(instance.host.style.top) || 0;
    const curW = parseFloat(instance.host.style.width) || 0;
    const curH = parseFloat(instance.host.style.height) || 0;

    if (
      Math.abs(curL - targetLeft) > 0.5 ||
      Math.abs(curT - targetTop) > 0.5 ||
      Math.abs(curW - rect.width) > 0.5 ||
      Math.abs(curH - rect.height) > 0.5
    ) {
      Object.assign(instance.host.style, {
        left: `${targetLeft}px`,
        top: `${targetTop}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`,
      });
    }
  }

  private setupObserver(instance: FloatingInstance) {
    instance.observer = new MutationObserver(() => {
      const newUrl = UrlResolver.resolveBestUrl(instance.target);
      if (newUrl && newUrl !== instance.url) {
        instance.url = newUrl;
        this.renderInstance(instance);
      }
    });
    instance.observer.observe(instance.target, {
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
  }

  private renderInstance(instance: FloatingInstance) {
    instance.root.render(
      <React.StrictMode>
        <MantineProvider
          forceColorScheme="dark"
          cssVariablesSelector={SELECTOR}
          getRootElement={() => instance.rootElement}
        >
          <FloatingButton
            visible={true}
            status={instance.status}
            progress={instance.progress}
            onDownload={() => this.triggerDownload(instance)}
            onDisable={() => {
              this.isMuted = true;
              this.instances.forEach((_, t) => this.removeInstance(t));
            }}
            onHidePermanent={() => {
              this.instances.forEach((_, t) => this.removeInstance(t));
            }}
            onClose={() => {
              this.isTemporarilyDisabled = true;
              this.instances.forEach((_, t) => this.removeInstance(t));
            }}
          />
        </MantineProvider>
      </React.StrictMode>,
    );
  }

  private removeInstance(target: HTMLElement) {
    const inst = this.instances.get(target);
    if (!inst) return;
    if (inst.rafId) cancelAnimationFrame(inst.rafId);
    if (inst.visibilityObserver) inst.visibilityObserver.disconnect();
    if (inst.observer) inst.observer.disconnect(); // 🚀 补齐：断开属性监听器
    if (inst.progressInterval) window.clearInterval(inst.progressInterval);
    if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
    inst.root.unmount();
    inst.host.remove();
    this.instances.delete(target);
  }

  private async triggerDownload(instance: FloatingInstance) {
    if (instance.status !== "idle") return;
    instance.status = "downloading";
    instance.progress = 0;
    this.renderInstance(instance);

    instance.progressInterval = window.setInterval(() => {
      instance.progress = Math.min(95, instance.progress + 5);
      this.renderInstance(instance);
    }, 200);

    try {
      const item: ImageItem = {
        id: "f-" + Math.random().toString(36).slice(2, 7),
        url: instance.url,
        width: 0,
        height: 0,
        format: "UNKNOWN",
        isSelected: true,
        pageTitle: document.title,
        pageUrl: window.location.href,
        sizeKB: 0,
      };
      await this.processor.downloadBatch([item], this.settings);
      instance.status = "success";
      instance.progress = 100;
    } catch {
      instance.status = "error";
    } finally {
      if (instance.progressInterval)
        window.clearInterval(instance.progressInterval);
      this.renderInstance(instance);
      window.setTimeout(() => {
        if (this.instances.has(instance.target)) {
          instance.status = "idle";
          if (!instance.isHovering) this.removeInstance(instance.target);
          else this.renderInstance(instance);
        }
      }, 2000);
    }
  }

  public async tryTriggerCustomDownload(url: string): Promise<boolean> {
    const inst = Array.from(this.instances.values()).find((i) => i.url === url);
    if (!inst) return false;
    this.triggerDownload(inst);
    return true;
  }
}
