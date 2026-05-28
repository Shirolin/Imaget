import { describe, it, expect } from "vitest";
import { filterImages } from "../filter";
import type { ImageItem, FilterOptions } from "../../types";

const makeImage = (
  overrides: Partial<ImageItem> & { url: string },
): ImageItem => ({
  id: "test",
  width: 100,
  height: 100,
  sizeKB: 10,
  format: "PNG" as const,
  isSelected: false,
  ...overrides,
});

const defaultOptions: FilterOptions = {
  minWidth: 0,
  minHeight: 0,
  excludeKeywords: "",
  searchQuery: "",
  allowedFormats: [],
  excludeFormats: [],
  aspectRatio: "all",
  sortBy: "order",
  sortDirection: "desc",
  layout: "grid",
  resolutionMode: "or",
};

describe("filterImages", () => {
  it("应该返回空数组当输入空数组", () => {
    expect(filterImages([], defaultOptions)).toEqual([]);
  });

  it("应该按最小尺寸过滤（resolutionMode=or）", () => {
    const images = [
      makeImage({ url: "img1.png", width: 50, height: 50 }),
      makeImage({ url: "img2.png", width: 200, height: 50 }),
    ];
    const options = {
      ...defaultOptions,
      minWidth: 100,
      minHeight: 100,
      resolutionMode: "or" as const,
    };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("img2.png");
  });

  it("应该按最小尺寸过滤（resolutionMode=and）", () => {
    const images = [
      makeImage({ url: "img1.png", width: 100, height: 200 }),
      makeImage({ url: "img2.png", width: 199, height: 199 }),
    ];
    const options = {
      ...defaultOptions,
      minWidth: 100,
      minHeight: 200,
      resolutionMode: "and" as const,
    };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("img1.png");
  });

  it("应该按格式过滤（allowedFormats）", () => {
    const images = [
      makeImage({ url: "img1.png", format: "PNG" }),
      makeImage({ url: "img2.jpg", format: "JPG" }),
    ];
    const options = { ...defaultOptions, allowedFormats: ["PNG" as const] };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].format).toBe("PNG");
  });

  it("应该按排除格式过滤（excludeFormats）", () => {
    const images = [
      makeImage({ url: "img1.png", format: "PNG" }),
      makeImage({ url: "img2.gif", format: "GIF" }),
    ];
    const options = { ...defaultOptions, excludeFormats: ["GIF" as const] };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].format).toBe("PNG");
  });

  it("应该按搜索关键词过滤", () => {
    const images = [
      makeImage({ url: "https://example.com/photo.png" }),
      makeImage({ url: "https://example.com/banner.png" }),
    ];
    const options = { ...defaultOptions, searchQuery: "photo" };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain("photo");
  });

  it("应该按排除关键词过滤", () => {
    const images = [
      makeImage({ url: "https://example.com/icon.png" }),
      makeImage({ url: "https://example.com/hero.png" }),
    ];
    const options = { ...defaultOptions, excludeKeywords: "icon" };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain("hero");
  });

  it("应该按宽高比过滤（square）", () => {
    const images = [
      makeImage({ url: "square.png", width: 100, height: 100 }),
      makeImage({ url: "landscape.png", width: 200, height: 100 }),
    ];
    const options = { ...defaultOptions, aspectRatio: "square" as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("square.png");
  });

  it("应该按宽高比过滤（landscape）", () => {
    const images = [
      makeImage({ url: "landscape.png", width: 200, height: 100 }),
      makeImage({ url: "portrait.png", width: 100, height: 200 }),
    ];
    const options = { ...defaultOptions, aspectRatio: "landscape" as const };
    const result = filterImages(images, options);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("landscape.png");
  });

  it("应该按 size 排序", () => {
    const images = [
      makeImage({ url: "small.png", sizeKB: 10 }),
      makeImage({ url: "large.png", sizeKB: 100 }),
    ];
    const options = {
      ...defaultOptions,
      sortBy: "size" as const,
      sortDirection: "asc" as const,
    };
    const result = filterImages(images, options);
    expect(result[0].url).toBe("small.png");
    expect(result[1].url).toBe("large.png");
  });

  it("应该按 resolution 降序排序", () => {
    const images = [
      makeImage({ url: "low.png", width: 100, height: 100 }),
      makeImage({ url: "high.png", width: 500, height: 500 }),
    ];
    const options = {
      ...defaultOptions,
      sortBy: "resolution" as const,
      sortDirection: "desc" as const,
    };
    const result = filterImages(images, options);
    expect(result[0].url).toBe("high.png");
    expect(result[1].url).toBe("low.png");
  });
});
