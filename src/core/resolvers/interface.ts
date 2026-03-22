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
}
