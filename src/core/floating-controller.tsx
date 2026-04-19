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
  hideTimer: number | null;
  isHovering: boolean;
}

export class FloatingController {
  private instances: Map<HTMLElement, FloatingInstance> = new Map();
  private isMuted: boolean = false;
  private isTemporarilyDisabled: boolean = false;
  private settings: Settings = defaultSettings;

  private hoverTimer: number | null = null;
  private pendingTarget: HTMLElement | null = null;

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
      if (this.hoverTimer) clearTimeout(this.hoverTimer);
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
  }

  private async handleMouseOver(e: MouseEvent) {
    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;

    const path = e.composedPath();
    const target = (path[0] as HTMLElement) || (e.target as HTMLElement);

    // 检查是否是 UI 区域
    const isOverOurUI = path.some(
      (el) =>
        el instanceof HTMLElement &&
        el.classList.contains("imaget-floating-host"),
    );
    if (isOverOurUI) return;

    // 解析有效图片
    const candidateUrl = UrlResolver.resolveBestUrl(target);
    if (!candidateUrl || candidateUrl.startsWith("data:")) return;

    const minSize = this.settings.interfaceBehavior.minImageSize;
    const rect = target.getBoundingClientRect();
    if (rect.width < minSize - 10 && rect.height < minSize - 10) return;

    // 稳定防抖
    if (this.pendingTarget === target) return;
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.pendingTarget = target;

    this.hoverTimer = window.setTimeout(() => {
      if (this.pendingTarget === target) {
        this.createInstance(target, candidateUrl);
      }
      this.hoverTimer = null;
    }, 300);
  }

  private handleMouseOut(e: MouseEvent) {
    const related = e.relatedTarget as Node;
    if (this.pendingTarget === e.target) {
      this.pendingTarget = null;
      if (this.hoverTimer) clearTimeout(this.hoverTimer);
    }

    for (const [target, inst] of this.instances.entries()) {
      if (related && (inst.host.contains(related) || target === related)) {
        inst.isHovering = true;
        if (inst.hideTimer) clearTimeout(inst.hideTimer);
        continue;
      }

      inst.isHovering = false;
      if (inst.status !== "idle") continue;

      if (inst.hideTimer) clearTimeout(inst.hideTimer);
      inst.hideTimer = window.setTimeout(() => {
        if (!inst.isHovering && inst.status === "idle") {
          this.removeInstance(target);
        }
      }, 500);
    }
  }

  private createInstance(target: HTMLElement, url: string) {
    if (this.instances.has(target)) return;

    const host = document.createElement("div");
    host.className = "imaget-floating-host";
    const rect = target.getBoundingClientRect();
    Object.assign(host.style, {
      all: "initial",
      position: "absolute",
      left: `${rect.left + window.scrollX}px`,
      top: `${rect.top + window.scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
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
      hideTimer: null,
      isHovering: true,
    };

    this.instances.set(target, instance);
    this.renderInstance(instance);
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
              this.isTemporarilyDisabled = true;
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
    if (inst.progressInterval) clearInterval(inst.progressInterval);
    if (inst.hideTimer) clearTimeout(inst.hideTimer);
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
        id: "f-" + Date.now(),
        url: instance.url,
        width: 1000, // 给一个足够大的默认值，绕过小图过滤器
        height: 1000,
        format: "JPG",
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
      if (instance.progressInterval) clearInterval(instance.progressInterval);
      this.renderInstance(instance);
      setTimeout(() => {
        if (this.instances.has(instance.target)) {
          instance.status = "idle";
          this.renderInstance(instance);
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
