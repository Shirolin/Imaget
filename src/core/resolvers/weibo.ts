import type { IUrlResolver } from "./interface";

export class WeiboResolver implements IUrlResolver {
  readonly name = "Weibo";

  matches(url: string): boolean {
    return url.includes("sinaimg.cn");
  }

  resolve(url: string): string {
    const resolved = url.replace(
      /\/(mw\d+|thumbnail|orj\d+|square|bmiddle|woriginal|small|thumb\d+|wap\d+|crop\.\d+\.\d+\.\d+\.\d+\.\d+)\//,
      "/large/"
    );
    return resolved.split("?")[0];
  }

  static parseDimensions(url: string): { width: number; height: number } | null {
    try {
      const match = url.match(/\/([a-zA-Z0-9]{8,22})(ly1|gy1|gy3|ly3|my1|j6|j2|j3|j|g|mw\d+|orj\d+)?([a-zA-Z0-9]{3})([a-zA-Z0-9]{3})([a-zA-Z0-9]{2,4})\.(jpg|jpeg|png|webp|gif)$/i);
      if (!match) return null;

      const widthStr = match[3];
      const heightStr = match[4];

      const width = parseInt(widthStr, 36);
      const height = parseInt(heightStr, 36);

      if (width > 16 && height > 16 && width < 10000 && height < 10000) {
        return { width, height };
      }
    } catch {
      // ignore
    }
    return null;
  }
}
