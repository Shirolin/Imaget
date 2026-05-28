import type { IPlatformAdapter } from "./interface";
import { type Settings, defaultSettings } from "../../types";

export class ExtensionAdapter implements IPlatformAdapter {
  env = "extension" as const;

  private isValidContext(): boolean {
    return !!(typeof chrome !== "undefined" && chrome.runtime?.id);
  }

  async fetchBlob(url: string, referer?: string): Promise<Blob> {
    if (!this.isValidContext())
      throw new Error("Extension context invalidated");

    // 本地资源直接抓取
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const resp = await fetch(url);
      return await resp.blob();
    }

    // 远程资源通过后台代理（使用 ArrayBuffer 传输，避免 DataURL base64 编解码）
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          {
            type: "FETCH_BLOB",
            payload: { url, referer },
          },
          async (response) => {
            if (chrome.runtime.lastError)
              return reject(chrome.runtime.lastError);
            if (response?.success && response.arrayBuffer) {
              // 使用原生的 fetch(dataUrl) 代替手动 atob 和 Uint8Array 遍历，性能大幅提升
              const mimeType = response.mimeType || "application/octet-stream";
              const dataUrl = `data:${mimeType};base64,${response.arrayBuffer}`;
              try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                resolve(blob);
              } catch (e) {
                reject(
                  new Error(
                    "Failed to decode blob from background: " + String(e),
                  ),
                );
              }
            } else {
              reject(
                new Error(response?.error || "Fetch failed in background"),
              );
            }
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  storage = {
    async get<T>(key: string, defaultVal?: T): Promise<T> {
      if (typeof chrome === "undefined" || !chrome.storage)
        return defaultVal as T;
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => {
          resolve((res[key] as T) ?? defaultVal!);
        });
      });
    },
    async set(key: string, value: unknown): Promise<void> {
      if (typeof chrome === "undefined" || !chrome.storage) return;
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    },
  };

  async download(
    blob: Blob,
    filename: string,
    conflictAction?: "uniquify" | "overwrite" | "prompt",
  ): Promise<void> {
    if (!this.isValidContext()) return;

    // 将 blob 转为 base64 传输（sendMessage 不支持直接传 Blob/ArrayBuffer）
    // 使用原生的 FileReader 代替手动循环，性能更佳且不会溢出堆栈
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 提取 base64 部分 (data:image/xxx;base64,xxxx)
        const base64Content = result.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          {
            type: "DOWNLOAD_REQUEST",
            payload: {
              arrayBuffer: base64,
              mimeType: blob.type,
              filename,
              conflictAction: conflictAction || "uniquify",
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response && !response.success) {
              reject(new Error(response.error));
            } else {
              resolve();
            }
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async downloadUrl(
    url: string,
    filename: string,
    conflictAction?: "uniquify" | "overwrite" | "prompt",
    referer?: string,
  ): Promise<void> {
    if (!this.isValidContext()) return;

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          {
            type: "DOWNLOAD_URL_REQUEST",
            payload: {
              url,
              filename,
              conflictAction: conflictAction || "uniquify",
              referer,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response && !response.success) {
              reject(new Error(response.error));
            } else {
              resolve();
            }
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  openOptionsPage(): void {
    if (this.isValidContext()) chrome.runtime.openOptionsPage();
  }
  async getSettings(): Promise<Settings> {
    return this.storage.get<Settings>("imaget_settings", defaultSettings);
  }
}
