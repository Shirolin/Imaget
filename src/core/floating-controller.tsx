import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Sniffer } from "./sniffer";
import { ImageProcessor } from "./processor";
import { FloatingButton } from "../ui/components/FloatingButton";
import { Settings, defaultSettings, ImageItem } from "../types";
import { UrlResolver } from "./utils/url-resolver";
import mantineStyles from "@mantine/core/styles.css?inline";

const SELECTOR = ".imaget-floating-container";
const finalCSS = mantineStyles.replaceAll(":root", SELECTOR);

export class FloatingController {
  private currentHost: HTMLElement | null = null;
  private currentRoot: ReactDOM.Root | null = null;
  private currentRootElement: HTMLElement | null = null;
  private isMuted: boolean = false;
  private settings: Settings = defaultSettings;
  private observer: MutationObserver | null = null;
  private timer: number | null = null;
  private hideTimer: number | null = null;
  private currentTarget: HTMLElement | null = null;
  private currentUrl: string = "";

  // 🚀 记录鼠标位置与宽限期计时器
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private graceTimer: number | null = null;

  // 🚀 待处理的目标（用于延迟衔接）
  private pendingTarget: HTMLElement | null = null;
  private pendingUrl: string = "";

  // 记忆最近一次的悬浮目标，以供右键菜单唤起动画
  private lastTarget: HTMLElement | null = null;
  private lastUrl: string = "";

  // 🚀 进度与状态追踪
  private status: "idle" | "downloading" | "success" | "error" = "idle";
  private progress: number = 0;
  private progressInterval: number | null = null;

  // 🚀 追踪鼠标是否仍在触发目标图片上
  private isHoveringTarget: boolean = false;

