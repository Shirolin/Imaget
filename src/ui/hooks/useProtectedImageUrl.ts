import { useState, useEffect } from "react";
import { platformAdapter } from "../../core/platform";

const cache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

/**
 * 判断 URL 是否属于需要通过后台代理绕过防盗链的受限域名
 */
function isProtectedDomain(url: string): boolean {
  return (
    url.includes("i.redd.it") ||
    url.includes("pximg.net") ||
    url.includes("sinaimg.cn")
  );
}

/**
 * 针对开启防盗链或跨域受限的图片（如 Reddit、Pixiv），
 * 自动通过 background 的 fetchBlob 代理获取图片并转为 blob URL。
 * 包含 Promise 级缓存，避免同一个 URL 被多个组件并发抓取。
 */
export function useProtectedImageUrl(url: string): string | undefined {
  // 仅在需要异步载入保护域名图片时，存储获取到的临时 Blob Object URL
  const [asyncBlobUrl, setAsyncBlobUrl] = useState<string | undefined>(
    undefined,
  );

  // 1. 同步计算派生状态（Derived State）- 物理级零延迟、安全、无重绘副作用
  const isProtected = isProtectedDomain(url);
  const cachedUrl = cache.get(url);

  // 最终应该被用于 <img> 标签的 URL：
  // - 如果是非保护域名，直接秒级显示原始 url
  // - 如果保护域名且已在本地 Map 缓存中，直接同步显示缓存的 Object URL
  // - 否则，显示我们异步加载完毕并存储在状态中的 asyncBlobUrl（载入中时为 undefined）
  const displaySrc = !isProtected ? url : cachedUrl || asyncBlobUrl;

  useEffect(() => {
    if (!isProtected) return;
    if (cache.has(url)) return;

    let isMounted = true;

    // 我们只需传递 referer 为其首页即可。对于 redd.it，referer 就是 reddit.com
    let referer = undefined;
    if (url.includes("redd.it")) referer = "https://www.reddit.com/";
    if (url.includes("pximg.net")) referer = "https://www.pixiv.net/";
    if (url.includes("sinaimg.cn")) referer = "https://weibo.com/";

    // 开始获取或等待现有的 Promise
    let promise = pendingPromises.get(url);
    if (!promise) {
      const fetchWithFallback = (targetUrl: string): Promise<string> => {
        return platformAdapter.fetchBlob(targetUrl, referer).then((blob) => {
          const objectUrl = URL.createObjectURL(blob);

          // 简单的容量控制，防止极端情况下一直不关侧边栏导致的隐性内存泄漏
          if (cache.size > 500) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
              const oldUrl = cache.get(firstKey);
              if (oldUrl) URL.revokeObjectURL(oldUrl);
              cache.delete(firstKey);
            }
          }

          cache.set(url, objectUrl); // 始终用组件请求的原始 url 作为缓存 key
          return objectUrl;
        });
      };

      promise = fetchWithFallback(url)
        .catch((err) => {
          // Pixiv 的 JPG 回退到 PNG 自动重试逻辑下沉到代理层
          if (url.includes("pximg.net") && url.endsWith(".jpg")) {
            const pngUrl = url.replace(/\.jpg$/, ".png");
            console.log(
              `[Proxy] Pixiv JPG failed, retrying PNG: ${pngUrl}`,
              err,
            );
            return fetchWithFallback(pngUrl);
          }
          throw err;
        })
        .catch((err) => {
          console.warn("Failed to proxy protected image completely:", url, err);
          // 如果完全失败，退回到原始 URL
          return url;
        })
        .finally(() => {
          pendingPromises.delete(url); // 清理 pending
        });

      pendingPromises.set(url, promise);
    }

    promise
      .then((finalUrl) => {
        if (isMounted) setAsyncBlobUrl(finalUrl);
      })
      .catch((err) => {
        console.error(
          "[useProtectedImageUrl] Unexpected error in promise chain:",
          err,
        );
      });

    return () => {
      isMounted = false;
      // 当组件由于滚动复用等原因改变 url 时，同步重置临时状态，防止渲染旧图的遗留 blobUrl
      setAsyncBlobUrl(undefined);
    };
  }, [url, isProtected]);

  return displaySrc;
}
