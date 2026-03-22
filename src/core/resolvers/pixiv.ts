import { IUrlResolver } from "./interface";

export class PixivResolver implements IUrlResolver {
  readonly name = "Pixiv";

  matches(url: string): boolean {
    return url.includes("i.pximg.net") && url.includes("/c/");
  }

  resolve(url: string): string {
    return url
      .replace(/\/c\/[^/]+/, "")
      .replace(/\/img-master\//, "/img-original/")
      .replace(/_master\d+/, "");
  }
}