  constructor(
    private sniffer: Sniffer,
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

  public init() {
    // 使用 capture 为 true 以先行捕获事件
    // 使用 pointerover 以更好地处理触控和现代浏览器的多种交互
    document.addEventListener("pointerover", this.handleMouseOver, true);
    document.addEventListener("pointerout", this.handleMouseOut, true);
  }

  public destroy() {
    document.removeEventListener("pointerover", this.handleMouseOver, true);
    document.removeEventListener("pointerout", this.handleMouseOut, true);
    this.hideFloatingImmediate();
  }

  private async handleMouseOver(e: MouseEvent) {
    // 穿透 Shadow DOM 获取真实触发目标
    const path = e.composedPath();
    let target = (path[0] as HTMLElement) || (e.target as HTMLElement);

    if (this.isMuted) return;

    // 每次 hover 尝试加载最新设置
    await this.loadSettings();

    if (!this.settings.interfaceBehavior.showFloatingButton) {
      // console.log("[FloatingController] showFloatingButton setting is disabled.");
      return;
    }

    if (
      this.settings.interfaceBehavior.disabledDomains &&
      this.settings.interfaceBehavior.disabledDomains.includes(
        window.location.hostname,
      )
    ) {
      return;
    }

    if (!target || !(target instanceof HTMLElement)) return;

    // 🚀 核心改进：穿透遮罩层寻找真正的图片
    // 如果当前目标不是图片且没有背景图，尝试从当前坐标向下寻找
    const isDirectImg = target.tagName === "IMG";
    const style = window.getComputedStyle(target);
    const isDirectBg =
      this.settings.interfaceBehavior.identifyBackgroundImages &&
      style.backgroundImage &&
      style.backgroundImage !== "none" &&
      style.backgroundImage.startsWith("url(");

    if (!isDirectImg && !isDirectBg) {
      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elementsUnder) {
        if (!(el instanceof HTMLElement)) continue;
        // 排除掉悬浮按钮自身及其宿主
        if (
          this.currentHost &&
          (this.currentHost === el || this.currentHost.contains(el))
        )
          continue;

        if (el.tagName === "IMG") {
          target = el;
          break;
        }
        const s = window.getComputedStyle(el);
        if (
          this.settings.interfaceBehavior.identifyBackgroundImages &&
          s.backgroundImage &&
          s.backgroundImage !== "none" &&
          s.backgroundImage.startsWith("url(") &&
          el.offsetWidth >= this.settings.interfaceBehavior.minImageSize &&
          el.offsetHeight >= this.settings.interfaceBehavior.minImageSize
        ) {
          target = el;
          break;
        }
      }
    }

    // 重新获取 target 的状态（可能是寻找到的底层元素）
    const finalTarget = target;
    const isImg = finalTarget.tagName === "IMG";
    const finalStyle = window.getComputedStyle(finalTarget);
    const isBg =
      this.settings.interfaceBehavior.identifyBackgroundImages &&
      finalStyle.backgroundImage &&
      finalStyle.backgroundImage !== "none" &&
      finalStyle.backgroundImage.startsWith("url(") &&
      finalTarget.offsetWidth >= this.settings.interfaceBehavior.minImageSize &&
      finalTarget.offsetHeight >= this.settings.interfaceBehavior.minImageSize;

    if (!isImg && !isBg) return;

    // 过滤输入框
    if (
      finalTarget.tagName === "INPUT" ||
      finalTarget.tagName === "TEXTAREA" ||
      finalTarget.isContentEditable
    )
      return;

    // 🚀 识别位移与宽限期逻辑
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const dist = Math.sqrt(
      Math.pow(mouseX - this.lastMouseX, 2) +
        Math.pow(mouseY - this.lastMouseY, 2),
    );
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;

    // 🚀 核心逻辑：如果在 50ms 宽限期内且位移很小，视为“同一个目标的 DOM 替换”
    if (this.graceTimer && dist < 20) {
      window.clearTimeout(this.graceTimer);
      this.graceTimer = null;

      this.pendingTarget = finalTarget;
      this.isHoveringTarget = true; // 恢复悬停状态，避免误隐藏

      if (this.hideTimer) {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }

      // 如果浮动按钮已经显示（即 300ms 计时器已完成），无缝移交追踪对象
      if (!this.timer && this.currentHost) {
        this.currentTarget = finalTarget;
        this.lastTarget = finalTarget;
        this.setupObserver(finalTarget);
        this.updateFloatingRect(finalTarget.getBoundingClientRect());
      }
      return;
    }

    // 否则：这是一次真正的鼠标移动或新目标触发，清理旧状态并重新开始计时
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
      // 避免 timer 在 50ms 宽限期内误触（例如鼠标刚移出，DOM 尚未替换时）
      if (this.graceTimer) {
        this.timer = window.setTimeout(triggerLogic, 50);
        return;
      }

      const activeTarget = this.pendingTarget;
      if (!activeTarget) {
        this.timer = null;
        return;
      }

      const rect = activeTarget.getBoundingClientRect();
      const minSize = this.settings.interfaceBehavior.minImageSize || 0;

      if (rect.width < minSize || rect.height < minSize) {
        this.timer = null;
        return;
      }

      const url = UrlResolver.resolveBestUrl(activeTarget);
      if (!url || url.startsWith("data:")) {
        this.timer = null;
        return;
      }

      if (this.currentHost && this.currentHost.dataset.targetUrl === url) {
        if (this.hideTimer) {
          window.clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
        this.currentTarget = activeTarget;
        this.lastTarget = activeTarget;
        this.lastUrl = url;
        this.isHoveringTarget = true;
        this.setupObserver(activeTarget);
        this.updateFloatingRect(rect);
        this.timer = null;
        return;
      }

      this.currentTarget = activeTarget;
      this.lastTarget = activeTarget;
      this.lastUrl = url;
      this.isHoveringTarget = true;
      this.showFloating(activeTarget, url, rect);
      this.timer = null;
    };

    this.timer = window.setTimeout(triggerLogic, 300);
  }

  private handleMouseOut(e: MouseEvent) {
    // 🚀 计时器宽限期处理：避免 DOM 替换导致计时归零以及防误触发关闭
    if (this.graceTimer) window.clearTimeout(this.graceTimer);
    this.graceTimer = window.setTimeout(() => {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
      this.graceTimer = null;
      this.pendingTarget = null;
    }, 50); // 50ms 宽限，足以应对大多数框架的 DOM 变更

    // 如果移到了按钮容器内，或者移回了原图片，不要隐藏
    if (
      this.currentHost &&
      e.relatedTarget &&
      (this.currentHost.contains(e.relatedTarget as Node) ||
        this.currentTarget === e.relatedTarget)
    ) {
      if (this.hideTimer) {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      return;
    }

    // 标记鼠标已离开目标
    this.isHoveringTarget = false;

    // 🚀 下载进行中：不隐藏按钮，等下载完成后再决定
    if (this.status !== "idle") {
      if (this.hideTimer) {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      return;
    }

    if (this.hideTimer) window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.hideFloatingImmediate();
    }, 500); // 增加缓冲时间到 500ms
  }

