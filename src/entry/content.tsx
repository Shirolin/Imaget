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
import { applyTargetFormat } from "../core/utils/settings-policy";
import { FollowScanController } from "../core/follow-scan";
import { theme, getFontStackByLocale } from "../ui/theme";
import { getLocale } from "../core/utils/i18n";
import { ErrorBoundary } from "../ui/components/ErrorBoundary";
import {
  FOLLOW_SCAN_CANDIDATES,
  FOLLOW_SCAN_PAUSE,
  FOLLOW_SCAN_RESUME,
  FOLLOW_SCAN_SCAN_NOW,
  FOLLOW_SCAN_START,
  FOLLOW_SCAN_STOP,
  IMAGET_REOPEN,
} from "../core/utils/sniffer-events";

const ROOT_ID = "imaget-reborn-root";
const SELECTOR = ".imaget-extension-container";
// 使用正则替换仅选择器位置的 :root，避免替换属性值（如 content: ":root"）中的内容
const finalCSS = mantineStyles.replace(/(?:^|,)\s*:root(?=\s*{)/g, (match) =>
  match.replace(":root", SELECTOR),
);

// 初始化依赖项
const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
const adapter = isExtension ? new ExtensionAdapter() : new WebAdapter();
const sniffer = new Sniffer();
const processor = new ImageProcessor(adapter);
export const floatingController = new FloatingController(sniffer, processor);
const autoScrollControllers = new Map<string, AbortController>();
const followScanController = new FollowScanController({
  onCandidates: (sessionId, items) => {
    const message = {
      type: FOLLOW_SCAN_CANDIDATES,
      payload: { sessionId, items },
    };
    window.postMessage(message, "*");
    if (typeof chrome !== "undefined") {
      chrome.runtime?.sendMessage(message).catch(() => {
        // 忽略临时通道错误
      });
    }
  },
});

floatingController.init();

function init() {
  let rootContainer = document.getElementById(ROOT_ID);

  if (rootContainer) {
    if (rootContainer.style.display === "none") {
      rootContainer.style.display = "block";
      floatingController.setMuted(true);
      window.postMessage({ type: IMAGET_REOPEN }, "*");
    } else {
      followScanController.stop();
      rootContainer.style.display = "none";
      floatingController.setMuted(false);
    }
    return;
  }

  rootContainer = document.createElement("div");
  rootContainer.id = ROOT_ID;
  floatingController.setMuted(true);

  const shadow = rootContainer.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  styleTag.textContent = finalCSS;
  shadow.appendChild(styleTag);

  const extensionRoot = document.createElement("div");
  extensionRoot.className = SELECTOR.replace(".", "");
  extensionRoot.style.all = "initial";
  extensionRoot.style.display = "block";
  extensionRoot.style.width = "100%";
  extensionRoot.style.height = "100%";

  // 动态自适应多语言字体栈配置
  const currentLocale = getLocale();
  const dynamicFont = getFontStackByLocale(currentLocale);
  extensionRoot.style.setProperty("--imaget-font-family", dynamicFont);
  extensionRoot.style.fontFamily = "var(--imaget-font-family)";

  extensionRoot.style.pointerEvents = "auto";
  extensionRoot.style.color = "var(--mantine-color-text)";
  extensionRoot.style.backgroundColor = "transparent";

  const appMountPoint = document.createElement("div");
  appMountPoint.style.width = "100%";
  appMountPoint.style.height = "100%";

  extensionRoot.appendChild(appMountPoint);
  shadow.appendChild(extensionRoot);

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

  window.addEventListener("message", (event) => {
    if (event.data.type === "IMAGET_CLOSE") {
      followScanController.stop();
      if (rootContainer) rootContainer.style.display = "none";
      floatingController.setMuted(false);
    }
  });

  document.body.appendChild(rootContainer);

  ReactDOM.createRoot(appMountPoint).render(
    <React.StrictMode>
      <ErrorBoundary>
        <MantineProvider
          theme={theme}
          forceColorScheme="dark"
          cssVariablesSelector={SELECTOR}
          getRootElement={() => extensionRoot}
        >
          <App />
        </MantineProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "toggle-sniffer") {
      init();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === "SNIFF_REQUEST") {
      const requestId = message.payload?.requestId as string | undefined;
      sniffer
        .sniffAll(message.payload?.settings, undefined, {
          requestId,
          onCandidates: (items) => {
            if (!requestId || typeof chrome === "undefined") return;
            chrome.runtime
              ?.sendMessage({
                type: "SNIFF_PROGRESS",
                payload: { requestId, items },
              })
              .catch(() => {
                // 忽略临时通道错误
              });
          },
        })
        .then((results) => {
          sendResponse({ results });
        })
        .catch((err) => {
          console.error("[Content] Sniff error:", err);
          sendResponse({ results: [] });
        });
      return true;
    }

    if (message.action === FOLLOW_SCAN_START) {
      const sessionId = message.payload?.sessionId as string | undefined;
      if (sessionId) {
        followScanController.start({
          sessionId,
          settings: message.payload?.settings,
        });
      }
      sendResponse({ success: true });
      return false;
    }

    if (message.action === FOLLOW_SCAN_STOP) {
      followScanController.stop();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === FOLLOW_SCAN_PAUSE) {
      followScanController.pause();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === FOLLOW_SCAN_RESUME) {
      followScanController.resume();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === "AUTOSCROLL_REQUEST") {
      const requestId = message.payload?.requestId as string | undefined;
      const controller = new AbortController();
      if (requestId) {
        autoScrollControllers.set(requestId, controller);
      }
      sniffer
        .autoScroll(
          message.payload?.settings,
          (progress) => {
            if (!requestId || typeof chrome === "undefined") return;
            chrome.runtime
              ?.sendMessage({
                type: "AUTOSCROLL_PROGRESS",
                payload: { requestId, progress },
              })
              .catch(() => {
                // 忽略临时通道错误
              });
          },
          undefined,
          undefined,
          controller.signal,
          {
            onSettledStep: () => followScanController.scanNow(),
            onBeforeRestore: () => followScanController.scanNow(),
          },
        )
        .then((result) => {
          sendResponse({ success: true, result });
        })
        .catch((err) => {
          console.error("[Content] Autoscroll error:", err);
          sendResponse({ success: false });
        })
        .finally(() => {
          if (requestId) {
            autoScrollControllers.delete(requestId);
          }
        });
      return true;
    }

    if (message.action === "AUTOSCROLL_CANCEL_REQUEST") {
      const requestId = message.payload?.requestId as string | undefined;
      if (requestId) {
        autoScrollControllers.get(requestId)?.abort();
      }
      sendResponse({ success: true });
      return false;
    }

    if (message.type === "CONTEXT_SAVE_SINGLE") {
      const { srcUrl, targetFormat } = message.payload;
      if (!srcUrl) {
        sendResponse({ success: false });
        return false;
      }

      (async () => {
        try {
          const items = await sniffer.sniffAll();
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

          const settings = await adapter.getSettings();
          const tempSettings = applyTargetFormat(settings, targetFormat);

          if (target) {
            const started = await floatingController.tryTriggerCustomDownload(
              target.url,
              tempSettings,
            );
            if (!started) {
              await processor.downloadBatch([target], tempSettings);
            }
          } else {
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
            await processor.downloadBatch([fallbackItem], tempSettings);
          }
          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
      })();
      return true;
    }
    return false;
  });
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object" || !("type" in message)) return;

  if (message.type === FOLLOW_SCAN_START) {
    const sessionId = message.payload?.sessionId as string | undefined;
    if (sessionId) {
      followScanController.start({
        sessionId,
        settings: message.payload?.settings,
      });
    }
  } else if (message.type === FOLLOW_SCAN_STOP) {
    followScanController.stop();
  } else if (message.type === FOLLOW_SCAN_PAUSE) {
    followScanController.pause();
  } else if (message.type === FOLLOW_SCAN_RESUME) {
    followScanController.resume();
  } else if (message.type === FOLLOW_SCAN_SCAN_NOW) {
    followScanController.scanNow();
  }
});

if (import.meta.env.DEV) {
  init();
}
