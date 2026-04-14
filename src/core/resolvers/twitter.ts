import type { IUrlResolver } from "./interface";

export class TwitterResolver implements IUrlResolver {
  readonly name = "Twitter";

  matches(url: string): boolean {
    return (
      url.includes("pbs.twimg.com/") &&
      (url.includes("/media/") || url.includes("_thumb/"))
    );
  }

  resolve(url: string): string {
    if (url.includes("name=")) {
      return url.replace(/name=[^&]+/, "name=orig");
    }
    const connector = url.includes("?") ? "&" : "?";
    return `${url}${connector}name=orig`;
  }
}