  private updateFloatingRect(rect: DOMRect) {
    if (!this.currentHost) return;
    Object.assign(this.currentHost.style, {
      left: `${Math.round(rect.left + window.scrollX)}px`,
      top: `${Math.round(rect.top + window.scrollY)}px`,
      width: `${Math.round(rect.width)}px`,
      height: `${Math.round(rect.height)}px`,
    });
  }

  private showFloating(_target: HTMLElement, url: string, rect: DOMRect) {
    // 🚀 下载进行中时不销毁当前按钮，直接忽略新目标的激活
    if (this.status !== "idle") {
      return;
    }

    this.hideFloatingImmediate();

    const host = document.createElement("div");
    host.className = "imaget-floating-host";
    host.dataset.targetUrl = url;

    // 绝对定位覆盖在图片上
    Object.assign(host.style, {
      all: "initial", // 彻底隔离外界干扰
      position: "absolute",
      pointerEvents: "none",
      zIndex: "2147483646",
    });

    document.body.appendChild(host);
    this.currentHost = host;

    // 初始化位置与大小
    this.updateFloatingRect(rect);

    const shadow = host.attachShadow({ mode: "open" });

    // 注入样式
    const styleTag = document.createElement("style");
    styleTag.textContent = finalCSS;
    shadow.appendChild(styleTag);

    const rootElement = document.createElement("div");
    rootElement.className = SELECTOR.replace(".", "");
    rootElement.style.width = "100%";
    rootElement.style.height = "100%";
    shadow.appendChild(rootElement);
    this.currentUrl = url;
    this.status = "idle";
    this.progress = 0;

    this.currentRootElement = rootElement;
    this.currentRoot = ReactDOM.createRoot(rootElement);
    this.render();

    // 🚀 绑定 MutationObserver 监听 URL 动态变更
    this.setupObserver(_target);
  }

