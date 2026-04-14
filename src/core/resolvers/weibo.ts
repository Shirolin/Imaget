import type { IUrlResolver } from "./interface";

export class WeiboResolver implements IUrlResolver {
  readonly name = "Weibo";

  matches(url: string): boolean {
    return url.includes("weibo.com") || url.includes("sinaimg.cn");
  }

  resolve(url: string): string {
    return url.replace(/\/(mw\d+|thumbnail|orj\d+|square)\//, "/large/");
  }
}
