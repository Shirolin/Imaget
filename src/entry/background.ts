import { defaultSettings } from "../types";

/**
 * 后台逻辑：
 * 1. 监听快捷键/点击触发 Content Script
 * 2. 集中管理 Context Menu (右键菜单)
 * 3. 处理下载分发 (Chrome API 限速/并发)
 */

// 初始化设置
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get("imaget_settings");
  if (!result.imaget_settings) {
    await chrome.storage.local.set({ imaget_settings: defaultSettings });
  }
  setupContextMenus();
});

// 处理图标点击
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
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
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            sendResponse({ success: true, dataUrl: reader.result });
          } catch (e) {
            console.error("sendResponse failed (payload too large?):", e);
            // Catching it doesn't help send it to the content script if the port closed,
            // but at least it won't crash the background worker silently.
          }
        };
        reader.onerror = () => {
          try {
            sendResponse({ success: false, error: "Failed to read blob" });
          } catch {
            /* ignore */
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        try {
          sendResponse({ success: false, error: err.message || String(err) });
        } catch {
          /* ignore */
        }
      });
    return true; // 保持异步
  }

  if (message.type === "DOWNLOAD_REQUEST") {
    const { url, filename, conflictAction } = message.payload;
    chrome.downloads.download(
      {
        url: url,
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
      title: chrome.i18n.getMessage("menuRoot"),
      contexts: ["all"],
    });

    // 1. 一键下载当前图片
    chrome.contextMenus.create({
      id: "save-image-smart",
      parentId: "imaget-root",
      title: chrome.i18n.getMessage("menuSaveImageSmart"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-webp",
      parentId: "save-image-smart",
      title: chrome.i18n.getMessage("menuSaveAsWebP"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-jpg",
      parentId: "save-image-smart",
      title: chrome.i18n.getMessage("menuSaveAsJPG"),
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "save-image-as-png",
      parentId: "save-image-smart",
      title: chrome.i18n.getMessage("menuSaveAsPNG"),
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
      title: chrome.i18n.getMessage("menuOpenDashboard"),
      contexts: ["all"],
    });
  });
}

// 监听右键点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "open-dashboard") {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
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
      .catch(() => {});
  }
});
