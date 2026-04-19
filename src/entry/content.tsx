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

// 初始化依赖项
const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
const adapter = isExtension ? new ExtensionAdapter() : new WebAdapter();
const sniffer = new Sniffer();
const processor = new ImageProcessor(adapter);
export const floatingController = new FloatingController(sniffer, processor);

floatingController.init();

function init() {
  let rootContainer = document.getElementById(ROOT_ID);

  if (rootContainer) {
    if (rootContainer.style.display === "none") {
      rootContainer.style.display = "block";
      floatingController.setMuted(true);
    } else {
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
  extensionRoot.style.fontFamily = FONT_STACK;
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
      if (rootContainer) rootContainer.style.display = "none";
      floatingController.setMuted(false);
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

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
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
      return true;
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
      return true;
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

          if (target) {
            const settings = await adapter.getSettings();
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
            await processor.downloadBatch(
              [fallbackItem],
              await adapter.getSettings(),
            );
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

if (import.meta.env.DEV) {
  init();
}
