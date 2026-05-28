import { defaultSettings, type Settings } from "../types";
import { t } from "../core/utils/i18n";

/**
 * 后台逻辑：
 * 1. 监听快捷键/点击触发 Content Script
 * 2. 集中管理 Context Menu (右键菜单)
 * 3. 处理下载分发 (Chrome API 限速/并发)
 */

// 处理图标点击
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const result = await chrome.storage.local.get("imaget_settings");
  const settings = (result.imaget_settings || defaultSettings) as Settings;

  if (settings.interfaceBehavior?.showInSidebar) {
    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
      console.warn("[Background] Failed to open side panel:", err);
    });
  } else {
    // 禁用侧边栏自动打开，改用消息触发 Content Script 弹窗
    chrome.tabs.sendMessage(tab.id, { action: "toggle-sniffer" }).catch(() => {
      // 如果 Content Script 尚未加载，可能需要先注入
      console.warn(
        "[Background] Failed to send toggle message, script might not be ready",
      );
    });
  }
});

// 动态配置侧边栏策略
const updateSidePanelBehavior = async () => {
  const result = await chrome.storage.local.get("imaget_settings");
  const settings = (result.imaget_settings || defaultSettings) as Settings;

  if (typeof chrome.sidePanel?.setPanelBehavior === "function") {
    chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick: !!settings.interfaceBehavior?.showInSidebar,
      })
      .catch(() => {});
  }
};

// 监听设置变化以更新行为
chrome.storage.onChanged.addListener((changes) => {
  if (changes.imaget_settings) {
    updateSidePanelBehavior();
  }
});

// 初始化设置
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get("imaget_settings");
  if (!result.imaget_settings) {
    await chrome.storage.local.set({ imaget_settings: defaultSettings });
  }
  setupContextMenus();
  updateSidePanelBehavior();
});

// 消息转发中心
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // 处理调试日志同步（仅开发模式下由 Content 发送）
  if (message.type === "DEBUG_LOG") {
    // 生产环境静默
    return false;
  }

  if (message.type === "FETCH_BLOB") {
    const { url, referer } = message.payload;
    fetch(url, {
      headers: referer ? { Referer: referer } : undefined,
    })
      .then(async (res) => {
        const mimeType = res.headers.get("content-type") || "";
        const blob = await res.blob();

        // 使用 FileReader 将 Blob 转换为 Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          try {
            sendResponse({ success: true, arrayBuffer: base64, mimeType });
          } catch (e) {
            console.error("sendResponse failed (payload too large?):", e);
          }
        };
        reader.onerror = () => {
          sendResponse({ success: false, error: "FileReader failed" });
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        try {
          sendResponse({ success: false, error: err.message || String(err) });
        } catch (e) {
          console.warn("[Background] sendResponse failed (FETCH_BLOB):", e);
        }
      });
    return true; // 保持异步
  }

  if (message.type === "DOWNLOAD_URL_REQUEST") {
    const { url, filename, conflictAction, referer } = message.payload;
    chrome.downloads.download(
      {
        url,
        filename,
        conflictAction: conflictAction || "uniquify",
        saveAs: false,
        headers: referer
          ? [
              {
                name: "Referer",
                value: referer,
              },
            ]
          : undefined,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true, downloadId });
        }
      },
    );
    return true;
  }

  if (message.type === "DOWNLOAD_REQUEST") {
    const { arrayBuffer, mimeType, filename, conflictAction } = message.payload;
    try {
      // 在 MV3 Service Worker 中 URL.createObjectURL 不可用，
      // 且由于 arrayBuffer 已经是 base64 字符串，我们直接使用 Data URL 方案
      const dataUrl = `data:${mimeType || "image/png"};base64,${arrayBuffer}`;

      chrome.downloads.download(
        {
          url: dataUrl,
          filename: filename,
          conflictAction: conflictAction || "uniquify",
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse({ success: true, downloadId });
          }
        },
      );
    } catch (err) {
      sendResponse({ success: false, error: String(err) });
    }
    return true; // 保持异步
  }

  // 检查下载状态
  if (message.type === "CHECK_DOWNLOAD") {
    chrome.downloads.search({ id: message.payload.id }, (results) => {
      if (results && results[0]) {
        sendResponse({ status: results[0].state });
      } else {
        sendResponse({ status: "error" });
      }
    });
    return true;
  }

  return false;
});

/**
 * 右键菜单管理
 */
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // 根菜单
    chrome.contextMenus.create({
      id: "imaget-root",
      title: t("menuRoot"),
      contexts: ["all"],
    });

    // 1. 一键下载当前图片
    chrome.contextMenus.create({
      id: "save-image-smart",
      parentId: "imaget-root",
      title: t("menuSaveImageSmart"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-webp",
      parentId: "save-image-smart",
      title: t("menuSaveAsWebP"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-jpg",
      parentId: "save-image-smart",
      title: t("menuSaveAsJPG"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-png",
      parentId: "save-image-smart",
      title: t("menuSaveAsPNG"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "sep1",
      parentId: "imaget-root",
      type: "separator",
      contexts: ["all"],
    });

    // 2. 打开控制台
    chrome.contextMenus.create({
      id: "open-dashboard",
      parentId: "imaget-root",
      title: t("menuOpenDashboard"),
      contexts: ["all"],
    });
  });
}

// 监听右键点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "open-dashboard") {
    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
      console.warn(
        "[Background] Failed to open side panel from context menu:",
        err,
      );
    });
    return;
  }

  if (String(info.menuItemId).startsWith("save-image-as-")) {
    const format = String(info.menuItemId).split("-").pop(); // webp, jpg, png
    chrome.tabs
      .sendMessage(tab.id, {
        type: "CONTEXT_SAVE_SINGLE",
        payload: {
          srcUrl: info.srcUrl,
          targetFormat: format,
        },
      })
      .catch((err) => {
        console.warn(
          "[Background] Failed to send CONTEXT_SAVE_SINGLE message:",
          err,
        );
      });
  }
});
