import { ImageItem, FilterOptions } from "../types";

export function filterImages(
  images: ImageItem[],
  options: FilterOptions,
): ImageItem[] {
  return images
    .map((img, index) => ({ img, index }))
    .filter(({ img }) => {
      // 尺寸过滤
      const widthMatch = img.width >= options.minWidth;
      const heightMatch = img.height >= options.minHeight;

      const isResolutionMatch =
        options.resolutionMode === "and"
          ? widthMatch && heightMatch
          : widthMatch || heightMatch;

      if (!isResolutionMatch) return false;

      // 格式过滤
      if (
        options.allowedFormats.length > 0 &&
        !options.allowedFormats.includes(img.format)
      )
        return false;

      // 关键词过滤 (URL 或 文件名)
      const urlLower = img.url.toLowerCase();

      if (
        options.searchQuery &&
        !urlLower.includes(options.searchQuery.toLowerCase())
      )
        return false;

      if (options.excludeKeywords) {
        const keywords = options.excludeKeywords
          .toLowerCase()
          .split(/\s+/)
          .filter((k) => k);
        if (keywords.some((k) => urlLower.includes(k))) return false;
      }

      // 比例过滤
      if (options.aspectRatio !== "all") {
        const ratio = img.width / img.height;
        if (options.aspectRatio === "square") {
          // 正方形: 宽高比在 0.95 到 1.05 之间
          if (ratio < 0.95 || ratio > 1.05) return false;
        } else if (options.aspectRatio === "landscape") {
          // 横图: 宽 > 高
          if (ratio <= 1.05) return false;
        } else if (options.aspectRatio === "portrait") {
          // 竖图: 高 > 宽
          if (ratio >= 0.95) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // 排序逻辑
      let comparison = 0;
      if (options.sortBy === "size") comparison = a.img.sizeKB - b.img.sizeKB;
      else if (options.sortBy === "resolution")
        comparison = a.img.width * a.img.height - b.img.width * b.img.height;

      // 保底逻辑：如果权重相等，使用原始位序 index，确保排序是严格可反转且稳定的
      if (comparison === 0) comparison = a.index - b.index;

      return options.sortDirection === "asc" ? comparison : -comparison;
    })
    .map((item) => item.img);
}
