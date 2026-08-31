/**
 * IUrlResolver: 站点特定 URL 解析器接口
 */
export interface IUrlResolver {
  /**
   * 解析器名称（用于调试或过滤）
   */
  readonly name: string;

  /**
   * 检查是否匹配给定的 URL
   */
  matches(url: string): boolean;

  /**
   * 将缩略图或预览图 URL 转换为高清/原图 URL
   */
  resolve(url: string): string;

  /**
   * 主 URL 拉取失败时按序尝试的回退候选（如原图扩展名猜测错误、原图已删除）。
   * 返回空数组表示该解析器无回退策略。
   */
  getFallbackUrls?(url: string): string[];
}
