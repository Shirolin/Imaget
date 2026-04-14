import type { IPlatformAdapter } from "./interface";
import { type Settings, defaultSettings } from "../../types";

export class WebAdapter implements IPlatformAdapter {
  env = "web" as const;

  async fetchBlob(url: string): Promise<Blob> {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    return await response.blob();
  }

  storage = {
    async get<T>(key: string, defaultVal?: T): Promise<T> {
      const val = localStorage.getItem(key);
      if (val === null) return defaultVal as T;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    },
    async set(key: string, value: unknown): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  async download(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // 撤销之前的 fallback 妥协，直接传参
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 关键修正：增加延时防止浏览器拦截后续下载请求，并清理资源
    await new Promise((resolve) => setTimeout(resolve, 300));
    URL.revokeObjectURL(url);
  }

  openOptionsPage(): void {
    console.warn("Settings page not available in web mode");
  }

  async getSettings(): Promise<Settings> {
    return this.storage.get<Settings>("imaget_settings", defaultSettings);
  }
}
