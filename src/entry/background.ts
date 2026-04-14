/**
 * Core: Align with legacy project, use storage to record pending downloads.
 * Prevents loss of state on Service Worker restart and solves race conditions with ID callbacks.
 */
import { t } from "../core/utils/i18n";
import type { Settings } from "../types";

interface PendingDownloadConfig {
  filename: string;
  conflictAction: string;
}

const PENDING_PREFIX = "pending_dl_";

async function savePending(
  idOrUrl: string | number,
  config: PendingDownloadConfig,
) {
  const key = PENDING_PREFIX + idOrUrl;
  const storageArea = chrome.storage.session || chrome.storage.local;
  await storageArea.set({ [key]: config });
}

async function getPending(
  idOrUrl: string | number,
): Promise<PendingDownloadConfig | undefined> {
  const key = PENDING_PREFIX + idOrUrl;
  const storageArea = chrome.storage.session || chrome.storage.local;
  const result = await storageArea.get(key);
  return result[key] as PendingDownloadConfig | undefined;
}

async function removePending(idOrUrl: string | number) {
  const storageArea = chrome.storage.session || chrome.storage.local;
  await storageArea.remove(PENDING_PREFIX + idOrUrl);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "DOWNLOAD") {
    const { url, filename, conflictAction } = message.payload;
    const config = { filename, conflictAction: conflictAction || "uniquify" };

    const handleDownload = async () => {
      try {
        // 1. 预注册 (使用 URL 匹配，防止 downloadId 还没返回就被触发监听)
        await savePending(url, config);

        const downloadId = await new Promise<number>((resolve, reject) => {
          chrome.downloads.download(
            {
              url,
              filename, // 双重保障，虽然会被 onDeterminingFilename 覆盖
              conflictAction:
                (conflictAction as chrome.downloads.FilenameConflictAction) ||
                "uniquify",
              saveAs: false,
            },
            (id) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(id);
            },
          );
        });

        // 2. 注册 ID (用于更精确的匹配)
        await savePending(downloadId, config);
        sendResponse({ success: true, downloadId });
      } catch (err) {
        console.error("[Background] Download trigger error:", err);
        await removePending(url);
        sendResponse({ success: false, error: String(err) });
      }
    };

    handleDownload();
    return true;
  }

  // 调试日志透传
  if (message.type === "DEBUG_LOG") {
    console.log(`[Background Debug] ${message.payload.message}`);
    return false;
  }

  // 2. 完全对齐旧项目消息名称: FETCH_BLOB
  if (message.type === "FETCH_BLOB") {
    const { url, referer } = message.payload || message;
    const headers: Record<string, string> = {};
    if (referer) headers.Referer = referer;

    fetch(url, { method: "GET", headers })
      .then((r) => (r.ok ? r.blob() : Promise.reject(`HTTP ${r.status}`)))
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          sendResponse({ success: true, dataUrl: reader.result });
        reader.readAsDataURL(blob);
      })
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
});

/**
 * 核心监听器：强制覆盖文件名和路径
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  (async () => {
    // 依次尝试 ID、URL、finalUrl 匹配 (对齐旧项目)
    let pending = await getPending(item.id);
    if (!pending && item.url) pending = await getPending(item.url);
    if (!pending && item.finalUrl) pending = await getPending(item.finalUrl);

    if (pending) {
      console.log(
        `[Background] Enforcing path for ${item.id}: ${pending.filename}`,
      );
      suggest({
        filename: pending.filename,
        conflictAction:
          pending.conflictAction as chrome.downloads.FilenameConflictAction,
      });
      // 清理已完成的任务
      await removePending(item.id);
      if (item.url) await removePending(item.url);
    } else {
      // 没有任何匹配配置，使用默认
      suggest({ filename: item.filename });
    }
  })();
  return true; // 必须返回 true 以声明异步处理 suggest
});

// 监听扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-sniffer" });
  }
});

/**
 * 右键菜单实现 (对齐旧项目)
 */
function setupContextMenus() {
  if (typeof chrome === "undefined" || !chrome.contextMenus) {
    console.warn("[Background] contextMenus API not available.");
    return;
  }
  console.log("[Background] Setting up context menus...");

  // 先移除所有，防止重复
  chrome.contextMenus.removeAll(() => {
    // 根菜单
    chrome.contextMenus.create(
      {
        id: "imaget-root",
        title: "Imaget",
        contexts: ["image", "page"],
      },
      () => {
        if (chrome.runtime.lastError) return;

        const subMenus = [
          {
            id: "save-as-webp",
            title: t("menuSaveAsWebP"),
            contexts: ["image"],
          },
          {
            id: "save-as-png",
            title: t("menuSaveAsPNG"),
            contexts: ["image"],
          },
          {
            id: "save-as-jpg",
            title: t("menuSaveAsJPG"),
            contexts: ["image"],
          },
          {
            id: "batch-download",
            title: t("menuOpenDashboard"),
            contexts: ["page", "image"],
          },
        ];

        subMenus.forEach((menu) => {
          chrome.contextMenus.create({
            parentId: "imaget-root",
            id: menu.id,
            title: menu.title,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            contexts: menu.contexts as any,
          });
        });
      },
    );
  });
}

// 监听菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  const itemId = String(info.menuItemId);
  if (itemId.startsWith("save-as-")) {
    const targetFormat = itemId.replace("save-as-", "");
    chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_SAVE_SINGLE",
      payload: {
        srcUrl: info.srcUrl,
        targetFormat,
      },
    });
  } else if (itemId === "batch-download") {
    // 打开面板并启动嗅探
    chrome.tabs.sendMessage(tab.id, { action: "toggle-sniffer" });
  }
});

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
  // 初始化侧边栏行为
  if (chrome.storage && chrome.sidePanel?.setPanelBehavior) {
    chrome.storage.local.get(["imaget_settings"], (res) => {
      const settings = res.imaget_settings as Settings;
      const showInSidebar = settings?.interfaceBehavior?.showInSidebar || false;
      chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: showInSidebar })
        .catch((err) => console.error(err));
    });
  }
});

// Service Worker 启动时也确保挂载
setupContextMenus();
// 确保每次 Service Worker 唤醒时也同步配置 (非必需但更健壮)
if (chrome.storage && chrome.sidePanel?.setPanelBehavior) {
  chrome.storage.local.get(["imaget_settings"], (res) => {
    const settings = res.imaget_settings as Settings;
    const showInSidebar = settings?.interfaceBehavior?.showInSidebar || false;
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: showInSidebar })
      .catch((err) => console.error(err));
  });
}

// 监听设置更改以动态更新图标点击行为
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes["imaget_settings"]) {
    const newSettings = changes["imaget_settings"].newValue as Settings;
    if (newSettings?.interfaceBehavior?.showInSidebar !== undefined) {
      if (chrome.sidePanel?.setPanelBehavior) {
        chrome.sidePanel
          .setPanelBehavior({
            openPanelOnActionClick: newSettings.interfaceBehavior.showInSidebar,
          })
          .catch((err) => console.error(err));
      }
    }
  }
});

console.log("Imaget Reborn Background Aligned with Legacy Logic");
