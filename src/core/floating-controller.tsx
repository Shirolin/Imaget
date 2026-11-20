import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import type { Sniffer } from "./sniffer";
import type { ImageProcessor } from "./processor";
import {
  FloatingButton,
  type CopyStatus,
  type FloatingActionLayout,
} from "../ui/components/FloatingButton";
import { type Settings, defaultSettings } from "../types";
import { createImageItemFromElement } from "./utils/image-item-factory";
import { UrlResolver } from "./utils/url-resolver";
import { copyPngToClipboard } from "./utils/clipboard";
import { isDomainDisabled } from "./utils/settings-policy";
import mantineStyles from "@mantine/core/styles.css?inline";
import { getBrandFontFaceCss } from "./utils/brand-font";
import { getFontStackByLocale } from "../ui/theme";
import { getLocale, onLocaleChange } from "./utils/i18n";

const SELECTOR = ".imaget-floating-container";
// 使用正则替换仅选择器位置的 :root，避免替换属性值中的内容
const finalCSS = mantineStyles.replace(/(?:^|,)\s*:root(?=\s*{)/g, (match) =>
  match.replace(":root", SELECTOR),
);

interface ActiveInstance {
  id: string;
  target: HTMLElement;
  url: string;
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  copyStatus: CopyStatus;
  copyTimer?: number;
  layout: FloatingActionLayout;
  isHovering: boolean;
  hideTimer?: number;
  wrapperRef: HTMLDivElement | null;
}

/** 竖向动作轨道需要的空间（主按钮顶到最后一个圆点底部 + 余量） */
const RAIL_MIN_SPACE = 160;

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
    this.watchSettings();
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

  private watchSettings() {
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.imaget_settings?.newValue) {
          this.settings = changes.imaget_settings.newValue as Settings;
        }
      });
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
    styleTag.textContent = getBrandFontFaceCss() + "\n" + finalCSS;
    shadow.appendChild(styleTag);

    this.rootElement = document.createElement("div");
    this.rootElement.className = SELECTOR.replace(".", "");
    this.rootElement.style.width = "100%";
    this.rootElement.style.height = "100%";
    this.rootElement.style.setProperty(
      "--imaget-font-family",
      getFontStackByLocale(getLocale()),
    );
    onLocaleChange((locale) => {
      this.rootElement?.style.setProperty(
        "--imaget-font-family",
        getFontStackByLocale(locale),
      );
    });
    shadow.appendChild(this.rootElement);

    this.root = ReactDOM.createRoot(this.rootElement);
  }

  private startPositionTracking() {
    if (this.rafId) return;

    const track = () => {
      let activeCount = 0;
      let layoutChanged = false;

      for (const [target, inst] of Array.from(this.instances.entries())) {
        // 如果目标图被动态摘除，清理掉
        if (!document.body.contains(target)) {
          this.removeInstance(target);
          continue;
        }

        activeCount++;

        const rect = target.getBoundingClientRect();
        if (inst.wrapperRef) {
          inst.wrapperRef.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
          inst.wrapperRef.style.width = `${rect.width}px`;
          inst.wrapperRef.style.height = `${rect.height}px`;
        }

        // 滚动或图片尺寸变化可能让竖向轨道放不下，跟随切换布局
        const layout = this.resolveLayout(rect);
        if (inst.layout !== layout) {
          inst.layout = layout;
          layoutChanged = true;
        }
      }

      if (layoutChanged) this.renderReact();

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
                visible={
                  inst.isHovering ||
                  inst.status !== "idle" ||
                  inst.copyStatus !== "idle"
                }
                status={inst.status}
                progress={inst.progress}
                copyStatus={inst.copyStatus}
                layout={inst.layout}
                onDownload={() => this.triggerDownload(inst)}
                onCopy={() => this.triggerCopy(inst)}
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
      if (inst.hideTimer) clearTimeout(inst.hideTimer);
      if (inst.copyTimer) clearTimeout(inst.copyTimer);
    }
    this.instances.clear();
    this.stopPositionTracking();
    this.renderReact();
  }

  private removeInstance(target: HTMLElement) {
    const inst = this.instances.get(target);
    if (!inst) return;
    if (inst.hideTimer) clearTimeout(inst.hideTimer);
    if (inst.copyTimer) clearTimeout(inst.copyTimer);
    this.instances.delete(target);
    this.renderReact();
  }

  /**
   * 图片太矮或贴近视口底部时，竖向轨道会溢出图片/被视口裁掉，
   * 此时改为向左横向展开；否则保持竖向轨道。
   */
  private resolveLayout(rect: DOMRect): FloatingActionLayout {
    const available = Math.min(rect.height, window.innerHeight - rect.top);
    return available >= RAIL_MIN_SPACE ? "rail" : "row";
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
        copyStatus: "idle",
        layout: this.resolveLayout(target.getBoundingClientRect()),
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

    // 按钮即将可见：预热后台 SW，使点击后的首条消息免于冷启动等待
    this.processor.warmup();
    this.renderReact();
    this.startPositionTracking();
  }

  private scheduleHideInstance(target: HTMLElement) {
    const inst = this.instances.get(target);
    if (!inst) return;

    inst.isHovering = false;

    // 下载/复制进行中或停留在结果态时不要离场，否则反馈还没播完按钮就没了
    if (inst.status !== "idle" || inst.copyStatus !== "idle") return;

    if (inst.hideTimer) clearTimeout(inst.hideTimer);

    // 渲染更新 visible
    this.renderReact();

    inst.hideTimer = window.setTimeout(() => {
      // 动画完全跑完了再清场
      const currentInst = this.instances.get(target);
      if (
        currentInst &&
        !currentInst.isHovering &&
        currentInst.status === "idle" &&
        currentInst.copyStatus === "idle"
      ) {
        this.removeInstance(target);
      }
    }, 500);
  }

  private async handleMouseOver(e: MouseEvent) {
    if (this.isMuted || this.isTemporarilyDisabled) return;
    if (!this.settings.interfaceBehavior.showFloatingButton) return;
    if (
      isDomainDisabled(
        window.location.href,
        this.settings.interfaceBehavior.disabledDomains,
      )
    ) {
      return;
    }

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

  private async triggerDownload(
    inst: ActiveInstance,
    settings = this.settings,
  ) {
    if (inst.status !== "idle") return;

    inst.status = "downloading";
    inst.progress = 0;
    this.renderReact();

    try {
      const item = createImageItemFromElement({
        id: "f-" + Date.now(),
        url: inst.url,
        target: inst.target,
        pageTitle: document.title,
        pageUrl: window.location.href,
      });

      await this.processor.downloadBatch(
        [item],
        settings,
        (curr: number, total: number) => {
          inst.progress = Math.round((curr / total) * 100);
          this.renderReact();
        },
      );
      inst.status = "success";
      inst.progress = 100;
    } catch (err) {
      console.error("[FloatingController] Download failed:", err);
      inst.status = "error";
    } finally {
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

  private scheduleCopyReset(inst: ActiveInstance) {
    if (inst.copyTimer) clearTimeout(inst.copyTimer);
    inst.copyTimer = window.setTimeout(() => {
      inst.copyTimer = undefined;
      if (this.instances.get(inst.target) !== inst) return;
      inst.copyStatus = "idle";
      if (inst.isHovering) this.renderReact();
      else this.scheduleHideInstance(inst.target);
    }, 2000);
  }

  private async triggerCopy(inst: ActiveInstance) {
    if (inst.copyStatus === "busy") return;
    if (inst.copyTimer) {
      clearTimeout(inst.copyTimer);
      inst.copyTimer = undefined;
    }

    inst.copyStatus = "busy";
    this.renderReact();

    // 关键：ClipboardItem 接收 Promise<Blob>，clipboard.write 必须在点击任务内同步调用，
    // 否则等 fetch 完成后再写会因 transient activation 失效而抛 NotAllowedError。
    const pngPromise = this.processor.fetchImageAsPng(
      inst.url,
      window.location.href,
    );
    // 写入失败时该 Promise 可能无人消费，先挂一个空 handler 避免 unhandled rejection
    pngPromise.catch(() => {});

    try {
      await copyPngToClipboard(pngPromise);
      inst.copyStatus = "image";
    } catch (err) {
      console.warn(
        "[FloatingController] Copy image failed, falling back to link:",
        err,
      );
      try {
        await navigator.clipboard.writeText(inst.url);
        inst.copyStatus = "link";
      } catch (fallbackErr) {
        console.warn("[FloatingController] Copy link failed:", fallbackErr);
        inst.copyStatus = "error";
      }
    } finally {
      this.renderReact();
      this.scheduleCopyReset(inst);
    }
  }

  public async tryTriggerCustomDownload(
    url: string,
    settings = this.settings,
  ): Promise<boolean> {
    for (const inst of this.instances.values()) {
      if (inst.url === url && inst.status === "idle") {
        this.triggerDownload(inst, settings);
        return true;
      }
    }
    return false;
  }
}