  private setupObserver(target: HTMLElement) {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      const newUrl = UrlResolver.resolveBestUrl(target);
      if (newUrl && newUrl !== this.currentUrl) {
        this.currentUrl = newUrl;
        if (this.currentHost) this.currentHost.dataset.targetUrl = newUrl;
        this.render();
      }
    });

    this.observer.observe(target, {
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
  }

  /**
   * 🚀 渲染方法：支持状态更新时的重绘
   */
  private render() {
    if (!this.currentRoot || !this.currentRootElement) return;

    this.currentRoot.render(
      <React.StrictMode>
        <MantineProvider
          forceColorScheme="dark"
          cssVariablesSelector={SELECTOR}
          getRootElement={() => this.currentRootElement!}
        >
          <FloatingButton
            visible={true}
            status={this.status}
            progress={this.progress}
            onDownload={() => this.triggerDownload(this.currentUrl)}
            onDisable={() => {
              this.isMuted = true;
              const currentDomain = window.location.hostname;
              const domains = this.settings.interfaceBehavior.disabledDomains || [];
              if (!domains.includes(currentDomain)) {
                const newSettings = {
                  ...this.settings,
                  interfaceBehavior: {
                    ...this.settings.interfaceBehavior,
                    disabledDomains: [...domains, currentDomain],
                  },
                };
                this.settings = newSettings;
                if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ imaget_settings: newSettings });
                } else {
                  localStorage.setItem("imaget_settings", JSON.stringify(newSettings));
                }
              }
              this.hideFloatingImmediate();
            }}
            onClose={() => {
              this.isMuted = true;
              this.hideFloatingImmediate();
            }}
          />
        </MantineProvider>
      </React.StrictMode>,
    );
  }

  private hideFloatingImmediate() {
    if (this.progressInterval) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.currentHost) {
      if (this.currentRoot) {
        this.currentRoot.unmount();
        this.currentRoot = null;
      }
      if (this.currentHost.parentNode) {
        this.currentHost.parentNode.removeChild(this.currentHost);
      }
      this.currentHost = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.graceTimer) {
      window.clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    this.currentTarget = null;
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /**
   * 供外部（如右键菜单）调用：尝试用悬浮动画接管下载过程
   * @returns boolean 是否成功触发动画（如果未找到元素则返回 false，让外部回退到静默下载）
   */
  public async tryTriggerCustomDownload(
    url: string,
    item: ImageItem,
    customSettings: Settings,
  ): Promise<boolean> {
    let targetEl =
      this.currentHost && this.currentUrl === url ? this.currentTarget : null;

    // 如果悬浮按钮已隐藏，但目标图片仍在视口 DOM 中，强行唤醒！
    if (!targetEl && this.lastUrl === url && this.lastTarget?.isConnected) {
      targetEl = this.lastTarget;
      const rect = targetEl.getBoundingClientRect();
      this.showFloating(targetEl, url, rect);
    }

    if (!targetEl) return false;

    // 确保状态复位
    if (this.status !== "idle") {
      this.hideFloatingImmediate();
      this.showFloating(targetEl, url, targetEl.getBoundingClientRect());
    }

    this.status = "downloading";
    this.progress = 0;
    this.render();

    this.progressInterval = window.setInterval(() => {
      if (this.currentUrl !== url) {
        if (this.progressInterval) window.clearInterval(this.progressInterval);
        this.progressInterval = null;
        return;
      }
      if (this.progress < 30) this.progress += Math.random() * 10;
      else if (this.progress < 95) this.progress += Math.random() * 2;
      if (this.progress > 95) this.progress = 95;
      this.render();
    }, 150);

    try {
      if (import.meta.env.DEV && this.settings.debug?.simulateDownloadFailure) {
        throw new Error("Simulated download failure");
      }
      await this.processor.downloadBatch([item], customSettings);

      if (this.currentUrl !== url) return true;

      if (this.progressInterval) window.clearInterval(this.progressInterval);
      this.progressInterval = null;
      this.status = "success";
      this.progress = 100;
      this.render();

      window.setTimeout(() => {
        if (this.currentHost && this.currentUrl === url) {
          this.status = "idle";
          this.progress = 0;
          this.render();
        }
      }, 2000);
    } catch (err) {
      console.error("Floating custom download failed:", err);
      if (this.currentUrl !== url) return true;

      this.status = "error";
      this.render();
      if (this.progressInterval) window.clearInterval(this.progressInterval);

      window.setTimeout(() => {
        if (this.currentHost && this.currentUrl === url) {
          this.status = "idle";
          this.render();
        }
      }, 2000);
    }

    return true;
  }

  private async triggerDownload(url: string) {
    if (this.status !== "idle") return;

    // 1. 设置开始下载状态
    this.status = "downloading";
    this.progress = 0;
    this.render();

    // 2. 启动进度模拟 (Liquid Fill 模拟)
    // 快速填满前 30%，然后缓慢增长至 95%
    this.progressInterval = window.setInterval(() => {
      // 如果当前 hover 的不是触发下载时的图片，停止进度更新
      if (this.currentUrl !== url) {
        if (this.progressInterval) window.clearInterval(this.progressInterval);
        this.progressInterval = null;
        return;
      }

      if (this.progress < 30) {
        this.progress += Math.random() * 10;
      } else if (this.progress < 95) {
        this.progress += Math.random() * 2;
      }
      if (this.progress > 95) this.progress = 95;
      this.render();
    }, 150);

    // 构造一个临时的 ImageItem
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

    // 重新加载配置保证最新
    await this.loadSettings();

    // 触发下载
    try {
      if (import.meta.env.DEV && this.settings.debug?.simulateDownloadFailure) {
        throw new Error("Simulated download failure");
      }
      await this.processor.downloadBatch([item], this.settings);

      // 如果在此期间鼠标已经移到了其他图片，不要更新状态
      if (this.currentUrl !== url) return;

      // 3. 下载成功：冲刺到 100% 并切换图标
      if (this.progressInterval) window.clearInterval(this.progressInterval);
      this.progressInterval = null;
      this.status = "success";
      this.progress = 100;
      this.render();

      // 2秒后重置，如鼠标已离开则隐藏
      window.setTimeout(() => {
        if (this.currentHost && this.currentUrl === url) {
          this.status = "idle";
          this.progress = 0;
          if (!this.isHoveringTarget) {
            this.hideFloatingImmediate();
          } else {
            this.render();
          }
        }
      }, 2000);
    } catch (err) {
      console.error("Floating download failed:", err);

      // 如果已经移动到其他图片，不再显示错误并干扰它
      if (this.currentUrl !== url) return;

      this.status = "error";
      this.render();
      if (this.progressInterval) window.clearInterval(this.progressInterval);

      window.setTimeout(() => {
        if (this.currentHost && this.currentUrl === url) {
          this.status = "idle";
          if (!this.isHoveringTarget) {
            this.hideFloatingImmediate();
          } else {
            this.render();
          }
        }
      }, 2000);
    }
  }
}
