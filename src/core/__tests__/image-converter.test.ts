import { describe, expect, it, vi, beforeEach } from "vitest";
import { convertImage } from "../utils/image-converter";
import { defaultSettings, type ImageItem } from "../../types";

describe("ImageConverter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("forces conversion for WebP when reEncodeWebp is enabled even if target format is original", async () => {
    const webpBlob = new Blob(["webp content"], { type: "image/webp" });
    const img: ImageItem = {
      id: "1",
      url: "https://example.com/image.webp",
      width: 100,
      height: 100,
      format: "WEBP",
      isSelected: true,
      sizeKB: 10,
    };

    const settings = {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original" as const,
        reEncodeWebp: true,
        quality: 80,
      },
    };

    // Mock Canvas and related APIs
    const mockContext = {
      drawImage: vi.fn(),
    };
    const mockCanvas = {
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((callback) => callback(new Blob(["converted webp"], { type: "image/webp" }))),
      width: 0,
      height: 0,
    };
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return mockCanvas as any;
      return {} as any;
    });

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 100,
        height: 100,
        close: vi.fn(),
      })),
    );

    const result = await convertImage(webpBlob, img, settings);

    expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.8);
    expect(result.extension).toBe("webp");
    expect(await result.blob.text()).toBe("converted webp");
  });

  it("forces conversion for WebP when reEncodeWebp is enabled even if target format is webp", async () => {
    const webpBlob = new Blob(["webp content"], { type: "image/webp" });
    const img: ImageItem = {
      id: "1",
      url: "https://example.com/image.webp",
      width: 100,
      height: 100,
      format: "WEBP",
      isSelected: true,
      sizeKB: 10,
    };

    const settings = {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "webp" as const,
        reEncodeWebp: true,
        quality: 80,
      },
    };

    // Mock Canvas and related APIs
    const mockContext = {
      drawImage: vi.fn(),
    };
    const mockCanvas = {
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((callback) => callback(new Blob(["converted webp"], { type: "image/webp" }))),
      width: 0,
      height: 0,
    };
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return mockCanvas as any;
      return {} as any;
    });

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 100,
        height: 100,
        close: vi.fn(),
      })),
    );

    const result = await convertImage(webpBlob, img, settings);

    expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.8);
    expect(result.extension).toBe("webp");
  });

  it("skips conversion for WebP when reEncodeWebp is disabled and target format is original", async () => {
    const webpBlob = new Blob(["webp content"], { type: "image/webp" });
    const img: ImageItem = {
      id: "1",
      url: "https://example.com/image.webp",
      width: 100,
      height: 100,
      format: "WEBP",
      isSelected: true,
      sizeKB: 10,
    };

    const settings = {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original" as const,
        reEncodeWebp: false,
      },
    };

    const spyCreateElement = vi.spyOn(document, "createElement");

    const result = await convertImage(webpBlob, img, settings);

    expect(spyCreateElement).not.toHaveBeenCalledWith("canvas");
    expect(result.blob).toBe(webpBlob);
    expect(result.extension).toBe("webp");
  });
});
