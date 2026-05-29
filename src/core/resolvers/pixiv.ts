import type { IUrlResolver } from "./interface";

export class PixivResolver implements IUrlResolver {
  readonly name = "Pixiv";

  matches(url: string): boolean {
    return url.includes("i.pximg.net");
  }

  resolve(url: string): string {
    const isNovelCover = /\/(sci|ci)\d+_[a-zA-Z0-9]+/.test(url);

    // 1. 小说封面等带有 sci/ci 前缀的图片原图存放在 /novel-cover-original/ 目录下，其他常规图片存放在 /img-original/ 目录下
    const originalDir = isNovelCover ? "/novel-cover-original/" : "/img-original/";

    let resolved = url
      .replace(/\/c\/[^/]+\/[^/]+/, "") // 匹配双层缩略路径
      .replace(/\/c\/[^/]+/, "")        // 匹配单层缩略路径
      .replace(/\/(img-master|custom-thumb)\//, originalDir)
      .replace(/i\.pximg\.net\/img\/(\d{4})\//, `i.pximg.net${originalDir}img/$1/`); // 适配小说/插画封面路径，锚定域名防递归

    // 2. 剥离文件名中的尺寸后缀，如 _p0_master1200, _p0_custom1200, _p0_square1200, _master1200
    resolved = resolved.replace(/_(master|custom|square)\d+/, "");

    // 3. 特殊处理：如果是小说封面或企划插图(sci/ci)，由于原图大部分为无损 png，如果是 jpg，我们这里直接先转为 .png 提升一次性加载成功率
    if (isNovelCover && resolved.endsWith(".jpg")) {
      resolved = resolved.replace(/\.jpg$/, ".png");
    }

    return resolved;
  }
}
