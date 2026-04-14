import type { IUrlResolver } from "./interface";

export class RedditResolver implements IUrlResolver {
  readonly name = "Reddit";

  matches(url: string): boolean {
    return (
      url.includes("preview.redd.it") ||
      url.includes("external-preview.redd.it")
    );
  }

  resolve(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.host = "i.redd.it";
      urlObj.search = "";
      return urlObj.href;
    } catch {
      return url
        .replace(/(preview|external-preview)\.redd\.it/, "i.redd.it")
        .split("?")[0];
    }
  }
}
