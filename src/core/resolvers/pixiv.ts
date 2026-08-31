import type { IUrlResolver } from "./interface";

export class PixivResolver implements IUrlResolver {
  readonly name = "Pixiv";

  matches(url: string): boolean {
    return url.includes("i.pximg.net");
  }

  resolve(url: string): string {
    const isNovelCover = /\/(sci|ci)\d+_[a-zA-Z0-9]+/.test(url);

    // 1. 小说封面等带有 sci/ci 前缀的图片原图存放在 /novel-cover-original/ 目录下，其他常规图片存放在 /img-original/ 目录下
    const originalDir = isNovelCover
      ? "/novel-cover-original/"
      : "/img-original/";

    let resolved = url
      .replace(/\/c\/[^/]+\/[^/]+/, "") // 匹配双层缩略路径
      .replace(/\/c\/[^/]+/, "") // 匹配单层缩略路径
      .replace(/\/(img-master|custom-thumb)\//, originalDir)
      .replace(
        /i\.pximg\.net\/img\/(\d{4})\//,
        `i.pximg.net${originalDir}img/$1/`,
      ); // 适配小说/插画封面路径，锚定域名防递归

    // 2. 剥离文件名中的尺寸后缀，如 _p0_master1200, _p0_custom1200, _p0_square1200, _master1200
    resolved = resolved.replace(/_(master|custom|square)\d+/, "");

    // 3. 特殊处理：如果是小说封面或企划插图(sci/ci)，由于原图大部分为无损 png，如果是 jpg，我们这里直接先转为 .png 提升一次性加载成功率
    if (isNovelCover && resolved.endsWith(".jpg")) {
      resolved = resolved.replace(/\.jpg$/, ".png");
    }

    return resolved;
  }

  /**
   * 原图 URL 拉取失败时的回退候选：
   * 1. 扩展名变体——pixiv 原图扩展名 (jpg/png/gif) 无法从缩略图 URL 推出，猜错时 404
   * 2. img-master/_master1200 缩略图保底——原图已删除时至少拿到低清版本
   */
  getFallbackUrls(url: string): string[] {
    if (!/\/(img|novel-cover)-original\//.test(url)) return [];

    const fallbacks: string[] = [];
    const extMatch = url.match(/\.(jpg|jpeg|png|gif)$/i);
    if (extMatch) {
      const current = extMatch[1].toLowerCase();
      const variants =
        current === "jpg" || current === "jpeg"
          ? ["png", "gif"]
          : current === "png"
            ? ["jpg", "gif"]
            : ["jpg", "png"];
      for (const ext of variants) {
        fallbacks.push(url.replace(/\.(jpg|jpeg|png|gif)$/i, `.${ext}`));
      }
    }

    // master1200 缩略图恒为 jpg（实测 png/gif 原图同样如此）；仅常规插画路径存在对应 master 目录
    if (url.includes("/img-original/")) {
      fallbacks.push(
        url
          .replace("/img-original/", "/img-master/")
          .replace(/\.[a-z]+$/i, "_master1200.jpg"),
      );
    }

    return fallbacks;
  }
}
