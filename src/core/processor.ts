import JSZip from "jszip";
import { type ImageItem, type Settings } from "../types";
import type { IPlatformAdapter } from "./adapters/interface";
import { runConcurrent } from "./utils/concurrency";
import { formatDate, generateFilename } from "./utils/filename-generator";
import { convertImage } from "./utils/image-converter";

interface ProcessResult {
  blob: Blob;
  filename: string;
}

/**
 * ImageProcessor: 100% 对齐旧项目核心逻辑
 * 处理并发、重试、文件名生成及下载分发
 */
export class ImageProcessor {
  private adapter: IPlatformAdapter;

  constructor(adapter: IPlatformAdapter) {
    this.adapter = adapter;
  }

  /**
   * 处理单张图片：GIF 过滤、获取数据、格式转换、生成文件名
   * 返回处理结果或 null（表示应跳过）
   */
  private async processSingleImage(
    img: ImageItem,
    settings: Settings,
    index: number,
    total: number,
  ): Promise<ProcessResult | null> {
    // GIF 过滤策略: skip
    if (img.format.toLowerCase() === "gif" && settings.gifStrategy === "skip") {
      return null;
    }

    // 1. 获取数据 (Referer 镜像)
    let blob = await this.adapter.fetchBlob(
      img.url,
      img.pageUrl ||
        (typeof window !== "undefined" ? window.location.href : ""),
    );

    // 2. 核心逻辑：格式转换
    let extension: string | undefined;
    try {
      const converted = await convertImage(blob, img, settings);
      blob = converted.blob;
      extension = converted.extension;
    } catch (convErr) {
      if (convErr instanceof Error && convErr.message === "SKIP_GIF") {
        return null;
      }
      console.warn(
        `[Processor] Format conversion failed, using original:`,
        convErr,
      );
    }

    // 3. 格式化完整保存路径 (含子文件夹与变量替换)
    const filename = generateFilename(
      img,
      settings,
      { index: index + 1, total },
      extension,
    );
    return { blob, filename };
  }

  /**
   * 获取并发数配置
   */
  private getConcurrency(total: number, settings: Settings): number {
    const max = settings.downloadControl?.maxConcurrency;
    if (max !== undefined && max > 0) return max;
    if (max === 0) return total;
    return 5;
  }

  private canDownloadOriginalUrlDirectly(
    img: ImageItem,
    settings: Settings,
  ): boolean {
    if (!this.adapter.downloadUrl) return false;
    if (!/^https?:\/\//i.test(img.url)) return false;
    if (settings.downloadLogic?.targetFormat !== "original") return false;
    if (img.format.toLowerCase() === "gif") return false;
    if (
      img.format.toLowerCase() === "webp" &&
      settings.downloadLogic?.reEncodeWebp
    ) {
      return false;
    }
    if (
      this.adapter.env === "extension" &&
      img.pageUrl?.trim() &&
      !this.hasSameOrigin(img.url, img.pageUrl)
    ) {
      return false;
    }
    return true;
  }

  private hasSameOrigin(imageUrl: string, pageUrl: string): boolean {
    try {
      return new URL(imageUrl).origin === new URL(pageUrl).origin;
    } catch {
      return false;
    }
  }

  /**
   * 发送调试消息（仅在扩展环境中有效）
   */
  private sendDebugLog(payload: Record<string, unknown>): void {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime
        .sendMessage({ type: "DEBUG_LOG", payload })
        .catch(() => {});
    }
  }

