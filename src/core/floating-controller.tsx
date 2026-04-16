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
  hideTimer: number | null;
  isHovering: boolean;
}

export class FloatingController {
  private instances: Map<HTMLElement, FloatingInstance> = new Map();
  private isMuted: boolean = false;
  private isTemporarilyDisabled: boolean = false; // 核心修复：记录当前页面周期的暂时关闭状态
  private settings: Settings = defaultSettings;
  private timer: number | null = null;
  private pendingTarget: HTMLElement | null = null;
  private lastProcessedTarget: HTMLElement | null = null;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private graceTimer: number | null = null;

  // 记忆最近一次的悬浮目标，以供右键菜单唤起动画
  private lastTarget: HTMLElement | null = null;
  private lastUrl: string = "";

  private processor: ImageProcessor;

  constructor(_sniffer: Sniffer, processor: ImageProcessor) {
    this.processor = processor;
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

  public init() {
    document.addEventListener("pointerover", this.handleMouseOver, true);
    document.addEventListener("pointerout", this.handleMouseOut, true);

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.imaget_settings) {
          const newSettings = changes.imaget_settings.newValue as Settings;
          if (newSettings) {
            const oldDisabled =
              this.settings.interfaceBehavior.disabledDomains || [];
            const newDisabled =
              newSettings.interfaceBehavior.disabledDomains || [];
            const currentHost = window.location.hostname;

            if (
              oldDisabled.includes(currentHost) &&
              !newDisabled.includes(currentHost)
            ) {
              this.isMuted = false;
            }

            this.settings = newSettings;
            // 通知所有实例更新设置（如果需要，目前主要用于 render）
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

    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;
    if (
      this.settings.interfaceBehavior.disabledDomains &&
      this.settings.interfaceBehavior.disabledDomains.includes(
        window.location.hostname,
      )
    )
      return;

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

      // 检查是否已经是某个实例的 host
      let isHost = false;
      for (const inst of this.instances.values()) {
        if (inst.host === htmlEl || inst.host.contains(htmlEl)) {
          isHost = true;
          break;
        }
      }
      if (isHost) continue;

      let candidateUrl = UrlResolver.resolveBestUrl(htmlEl);
      let candidateEl = htmlEl;

      if (
        !candidateUrl &&
        (htmlEl.tagName === "A" ||
          htmlEl.tagName === "DIV" ||
          htmlEl.tagName === "PICTURE" ||
          htmlEl.tagName === "SOURCE")
      ) {
        const imgInside = htmlEl.querySelector("img");
        if (imgInside) {
          candidateUrl = UrlResolver.resolveBestUrl(imgInside);
          candidateEl = imgInside;
        }
      }

      if (
        !candidateUrl &&
        this.settings.interfaceBehavior.identifyBackgroundImages
      ) {
        const s = window.getComputedStyle(htmlEl);
        if (
          s.backgroundImage &&
          s.backgroundImage !== "none" &&
          s.backgroundImage.startsWith("url(")
        ) {
          candidateUrl = UrlResolver.resolveBestUrl(htmlEl);
        }
      }

      if (!candidateUrl || candidateUrl.startsWith("data:")) continue;

      const rect = candidateEl.getBoundingClientRect();
      const displayWidth = rect.width || candidateEl.offsetWidth;
      const displayHeight = rect.height || candidateEl.offsetHeight;

      let isLargeEnough = false;
      if (candidateEl instanceof HTMLImageElement) {
        isLargeEnough =
          displayWidth >= minSize - 8 ||
          displayHeight >= minSize - 8 ||
          candidateEl.naturalWidth >= minSize ||
          candidateEl.naturalHeight >= minSize;
      } else {
        isLargeEnough =
          displayWidth >= minSize - 8 || displayHeight >= minSize - 8;
      }

      if (isLargeEnough) {
        bestTarget = htmlEl;
        bestUrl = candidateUrl;
        break;
      }
    }

    if (!bestTarget || !bestUrl) return;
    if (
      bestTarget.tagName === "INPUT" ||
      bestTarget.tagName === "TEXTAREA" ||
      bestTarget.isContentEditable
    )
      return;

    const finalTarget = bestTarget;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const dist = Math.sqrt(
      Math.pow(mouseX - this.lastMouseX, 2) +
        Math.pow(mouseY - this.lastMouseY, 2),
    );
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;

    const existingInstance = this.instances.get(finalTarget);

    if (this.graceTimer && dist < 20) {
      window.clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.pendingTarget = finalTarget;

      if (existingInstance) {
        existingInstance.isHovering = true;
        if (existingInstance.hideTimer) {
          window.clearTimeout(existingInstance.hideTimer);
          existingInstance.hideTimer = null;
        }
        this.updateInstanceRect(existingInstance);
      }
      return;
    }

    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.graceTimer) {
      window.clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    this.pendingTarget = finalTarget;

    const triggerLogic = async () => {
      if (this.graceTimer) {
        this.timer = window.setTimeout(triggerLogic, 50);
        return;
      }

      const activeTarget = this.pendingTarget;
      if (!activeTarget) {
        this.timer = null;
        return;
      }

      const url = UrlResolver.resolveBestUrl(activeTarget);
      if (!url || url.startsWith("data:")) {
        this.timer = null;
        return;
      }

      this.lastTarget = activeTarget;
      this.lastUrl = url;

      const inst = this.instances.get(activeTarget);
      if (inst) {
        inst.isHovering = true;
        if (inst.hideTimer) {
          window.clearTimeout(inst.hideTimer);
          inst.hideTimer = null;
        }
        this.updateInstanceRect(inst);
      } else {
        this.createInstance(activeTarget, url);
      }
      this.timer = null;
    };

    this.timer = window.setTimeout(triggerLogic, 300);
  }

  private handleMouseOut(e: MouseEvent) {
    if (this.graceTimer) window.clearTimeout(this.graceTimer);
    this.graceTimer = window.setTimeout(() => {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
      this.graceTimer = null;
      this.pendingTarget = null;
    }, 50);

    // 检查是否离开了某个实例的目标或按钮
    for (const [target, inst] of this.instances.entries()) {
      if (
        e.relatedTarget &&
        (inst.host.contains(e.relatedTarget as Node) ||
          target === e.relatedTarget)
      ) {
        inst.isHovering = true;
        if (inst.hideTimer) {
          window.clearTimeout(inst.hideTimer);
          inst.hideTimer = null;
        }
        continue;
      }

      // 如果确实离开了
      inst.isHovering = false;

      // 如果正在下载或成功/错误显示中，不隐藏
      if (inst.status !== "idle") {
        if (inst.hideTimer) {
          window.clearTimeout(inst.hideTimer);
          inst.hideTimer = null;
        }
        continue;
      }

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
    host.dataset.targetUrl = url;
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
      hideTimer: null,
      isHovering: true,
    };

    this.instances.set(target, instance);
    this.updateInstanceRect(instance);
    this.setupObserver(instance);
    this.renderInstance(instance);
  }

  private updateInstanceRect(instance: FloatingInstance) {
    const rect = instance.target.getBoundingClientRect();
    Object.assign(instance.host.style, {
      left: `${Math.round(rect.left + window.scrollX)}px`,
      top: `${Math.round(rect.top + window.scrollY)}px`,
      width: `${Math.round(rect.width)}px`,
      height: `${Math.round(rect.height)}px`,
    });
  }

  private setupObserver(instance: FloatingInstance) {
    if (instance.observer) instance.observer.disconnect();

    instance.observer = new MutationObserver(() => {
      const newUrl = UrlResolver.resolveBestUrl(instance.target);
      if (newUrl && newUrl !== instance.url) {
        instance.url = newUrl;
        instance.host.dataset.targetUrl = newUrl;
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
              const currentDomain = window.location.hostname;
              const domains =
                this.settings.interfaceBehavior.disabledDomains || [];
              if (!domains.includes(currentDomain)) {
                const newSettings = {
                  ...this.settings,
                  interfaceBehavior: {
                    ...this.settings.interfaceBehavior,
                    disabledDomains: [...domains, currentDomain],
                  },
                };
                this.settings = newSettings;
                chrome.storage.local.set({ imaget_settings: newSettings });
              }
              this.instances.forEach((_, t) => this.removeInstance(t));
            }}
            onHidePermanent={() => {
              const newSettings = {
                ...this.settings,
                interfaceBehavior: {
                  ...this.settings.interfaceBehavior,
                  showFloatingButton: false,
                },
              };
              this.settings = newSettings;
              chrome.storage.local.set({ imaget_settings: newSettings });
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

    if (inst.progressInterval) {
      window.clearInterval(inst.progressInterval);
    }
    if (inst.observer) {
      inst.observer.disconnect();
    }
    if (inst.hideTimer) {
      window.clearTimeout(inst.hideTimer);
    }
    inst.root.unmount();
    if (inst.host.parentNode) {
      inst.host.parentNode.removeChild(inst.host);
    }
    this.instances.delete(target);
  }

  private async triggerDownload(instance: FloatingInstance) {
    if (instance.status !== "idle") return;

    const url = instance.url;
    instance.status = "downloading";
    instance.progress = 0;
    this.renderInstance(instance);

    instance.progressInterval = window.setInterval(() => {
      if (instance.progress < 30) instance.progress += Math.random() * 10;
      else if (instance.progress < 95) instance.progress += Math.random() * 2;
      if (instance.progress > 95) instance.progress = 95;
      this.renderInstance(instance);
    }, 150);

    const item: ImageItem = {
      id: "floating-" + Math.random().toString(36).slice(2),
      url: url,
      width: 0,
      height: 0,
      sizeKB: 0,
      format: "UNKNOWN",
      isSelected: true,
      pageTitle: document.title,
      pageUrl: window.location.href,
    };

    await this.loadSettings();

    try {
      if (import.meta.env.DEV && this.settings.debug?.simulateDownloadFailure) {
        throw new Error("Simulated download failure");
      }
      await this.processor.downloadBatch([item], this.settings);

      if (instance.progressInterval)
        window.clearInterval(instance.progressInterval);
      instance.progressInterval = null;
      instance.status = "success";
      instance.progress = 100;
      this.renderInstance(instance);

      window.setTimeout(() => {
        if (this.instances.has(instance.target)) {
          instance.status = "idle";
          instance.progress = 0;
          if (!instance.isHovering) {
            this.removeInstance(instance.target);
          } else {
            this.renderInstance(instance);
          }
        }
      }, 2000);
    } catch (err) {
      console.error("Floating download failed:", err);
      instance.status = "error";
      if (instance.progressInterval)
        window.clearInterval(instance.progressInterval);
      instance.progressInterval = null;
      this.renderInstance(instance);

      window.setTimeout(() => {
        if (this.instances.has(instance.target)) {
          instance.status = "idle";
          if (!instance.isHovering) {
            this.removeInstance(instance.target);
          } else {
            this.renderInstance(instance);
          }
        }
      }, 2000);
    }
  }

  public async tryTriggerCustomDownload(
    url: string,
    item: ImageItem,
    customSettings: Settings,
  ): Promise<boolean> {
    // 寻找匹配 URL 的实例
    let inst: FloatingInstance | undefined;
    for (const i of this.instances.values()) {
      if (i.url === url) {
        inst = i;
        break;
      }
    }

    if (!inst && this.lastUrl === url && this.lastTarget?.isConnected) {
      this.createInstance(this.lastTarget, url);
      inst = this.instances.get(this.lastTarget);
    }

    if (!inst) return false;

    if (inst.status !== "idle") {
      const target = inst.target;
      this.removeInstance(target);
      this.createInstance(target, url);
      inst = this.instances.get(target);
    }

    if (!inst) return false;

    const targetInst = inst;
    targetInst.status = "downloading";
    targetInst.progress = 0;
    this.renderInstance(targetInst);

    targetInst.progressInterval = window.setInterval(() => {
      if (targetInst.progress < 30) targetInst.progress += Math.random() * 10;
      else if (targetInst.progress < 95)
        targetInst.progress += Math.random() * 2;
      if (targetInst.progress > 95) targetInst.progress = 95;
      this.renderInstance(targetInst);
    }, 150);

    try {
      if (import.meta.env.DEV && this.settings.debug?.simulateDownloadFailure) {
        throw new Error("Simulated download failure");
      }
      await this.processor.downloadBatch([item], customSettings);

      if (targetInst.progressInterval)
        window.clearInterval(targetInst.progressInterval);
      targetInst.progressInterval = null;
      targetInst.status = "success";
      targetInst.progress = 100;
      this.renderInstance(targetInst);

      window.setTimeout(() => {
        if (this.instances.has(targetInst.target)) {
          targetInst.status = "idle";
          targetInst.progress = 0;
          if (!targetInst.isHovering) {
            this.removeInstance(targetInst.target);
          } else {
            this.renderInstance(targetInst);
          }
        }
      }, 2000);
    } catch (err) {
      console.error("Floating custom download failed:", err);
      targetInst.status = "error";
      if (targetInst.progressInterval)
        window.clearInterval(targetInst.progressInterval);
      targetInst.progressInterval = null;
      this.renderInstance(targetInst);

      window.setTimeout(() => {
        if (this.instances.has(targetInst.target)) {
          targetInst.status = "idle";
          if (!targetInst.isHovering) {
            this.removeInstance(targetInst.target);
          } else {
            this.renderInstance(targetInst);
          }
        }
      }, 2000);
    }

    return true;
  }
}
