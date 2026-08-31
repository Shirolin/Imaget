import { defaultSettings, type Settings } from "../types";
import { t, setLocale } from "../core/utils/i18n";

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
let currentMenuLocale: string | null = null;

const syncContextMenuLocale = (settings?: Settings) => {
  if (!settings) return;
  const language = settings.general?.language ?? "auto";
  if (language === currentMenuLocale) return;
  currentMenuLocale = language;
  setLocale(language);
  // 语言变化时重建菜单，使右键文案立即反映新语言
  setupContextMenus();
};

chrome.storage.onChanged.addListener((changes) => {
  if (changes.imaget_settings) {
    updateSidePanelBehavior();
    syncContextMenuLocale(
      changes.imaget_settings.newValue as Settings | undefined,
    );
  }
});

// 初始化设置
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get("imaget_settings");
  if (!result.imaget_settings) {
    await chrome.storage.local.set({ imaget_settings: defaultSettings });
    syncContextMenuLocale(defaultSettings);
  } else {
    syncContextMenuLocale(result.imaget_settings as Settings);
  }
  updateSidePanelBehavior();
  setupDeclarativeNetRequestRules();
});

// 每次浏览器/扩展启动时确保规则正确应用
chrome.runtime.onStartup.addListener(() => {
  setupDeclarativeNetRequestRules();
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

    // 规范澄清：Chrome 扩展 Service Worker 无法在普通 fetch 中真正自定义 Referer (属于 Forbidden Headers)。
    // 此处能成功绕过防盗链主要是因为 SW 处于插件特权域，其发起的 fetch 请求不会被浏览器强制标记
    // 跨域沙盒特征（如 Sec-Fetch-Site: cross-site），使得 CDN 防火墙放行。
    fetch(url, {
      headers: referer ? { Referer: referer } : undefined,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        // 增加安全防御：限制超大图或大媒体文件（50MB 阈值），防止 Base64 通信信道堆栈溢出或 SW 内存崩溃
        const contentLength = res.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 50 * 1024 * 1024) {
          throw new Error(
            "Target resource size exceeds proxy safe limits (50MB)",
          );
        }

        const mimeType = res.headers.get("content-type") || "";
        const blob = await res.blob();

        if (blob.size > 50 * 1024 * 1024) {
          throw new Error("Blob payload size exceeds proxy safe limits (50MB)");
        }

        // 使用 ArrayBuffer 将 Blob 转换为 Base64
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const chunkSize = 8192;
        let binary = "";
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            Array.from(bytes.subarray(i, i + chunkSize)),
          );
        }
        const base64 = btoa(binary);

        try {
          sendResponse({ success: true, arrayBuffer: base64, mimeType });
        } catch (e) {
          console.error("sendResponse failed (payload too large?):", e);
        }
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
    const { url, filename, conflictAction } = message.payload;
    // 注意：chrome.downloads.download 的 headers 仅允许 XHR 安全头（如
    // Content-Disposition/Content-Type），Referer 属被禁止的请求头，设置无效。
    // 受防盗链保护的域名必须走 FETCH_BLOB 代理抓取，因此这里不再传 headers。
    chrome.downloads.download(
      {
        url,
        filename,
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
 * 配置 Declarative Net Request 规则，绕过微博等防盗链
 */
async function setupDeclarativeNetRequestRules() {
  if (typeof chrome.declarativeNetRequest === "undefined") return;

  const rules: chrome.declarativeNetRequest.Rule[] = [
    {
      id: 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: "Referer",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "https://weibo.com/",
          },
          {
            header: "Origin",
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        urlFilter: "||sinaimg.cn",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ],
      },
    },
    {
      id: 2,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: "Referer",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "https://www.pixiv.net/",
          },
          {
            header: "Origin",
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        urlFilter: "||i.pximg.net",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ],
      },
    },
    {
      id: 3,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: "Origin",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "https://www.reddit.com",
          },
          {
            header: "Referer",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "https://www.reddit.com/",
          },
        ],
      },
      condition: {
        urlFilter: "||redd.it",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ],
      },
    },
  ];

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map((r) => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: rules,
    });
    console.log("[Background] DeclarativeNetRequest rules set successfully.");
  } catch (err) {
    console.error(
      "[Background] Failed to update declarativeNetRequest rules:",
      err,
    );
  }
}

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
