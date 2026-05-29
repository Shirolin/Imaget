import type { IUrlResolver } from "./interface";

export class TelegramResolver implements IUrlResolver {
  readonly name = "Telegram";

  matches(url: string): boolean {
    return (
      url.includes("cdn-telegram.org") ||
      url.includes("t.me/s/") ||
      url.includes("telesco.pe") ||
      url.includes("telegram-cdn.org")
    );
  }

  resolve(url: string): string {
    if (url.includes("size=")) {
      return url.replace(/size=[^&]+/, "size=u");
    }
    const connector = url.includes("?") ? "&" : "?";
    return `${url}${connector}size=u`;
  }
}
