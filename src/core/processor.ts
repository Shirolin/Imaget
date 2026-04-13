import JSZip from "jszip";
import { ImageItem, Settings } from "../types";
import { IPlatformAdapter } from "./adapters/interface";
import { generateFilename } from "./utils/filename-generator";
import { convertImage } from "./utils/image-converter";

/**
 * ImageProcessor: 100% 对齐旧项目核心逻辑
 * 处理并发、重试、文件名生成及下载分发
 */
export class ImageProcessor {
  constructor(private adapter: IPlatformAdapter) {}

  /**
   * 批量下载图片 (100% 对齐旧项目并发队列与异常捕获)
   */
  async downloadBatch(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const total = images.length;
    const CONCURRENCY =
      settings.downloadControl?.maxConcurrency > 0
        ? settings.downloadControl.maxConcurrency
        : settings.downloadControl?.maxConcurrency === 0
          ? total
          : 5;
    let currentIndex = 0;
    let completed = 0;

    const worker = async () => {
      while (currentIndex < total) {
        const index = currentIndex++;
        const img = images[index];

        // GIF 过滤策略: skip
        if (
          img.format.toLowerCase() === "gif" &&
          settings.gifStrategy === "skip"
        ) {
          completed++;
          onProgress?.(completed, total);
          continue;
        }

        try {
          // 调试：只给第一个任务发一次全量配置，辅助排查
          if (
            index === 0 &&
            typeof chrome !== "undefined" &&
            chrome.runtime?.sendMessage
          ) {
            chrome.runtime
              .sendMessage({
                type: "DEBUG_LOG",
                payload: {
                  message: `Processor using settings: ${JSON.stringify(settings)}`,
                },
              })
              .catch(() => {});
          }

          // 1. 获取数据 (Referer 镜像)
          let blob = await this.adapter.fetchBlob(
            img.url,
            img.pageUrl || window.location.href,
          );

          // 2. 核心逻辑：格式转换
          let extension: string | undefined;
          try {
            const converted = await convertImage(blob, img, settings);
            blob = converted.blob;
            extension = converted.extension;
          } catch (convErr) {
            console.warn(
              `[Processor] Format conversion failed, using original:`,
              convErr,
            );
          }

          // 3. 格式化完整保存路径 (含子文件夹与变量替换)
          const finalPath = generateFilename(
            img,
            settings,
            {
              index: index + 1,
              total,
            },
            extension,
          );

          // 4. 执行下载 ( conflictAction 冲突处理)
          const conflictAction =
            settings.downloadControl?.conflictResolution === "overwrite"
              ? "overwrite"
              : "uniquify";

          // 如果在插件环境下，尝试同步日志到后台以便调试
          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime
              .sendMessage({
                type: "DEBUG_LOG",
                payload: {
                  message: `Preparing download: ${finalPath}`,
                  filename: finalPath,
                },
              })
              .catch(() => {});
          }

          await this.adapter.download(blob, finalPath, conflictAction);
        } catch (err) {
          console.error(
            `[Processor] Failed at index ${index} (${img.url}):`,
            err,
          );
        } finally {
          completed++;
          onProgress?.(completed, total);
        }
      }
    };

    // 启动并行工作线程
    const workers = Array(Math.min(CONCURRENCY, total))
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);
  }

  /**
   * 打包为 ZIP 下载 (100% 对齐旧项目资源拉取策略)
   */
  async downloadAsZip(
    images: ImageItem[],
    settings: Settings,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const zip = new JSZip();
    const total = images.length;
    const CONCURRENCY =
      settings.downloadControl?.maxConcurrency > 0
        ? settings.downloadControl.maxConcurrency
        : settings.downloadControl?.maxConcurrency === 0
          ? total
          : 5;
    let currentIndex = 0;
    let completed = 0;

    const worker = async () => {
      while (currentIndex < total) {
        const index = currentIndex++;
        const img = images[index];

        // GIF 过滤
        if (
          img.format.toLowerCase() === "gif" &&
          settings.gifStrategy === "skip"
        ) {
          completed++;
          onProgress?.(completed, total);
          continue;
        }

        try {
          // ZIP 打包同样需要镜像 Referer
          let blob = await this.adapter.fetchBlob(
            img.url,
            img.pageUrl || window.location.href,
          );

          // 核心逻辑：格式转换 (ZIP 模式也支持转换)
          let extension: string | undefined;
          try {
            const converted = await convertImage(blob, img, settings);
            blob = converted.blob;
            extension = converted.extension;
          } catch (convErr) {
            console.warn(`[Processor] ZIP conversion failed:`, convErr);
          }

          // 获取包含完整目录结构的文件名
          const filename = generateFilename(
            img,
            settings,
            {
              index: index + 1,
              total,
            },
            extension,
          );

          // 写入 ZIP (JSZip 会根据 filename 中的 / 自动创建层级)
          zip.file(filename, blob);
        } catch (err) {
          console.error(
            `[Processor] ZIP resource fetch failed (${img.url}):`,
            err,
          );
        } finally {
          completed++;
          onProgress?.(completed, total);
        }
      }
    };

    const workers = Array(Math.min(CONCURRENCY, total))
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);

    // 生成 ZIP Blob
    const content = await zip.generateAsync({ type: "blob" });

    // 解析当前时间与基础模板变量用于 ZIP 命名
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
    const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
    const pageTitle = images[0]?.pageTitle || document.title || "Imaget";

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
