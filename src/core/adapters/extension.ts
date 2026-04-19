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

    // 远程资源通过后台代理
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
            if (response?.success && response.dataUrl) {
              const res = await fetch(response.dataUrl);
              resolve(await res.blob());
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

  download(
    blob: Blob,
    filename: string,
    conflictAction?: "uniquify" | "overwrite",
  ): Promise<void> {
    if (!this.isValidContext()) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          // 注意：我们通过消息发送 DataURL，并在 payload 中带上完整路径
          chrome.runtime.sendMessage(
            {
              type: "DOWNLOAD_REQUEST",
              payload: {
                url: dataUrl,
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
      };
      reader.readAsDataURL(blob);
    });
  }

  openOptionsPage(): void {
    if (this.isValidContext()) chrome.runtime.openOptionsPage();
  }
  async getSettings(): Promise<Settings> {
    return this.storage.get<Settings>("imaget_settings", defaultSettings);
  }
}
