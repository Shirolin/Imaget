import { IUrlResolver } from "./interface";
import { TwitterResolver } from "./twitter";
import { RedditResolver } from "./reddit";
import { TelegramResolver } from "./telegram";
import { PixivResolver } from "./pixiv";
import { WeiboResolver } from "./weibo";

/**
 * 集中注册所有站点解析器
 */
export const RESOLVERS: IUrlResolver[] = [
  new TwitterResolver(),
  new RedditResolver(),
  new TelegramResolver(),
  new PixivResolver(),
  new WeiboResolver(),
];

export * from "./interface";
