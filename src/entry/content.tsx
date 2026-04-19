import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import mantineStyles from "@mantine/core/styles.css?inline";
import App from "../ui/App";
import { FloatingController } from "../core/floating-controller";
import type { ImageFormat } from "../types";
import { Sniffer } from "../core/sniffer";
import { ImageProcessor } from "../core/processor";
import { ExtensionAdapter } from "../core/adapters/extension";
import { WebAdapter } from "../core/adapters/web";
import { UrlResolver } from "../core/utils/url-resolver";
import { theme, FONT_STACK } from "../ui/theme";

const ROOT_ID = "imaget-reborn-root";
const SELECTOR = ".imaget-extension-container";
const finalCSS = mantineStyles.replaceAll(":root", SELECTOR);

function init() {
  let rootContainer = document.getElementById(ROOT_ID);

  if (rootContainer) {
    // 如果已经存在，直接切回显示状态
    if (rootContainer.style.display === "none") {
      rootContainer.style.display = "block";
      floatingController.setMuted(true); // 核心修复：仪表盘显示时，静默悬浮按钮
    } else {
      rootContainer.style.display = "none"; // 再次点击图标可以切换关闭 (对齐常见插件行为)
      floatingController.setMuted(false); // 核心修复：仪表盘关闭时，恢复悬浮按钮
    }
    return;
  }

  rootContainer = document.createElement("div");
  rootContainer.id = ROOT_ID;
  floatingController.setMuted(true); // 核心修复：初次初始化即静默功能

  // 1. 创建最外层宿主 (Shadow Host)
  const shadow = rootContainer.attachShadow({ mode: "open" });

  // 2. 注入全局样式
  const styleTag = document.createElement("style");
  styleTag.textContent = finalCSS;
  shadow.appendChild(styleTag);

  // 🚀 3. 创建总容器（承载 CSS 变量作用域）
  const extensionRoot = document.createElement("div");
  extensionRoot.className = SELECTOR.replace(".", "");
  extensionRoot.style.all = "initial";
  extensionRoot.style.display = "block";
  extensionRoot.style.width = "100%";
  extensionRoot.style.height = "100%";
  extensionRoot.style.fontFamily = FONT_STACK;
  extensionRoot.style.pointerEvents = "auto";
  // 重要：修复 all: initial 导致的颜色继承丢失
  extensionRoot.style.color = "var(--mantine-color-text)";
  // 背景必须透明，否则 Overlay 的半透明效果会被此层的不透明色挡住，
  // 用户将无法透过遮罩层看到原网页。各面板自带 bg="dark.7" 提供深色背景。
  extensionRoot.style.backgroundColor = "transparent";

  // 4. 创建 App 挂载点
  const appMountPoint = document.createElement("div");
  appMountPoint.style.width = "100%";
  appMountPoint.style.height = "100%";

  extensionRoot.appendChild(appMountPoint);
  shadow.appendChild(extensionRoot);

  // 容器样式：占满全屏以支持 Backdrop
  Object.assign(rootContainer.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483647",
    pointerEvents: "none",
    display: "block",
  });

  // 监听来自 React 的关闭信号
  window.addEventListener("message", (event) => {
    if (event.data.type === "IMAGET_CLOSE") {
      if (rootContainer) rootContainer.style.display = "none";
      floatingController.setMuted(false); // 核心修复：仪表盘关闭后恢复悬浮按钮功能
    }
  });

  document.body.appendChild(rootContainer);

  ReactDOM.createRoot(appMountPoint).render(
    <React.StrictMode>
      <MantineProvider
        theme={theme}
        forceColorScheme="dark"
        cssVariablesSelector={SELECTOR}
        getRootElement={() => extensionRoot}
      >
        <App />
      </MantineProvider>
    </React.StrictMode>,
  );
}

// 监听消息触发
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "toggle-sniffer") {
    init();
    sendResponse({ success: true });
    return false;
  }

  if (message.action === "SNIFF_REQUEST") {
    sniffer
      .sniffAll(message.payload?.settings)
      .then((results) => {
        sendResponse({ results });
      })
      .catch((err) => {
        console.error("[Content] Sniff error:", err);
        sendResponse({ results: [] });
      });
    return true; // Keep channel open for async response
  }

  if (message.action === "AUTOSCROLL_REQUEST") {
    sniffer
      .autoScroll()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error("[Content] Autoscroll error:", err);
        sendResponse({ success: false });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === "CONTEXT_SAVE_SINGLE") {
    const { srcUrl, targetFormat } = message.payload;
    if (!srcUrl) {
      sendResponse({ success: false });
      return false;
    }

    (async () => {
      try {
        console.log("[Content] Context save requested for:", srcUrl);
        // 1. 扫描页面
        const items = await sniffer.sniffAll();

        // 2. 匹配图片 (使用 transformSiteSpecificUrl 辅助匹配)
        const normalizedSrcUrl = UrlResolver.transformSiteSpecificUrl(srcUrl);

        const target = items.find((item) => {
          const normalizedItemUrl = UrlResolver.transformSiteSpecificUrl(
            item.url,
          );
          return (
            normalizedItemUrl === normalizedSrcUrl ||
            item.url === srcUrl ||
            item.url.includes(srcUrl) ||
            srcUrl.includes(item.url)
          );
        });

        if (target) {
          console.log("[Content] Found matching image:", target);
          // 3. 执行单张下载
          // 获取当前配置
          const settings = await adapter.getSettings();
          // 覆盖格式策略 (对齐 Settings 类型结构)
          const tempSettings = {
            ...settings,
            downloadLogic: {
              ...settings.downloadLogic,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              targetFormat: targetFormat.toLowerCase() as any,
            },
          };

          const started = await floatingController.tryTriggerCustomDownload(
            target.url,
          );
          if (!started) {
            // 如果无法运用悬浮动画（比如页面没滚动到对应图片或者没hover过），回退到静默下载
            console.log(
              "[Content] Floating animation inapplicable, fallback to silent download",
            );
            await processor.downloadBatch([target], tempSettings);
          }
        } else {
          console.warn("[Content] No matching image found for URL:", srcUrl);

          // 兜底：构造一个虚拟 Item 下载
          const fallbackItem = {
            id: "fallback-" + Date.now(),
            url: srcUrl,
            width: 0,
            height: 0,
            format: (targetFormat.toUpperCase() || "UNKNOWN") as ImageFormat,
            sizeKB: 0,
            isSelected: true,
            pageTitle: document.title,
            pageUrl: window.location.href,
          };
          await processor.downloadBatch(
            [fallbackItem],
            await adapter.getSettings(),
          );
        }
        sendResponse({ success: true });
      } catch (err) {
        console.error("[Content] Context save error:", err);
        sendResponse({ success: false, error: String(err) });
      }
    })();
    return true;
  }
  return false;
});

// 开发模式下直接启动
if (import.meta.env.DEV) {
  init();
}

// 初始化悬浮按钮控制器
const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
const adapter = isExtension ? new ExtensionAdapter() : new WebAdapter();
const sniffer = new Sniffer();
const processor = new ImageProcessor(adapter);
const floatingController = new FloatingController(sniffer, processor);
floatingController.init();
