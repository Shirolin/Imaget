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
  target: HTMLElement;
  url: string;
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  progressInterval: number | null;
  observer: MutationObserver | null;
  visibilityObserver: IntersectionObserver | null; // 性能核心：可见性监测
  hideTimer: number | null;
  isHovering: boolean;
  isVisible: boolean; // 是否在视野内
  isFrozen: boolean;
  rafId: number | null;
}

export class FloatingController {
  private instances: Map<HTMLElement, FloatingInstance> = new Map();
  private isMuted: boolean = false;
  private isTemporarilyDisabled: boolean = false;
  private settings: Settings = defaultSettings;
  private timer: number | null = null;
  private pendingTarget: HTMLElement | null = null;
  private lastProcessedTarget: HTMLElement | null = null;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
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
    }
  }

  public init() {
    document.addEventListener("pointerover", this.handleMouseOver, true);
    document.addEventListener("pointerout", this.handleMouseOut, true);

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.imaget_settings) {
          const newSettings = changes.imaget_settings.newValue as Settings;
          if (newSettings) {
            this.settings = newSettings;
            this.instances.forEach((instance) => this.renderInstance(instance));
          }
        }
      });
    }
  }

  public destroy() {
    document.removeEventListener("pointerover", this.handleMouseOver, true);
    document.removeEventListener("pointerout", this.handleMouseOut, true);
    this.instances.forEach((_, target) => this.removeInstance(target));
  }

  private async handleMouseOver(e: MouseEvent) {
    const path = e.composedPath();
    const target = (path[0] as HTMLElement) || (e.target as HTMLElement);

    // 检查鼠标是否进入了我们的 UI 内部
    const isOverOurUI = path.some(
      (el) =>
        el instanceof HTMLElement &&
        (el.classList.contains("imaget-floating-host") ||
          el.classList.contains("imaget-floating-container")),
    );

    if (isOverOurUI) {
      this.instances.forEach((inst) => (inst.isFrozen = true));
    } else {
      const instance = Array.from(this.instances.values()).find((i) =>
        i.host.contains(target),
      );
      if (!instance) {
        this.instances.forEach((inst) => (inst.isFrozen = false));
      }
    }

    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;

    if (!target || !(target instanceof HTMLElement)) return;
    if (this.lastProcessedTarget === target) return;
    this.lastProcessedTarget = target;

    const minSize = this.settings.interfaceBehavior.minImageSize;
    const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);

    let bestTarget: HTMLElement | null = null;
    let bestUrl: string = "";

    const searchDepth = Math.min(elementsUnder.length, 10);
    for (let i = 0; i < searchDepth; i++) {
      const el = elementsUnder[i];
      if (!(el instanceof HTMLElement)) continue;
      const htmlEl = el as HTMLElement;

      let isCurrentHost = false;
      for (const inst of this.instances.values()) {
        if (inst.host === htmlEl || inst.host.contains(htmlEl)) {
          isCurrentHost = true;
          break;
        }
      }
      if (isCurrentHost) continue;

      let candidateUrl = UrlResolver.resolveBestUrl(htmlEl);
      let candidateEl = htmlEl;

      if (!candidateUrl && ["A", "DIV", "PICTURE"].includes(htmlEl.tagName)) {
        const imgInside = htmlEl.querySelector("img");
        if (imgInside) {
          candidateUrl = UrlResolver.resolveBestUrl(imgInside);
          candidateEl = imgInside;
        }
      }

      if (!candidateUrl || candidateUrl.startsWith("data:")) continue;

      const rect = candidateEl.getBoundingClientRect();
      if (rect.width >= minSize - 8 || rect.height >= minSize - 8) {
        bestTarget = htmlEl;
        bestUrl = candidateUrl;
        break;
      }
    }

    if (!bestTarget || !bestUrl) return;

    this.pendingTarget = bestTarget;
    if (this.timer) window.clearTimeout(this.timer);

    this.timer = window.setTimeout(() => {
      if (!this.pendingTarget) return;
      const inst = this.instances.get(this.pendingTarget);
      if (inst) {
        inst.isHovering = true;
        if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
        this.updateInstanceRect(inst);
      } else {
        this.createInstance(this.pendingTarget, bestUrl!);
      }
      this.timer = null;
    }, 300);
  }

  private handleMouseOut(e: MouseEvent) {
    if (this.graceTimer) window.clearTimeout(this.graceTimer);
    this.graceTimer = window.setTimeout(() => {
      this.pendingTarget = null;
      this.graceTimer = null;
    }, 50);

    for (const [target, inst] of this.instances.entries()) {
      if (
        e.relatedTarget &&
        (inst.host.contains(e.relatedTarget as Node) ||
          target === e.relatedTarget)
      ) {
        inst.isHovering = true;
        if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
        continue;
      }

      inst.isHovering = false;
      if (inst.status !== "idle") continue;

      if (inst.hideTimer) window.clearTimeout(inst.hideTimer);
      inst.hideTimer = window.setTimeout(() => {
        if (!inst.isHovering && inst.status === "idle") {
          this.removeInstance(target);
        }
      }, 500);
    }
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
    instance.visibilityObserver = new IntersectionObserver((entries) => {
      instance.isVisible = entries[0].isIntersecting;
      if (!instance.isVisible && instance.rafId) {
        cancelAnimationFrame(instance.rafId);
        instance.rafId = null;
      } else if (instance.isVisible && !instance.rafId && !instance.isFrozen) {
        this.startTracking(instance);
      }
    });
    instance.visibilityObserver.observe(instance.target);
  }

  private startTracking(instance: FloatingInstance) {
    if (instance.rafId) return;
    const update = () => {
      if (!this.instances.has(instance.target) || !instance.isVisible) {
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

    const curL = parseFloat(instance.host.style.left) || 0;
    const curT = parseFloat(instance.host.style.top) || 0;

    if (Math.abs(curL - targetLeft) > 0.5 || Math.abs(curT - targetTop) > 0.5) {
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
    if (inst.observer) inst.observer.disconnect();
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