  /**
   * 批量下载图片 (100% 对齐旧项目并发队列与异常捕获)
   */
  async downloadBatch(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    if (settings.debug?.simulateDownloadFailure) {
      throw new Error("Simulated download failure");
    }
    const total = images.length;
    const CONCURRENCY = this.getConcurrency(total, settings);

    this.sendDebugLog({
      message: `Processor using settings: ${JSON.stringify(settings)}`,
    });

    const { fail: failCount } = await runConcurrent(
      images,
      CONCURRENCY,
      async (img, index) => {
        try {
          if (this.canDownloadOriginalUrlDirectly(img, settings)) {
            const extension = img.format === "UNKNOWN" ? undefined : img.format;
            const filename = generateFilename(
              img,
              settings,
              { index: index + 1, total },
              extension?.toLowerCase(),
            );
            const conflictAction =
              settings.downloadControl?.conflictResolution || "uniquify";

            this.sendDebugLog({
              message: `Preparing direct URL download: ${filename}`,
              filename,
            });

            await this.adapter.downloadUrl!(
              img.url,
              filename,
              conflictAction,
              img.pageUrl || "",
            );
            return;
          }

          const result = await this.processSingleImage(
            img,
            settings,
            index,
            total,
          );
          if (!result) return;

          const { blob, filename } = result;

          const conflictAction =
            settings.downloadControl?.conflictResolution || "uniquify";

          this.sendDebugLog({
            message: `Preparing download: ${filename}`,
            filename,
          });

          await this.adapter.download(blob, filename, conflictAction);
        } catch (err) {
          console.error(
            `[Processor] Failed at index ${index} (${img.url}):`,
            err,
          );
          throw err;
        }
      },
      onProgress,
    );

    if (total > 0 && failCount === total) {
      throw new Error(`All ${total} downloads failed`);
    }
  }

  /**
   * 打包为 ZIP 下载 (100% 对齐旧项目资源拉取策略)
   */
  async downloadAsZip(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    if (settings.debug?.simulateDownloadFailure) {
      throw new Error("Simulated download failure");
    }
    const zip = new JSZip();
    const total = images.length;
    const CONCURRENCY = this.getConcurrency(total, settings);

    const { fail: failCount } = await runConcurrent(
      images,
      CONCURRENCY,
      async (img, index) => {
        try {
          const result = await this.processSingleImage(
            img,
            settings,
            index,
            total,
          );
          if (!result) return;

          const { blob, filename } = result;

          // 写入 ZIP
          zip.file(filename, blob);
        } catch (err) {
          console.error(
            `[Processor] ZIP resource fetch failed (${img.url}):`,
            err,
          );
          throw err;
        }
      },
      onProgress ? (current) => onProgress(current, total + 1) : undefined,
    );

    if (total > 0 && failCount === total) {
      throw new Error(`All ${total} resources failed to fetch for ZIP`);
    }

    // 生成 ZIP Blob
    const progressTotal = total + 1;
    const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
      onProgress?.(total + metadata.percent / 100, progressTotal);
    });
    onProgress?.(progressTotal, progressTotal);

    // 解析当前时间与基础模板变量用于 ZIP 命名
    const now = new Date();
    const { dateStr, timeStr } = formatDate(now);
    const pageTitle =
      images[0]?.pageTitle ||
      (typeof document !== "undefined" ? document.title : "Imaget");

    // 支持解析子文件夹中的常用变量
    let cleanSub = settings.fileSaving?.subfolder || "Imaget";
    cleanSub = cleanSub
      .split("{date}")
      .join(dateStr)
      .split("{time}")
      .join(timeStr)
      .split("{title}")
      .join(pageTitle)
      .split("{page_title}")
      .join(pageTitle)
      .replace(/[\\:*?"<>|]/g, "_")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    // 取子目录的最后一级作为 Zip 的前缀名
    const baseName = cleanSub
      ? cleanSub.split("/").pop() || "Imaget"
      : "Imaget";
    const zipFileName = `${baseName}_batch_${dateStr}_${timeStr}.zip`;

    // 组装最终路径：将 Zip 文件也放进指定的子目录下
    const finalZipPath = cleanSub ? `${cleanSub}/${zipFileName}` : zipFileName;

    // 通过适配器执行 ZIP 下载
    await this.adapter.download(content, finalZipPath, "uniquify");
  }
}
