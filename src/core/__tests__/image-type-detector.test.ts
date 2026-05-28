import { describe, it, expect } from "vitest";
import { ImageTypeDetector } from "../utils/image-type-detector";

describe("ImageTypeDetector.getFormatFromUrl", () => {
  it("应该从 URL 后缀识别 PNG", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.png"),
    ).toBe("PNG");
  });

  it("应该从 URL 后缀识别 JPG", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.jpg"),
    ).toBe("JPG");
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.jpeg"),
    ).toBe("JPG");
  });

  it("应该从 URL 后缀识别 GIF", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.gif"),
    ).toBe("GIF");
  });

  it("应该从 URL 后缀识别 WEBP", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.webp"),
    ).toBe("WEBP");
  });

  it("应该从 URL 后缀识别 SVG", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image.svg"),
    ).toBe("SVG");
  });

  it("应该识别 Twitter format 参数", () => {
    const url = "https://pbs.twimg.com/media/abc123?format=jpg&name=small";
    expect(ImageTypeDetector.getFormatFromUrl(url)).toBe("JPG");
  });

  it("应该识别微信 wx_fmt 参数", () => {
    const url = "https://mp.weixin.qq.com/abc?wx_fmt=png";
    expect(ImageTypeDetector.getFormatFromUrl(url)).toBe("PNG");
  });

  it("应该对未知 URL 返回 UNKNOWN", () => {
    expect(
      ImageTypeDetector.getFormatFromUrl("https://example.com/image"),
    ).toBe("UNKNOWN");
  });

  it("应该处理 null/undefined 输入", () => {
    expect(ImageTypeDetector.getFormatFromUrl(null as unknown as string)).toBe(
      "UNKNOWN",
    );
    expect(
      ImageTypeDetector.getFormatFromUrl(undefined as unknown as string),
    ).toBe("UNKNOWN");
  });
});

describe("ImageTypeDetector.getFormatFromMimeType", () => {
  it("应该从 MIME 识别 PNG", () => {
    expect(ImageTypeDetector.getFormatFromMimeType("image/png")).toBe("PNG");
  });

  it("应该从 MIME 识别 JPEG", () => {
    expect(ImageTypeDetector.getFormatFromMimeType("image/jpeg")).toBe("JPG");
  });

  it("应该从 MIME 识别 WEBP", () => {
    expect(ImageTypeDetector.getFormatFromMimeType("image/webp")).toBe("WEBP");
  });

  it("应该处理 null/空 MIME", () => {
    expect(ImageTypeDetector.getFormatFromMimeType(null)).toBe("UNKNOWN");
    expect(ImageTypeDetector.getFormatFromMimeType("")).toBe("UNKNOWN");
  });
});

describe("ImageTypeDetector.getFormatFromMagicNumber", () => {
  it("应该从魔数识别 JPEG", () => {
    const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe("JPG");
  });

  it("应该从魔数识别 PNG", () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe("PNG");
  });

  it("应该从魔数识别 GIF", () => {
    const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe("GIF");
  });

  it("应该处理过短的 buffer", () => {
    const buffer = new Uint8Array([0x00, 0x01]);
    expect(ImageTypeDetector.getFormatFromMagicNumber(buffer)).toBe("UNKNOWN");
  });
});
