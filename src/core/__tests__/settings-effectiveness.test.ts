/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { ImageProcessor } from "../processor";
import { convertImage } from "../utils/image-converter";
import { defaultSettings, type ImageItem } from "../../types";
import type { IPlatformAdapter } from "../adapters/interface";

function makeImage(url: string, format: string = "PNG"): ImageItem {
  return {
    id: url,
    url,
    width: 100,
    height: 100,
    format: format as any,
    filename: "image.png",
    isSelected: true,
    pageTitle: "Page",
    pageUrl: "https://example.com/page",
    sizeKB: 10,
  };
}

function makeAdapter(): IPlatformAdapter {
  return {
    env: "web",
    fetchBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
    download: vi.fn(async () => undefined),
    openOptionsPage: vi.fn(),
    storage: {
      get: vi.fn(async (_key, defaultVal) => defaultVal),
      set: vi.fn(async () => undefined),
    },
    getSettings: vi.fn(async () => defaultSettings),
  };
}

describe("Settings Effectiveness (Vitest)", () => {
  describe("Download Control", () => {
    it("respects maxConcurrency setting by limiting parallel downloads", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      let activeCount = 0;
      let maxActiveCount = 0;

      // Mock download to track concurrency
      adapter.download = vi.fn(async () => {
        activeCount++;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate work
        activeCount--;
      });

      const images = [
        makeImage("1.png"),
        makeImage("2.png"),
        makeImage("3.png"),
        makeImage("4.png"),
      ];

      const settings = {
        ...defaultSettings,
        downloadControl: {
          ...defaultSettings.downloadControl,
          maxConcurrency: 2,
        },
      };

      await processor.downloadBatch(images, settings);

      expect(maxActiveCount).toBeLessThanOrEqual(2);
      expect(adapter.download).toHaveBeenCalledTimes(4);
    });
  });

  describe("GIF Strategy", () => {
    it("skips GIF when gifStrategy is 'skip'", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      const images = [makeImage("1.png", "PNG"), makeImage("2.gif", "GIF")];

      const settings = {
        ...defaultSettings,
        gifStrategy: "skip" as const,
      };

      await processor.downloadBatch(images, settings);

      expect(adapter.download).toHaveBeenCalledTimes(1);
      // Ensure the GIF was not fetched or downloaded
      expect(adapter.fetchBlob).not.toHaveBeenCalledWith(
        "2.gif",
        expect.any(String),
      );
    });
  });

  describe("Image Conversion", () => {
    it("uses target quality setting during conversion", async () => {
      const img = makeImage("1.png", "PNG");
      const blob = new Blob(["png data"], { type: "image/png" });
      const settings = {
        ...defaultSettings,
        downloadLogic: {
          ...defaultSettings.downloadLogic,
          targetFormat: "jpg" as const,
          quality: 42,
        },
      };

      // Mock Canvas and related APIs
      const mockCanvas = {
        getContext: vi.fn(() => ({ drawImage: vi.fn() })),
        toBlob: vi.fn((callback) =>
          callback(new Blob(["jpg"], { type: "image/jpeg" })),
        ),
        width: 0,
        height: 0,
      };
      vi.spyOn(document, "createElement").mockImplementation(
        (tagName: string) => {
          if (tagName === "canvas") return mockCanvas as any;
          return {} as any;
        },
      );
      vi.stubGlobal(
        "createImageBitmap",
        vi.fn(async () => ({ width: 100, height: 100, close: vi.fn() })),
      );

      await convertImage(blob, img, settings);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        "image/jpeg",
        0.42,
      );

      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });
  });
});
