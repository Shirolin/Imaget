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

interface ActiveInstance {
  id: string;
  target: HTMLElement;
  url: string;
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  isHovering: boolean;
  progressInterval?: number;
  hideTimer?: number;
  wrapperRef: HTMLDivElement | null;
}

export class FloatingController {
  private isMuted: boolean = false;
  private isTemporarilyDisabled: boolean = false;
  private settings: Settings = defaultSettings;

  // Singleton DOM
  private host: HTMLElement | null = null;
  private rootElement: HTMLElement | null = null;
  private root: ReactDOM.Root | null = null;

  private instances = new Map<HTMLElement, ActiveInstance>();
  private rafId: number | null = null;

  private pendingTarget: HTMLElement | null = null;
  private hoverTimer: number | null = null;

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
      this.clearAllInstances();
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
    this.clearAllInstances();
  }

  private setupHost() {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.className = "imaget-floating-host";
    Object.assign(this.host.style, {
      all: "initial",
      position: "fixed", // 覆盖全屏视口
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483646",
      display: "none", // 初始隐藏
    });

    document.body.appendChild(this.host);
    const shadow = this.host.attachShadow({ mode: "open" });
    const styleTag = document.createElement("style");
    styleTag.textContent = finalCSS;
    shadow.appendChild(styleTag);

    this.rootElement = document.createElement("div");
    this.rootElement.className = SELECTOR.replace(".", "");
    this.rootElement.style.width = "100%";
    this.rootElement.style.height = "100%";
    shadow.appendChild(this.rootElement);

    this.root = ReactDOM.createRoot(this.rootElement);
  }

  private startPositionTracking() {
    if (this.rafId) return;

    const track = () => {
      let activeCount = 0;

      for (const [target, inst] of Array.from(this.instances.entries())) {
        // 如果目标图被动态摘除，清理掉
        if (!document.body.contains(target)) {
          this.removeInstance(target);
          continue;
        }

        activeCount++;

        if (inst.wrapperRef) {
          const rect = target.getBoundingClientRect();
          inst.wrapperRef.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
          inst.wrapperRef.style.width = `${rect.width}px`;
          inst.wrapperRef.style.height = `${rect.height}px`;
        }
      }

      if (activeCount === 0) {
        this.rafId = null;
        if (this.host) this.host.style.display = "none";
        return;
      }

      this.rafId = requestAnimationFrame(track);
    };

    /**
     * 极速 DOM Mutation 更新，无需频繁扰动 React 渲染树
     */
    this.rafId = requestAnimationFrame(track);
  }

  private stopPositionTracking() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private renderReact() {
    if (!this.root || !this.rootElement) return;

    const activeInstances = Array.from(this.instances.values());
    if (activeInstances.length === 0) {
      if (this.host) this.host.style.display = "none";
      this.root.render(<></>);
      return;
    }

    if (this.host) this.host.style.display = "block";

    this.root.render(
      <React.StrictMode>
        <MantineProvider
          forceColorScheme="dark"
          cssVariablesSelector={SELECTOR}
          getRootElement={() => this.rootElement!}
        >
          {activeInstances.map((inst) => (
            <div
              key={inst.id}
              ref={(el) => {
                inst.wrapperRef = el;
                // 初始化强制定下位，随后交给 track 刷新
                if (el) {
                  const rect = inst.target.getBoundingClientRect();
                  el.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
                  el.style.width = `${rect.width}px`;
                  el.style.height = `${rect.height}px`;
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                willChange: "transform",
              }}
            >
              <FloatingButton
                visible={inst.isHovering || inst.status !== "idle"}
                status={inst.status}
                progress={inst.progress}
                onDownload={() => this.triggerDownload(inst)}
                onDisable={() => {
                  this.setMuted(true);
                }}
                onHidePermanent={() => {
                  this.isTemporarilyDisabled = true;
                  this.clearAllInstances();
                }}
                onClose={() => {
                  this.isTemporarilyDisabled = true;
                  this.clearAllInstances();
                }}
                onMouseEnter={() => {
                  inst.isHovering = true;
                  if (inst.hideTimer) {
                    clearTimeout(inst.hideTimer);
                    inst.hideTimer = undefined;
                  }
                  this.renderReact();
                }}
                onMouseLeave={() => {
                  this.scheduleHideInstance(inst.target);
                }}
              />
            </div>
          ))}
        </MantineProvider>
      </React.StrictMode>,
    );
  }

  private clearAllInstances() {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    for (const inst of this.instances.values()) {
      if (inst.progressInterval) clearInterval(inst.progressInterval);
      if (inst.hideTimer) clearTimeout(inst.hideTimer);
    }
    this.instances.clear();
    this.stopPositionTracking();
    this.renderReact();
  }

  private removeInstance(target: HTMLElement) {
    const inst = this.instances.get(target);
    if (!inst) return;
    if (inst.progressInterval) clearInterval(inst.progressInterval);
    if (inst.hideTimer) clearTimeout(inst.hideTimer);
    this.instances.delete(target);
    this.renderReact();
  }

  private showInstance(target: HTMLElement, url: string) {
    this.setupHost();

    let inst = this.instances.get(target);
    if (!inst) {
      inst = {
        id: "inst-" + Date.now() + Math.random(),
        target,
        url,
        status: "idle",
        progress: 0,
        isHovering: true,
        wrapperRef: null,
      };
      this.instances.set(target, inst);
    }

    inst.isHovering = true;
    if (inst.hideTimer) {
      clearTimeout(inst.hideTimer);
      inst.hideTimer = undefined;
    }

    this.renderReact();
    this.startPositionTracking();
  }

  private scheduleHideInstance(target: HTMLElement) {
    const inst = this.instances.get(target);
    if (!inst) return;

    inst.isHovering = false;

    // 如果不在进行中也不是失败/成功停留态，准备离场清理
    if (inst.status !== "idle") return;

    if (inst.hideTimer) clearTimeout(inst.hideTimer);

    // 渲染更新 visible
    this.renderReact();

    inst.hideTimer = window.setTimeout(() => {
      // 动画完全跑完了再清场
      const currentInst = this.instances.get(target);
      if (
        currentInst &&
        !currentInst.isHovering &&
        currentInst.status === "idle"
      ) {
        this.removeInstance(target);
      }
    }, 500);
  }

  private async handleMouseOver(e: MouseEvent) {
    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;

    const path = e.composedPath();
    const target = (path[0] as HTMLElement) || (e.target as HTMLElement);

    const isOverOurUI = path.some(
      (el) =>
        el instanceof HTMLElement &&
        el.classList.contains("imaget-floating-host"),
    );
    if (isOverOurUI) return;

    const candidateUrl = UrlResolver.resolveBestUrl(target);
    if (!candidateUrl || candidateUrl.startsWith("data:")) return;

    const minSize = this.settings.interfaceBehavior.minImageSize;
    const rect = target.getBoundingClientRect();
    if (rect.width < minSize - 10 && rect.height < minSize - 10) return;

    // 如果目标已经存在实例中，立即续租
    const inst = this.instances.get(target);
    if (inst) {
      inst.isHovering = true;
      if (inst.hideTimer) {
        clearTimeout(inst.hideTimer);
        inst.hideTimer = undefined;
      }
      this.renderReact();
      return;
    }

    // 清理其他未激活 hoverTimer
    if (this.pendingTarget !== target) {
      if (this.hoverTimer) clearTimeout(this.hoverTimer);
      this.pendingTarget = target;

      this.hoverTimer = window.setTimeout(() => {
        if (this.pendingTarget === target) {
          this.showInstance(target, candidateUrl);
        }
        this.hoverTimer = null;
      }, 300);
    }
  }

  private handleMouseOut(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const related = e.relatedTarget as Node | null;

    if (this.pendingTarget === target) {
      this.pendingTarget = null;
      if (this.hoverTimer) clearTimeout(this.hoverTimer);
    }

    const inst = this.instances.get(target);
    if (!inst) return;

    if (related) {
      // 从图片移入 UI 或者在 UI 内部移动
      // 因为 UI 在宿主内，所以鼠标移向 UI 会导致 e.relatedTarget 被重定向为 host
      if (this.host?.contains(related) || target === related) {
        // UI 的实际进入判断现在由组件自身的 onMouseEnter 接管
        return;
      }
    }

    this.scheduleHideInstance(target);
  }

  private async triggerDownload(inst: ActiveInstance) {
    if (inst.status !== "idle") return;

    inst.status = "downloading";
    inst.progress = 0;
    this.renderReact();

    inst.progressInterval = window.setInterval(() => {
      inst.progress = Math.min(95, inst.progress + 5);
      this.renderReact();
    }, 200);

    try {
      let width = inst.target.getBoundingClientRect().width;
      let height = inst.target.getBoundingClientRect().height;

      if (inst.target instanceof HTMLImageElement) {
        if (inst.target.naturalWidth) width = inst.target.naturalWidth;
        if (inst.target.naturalHeight) height = inst.target.naturalHeight;
      }

      const item: ImageItem = {
        id: "f-" + Date.now(),
        url: inst.url,
        width: Math.round(width),
        height: Math.round(height),
        format: "JPG",
        isSelected: true,
        pageTitle: document.title,
        pageUrl: window.location.href,
        sizeKB: 0,
      };

      await this.processor.downloadBatch([item], this.settings);
      inst.status = "success";
      inst.progress = 100;
    } catch {
      inst.status = "error";
    } finally {
      if (inst.progressInterval) clearInterval(inst.progressInterval);
      this.renderReact();

      setTimeout(() => {
        const currentInst = this.instances.get(inst.target);
        if (currentInst) {
          currentInst.status = "idle";
          if (!currentInst.isHovering) {
            this.scheduleHideInstance(currentInst.target);
          } else {
            this.renderReact();
          }
        }
      }, 2000);
    }
  }

  public async tryTriggerCustomDownload(url: string): Promise<boolean> {
    for (const inst of this.instances.values()) {
      if (inst.url === url && inst.status === "idle") {
        this.triggerDownload(inst);
        return true;
      }
    }
    return false;
  }
}
