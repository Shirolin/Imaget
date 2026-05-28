import { describe, expect, it, vi } from "vitest";
import type { IPlatformAdapter } from "../adapters/interface";
import { ImageProcessor } from "../processor";
import { defaultSettings, type ImageItem } from "../../types";

function makeImage(url: string): ImageItem {
  return {
    id: url,
    url,
    width: 10,
    height: 10,
    format: "PNG",
    filename: "image.png",
    isSelected: true,
    pageTitle: "Page",
    pageUrl: "https://example.com/page",
    sizeKB: 1,
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

describe("ImageProcessor", () => {
  it("reports ZIP compression as part of total progress", async () => {
    const adapter = makeAdapter();
    const processor = new ImageProcessor(adapter);
    const progress: Array<[number, number]> = [];

    await processor.downloadAsZip(
      [makeImage("https://example.com/a.png")],
      {
        ...defaultSettings,
        downloadLogic: {
          ...defaultSettings.downloadLogic,
          targetFormat: "original",
        },
      },
      (current, total) => {
        progress.push([current, total]);
      },
    );

    expect(progress[0]).toEqual([1, 2]);
    expect(progress.at(-1)).toEqual([2, 2]);
    expect(adapter.download).toHaveBeenCalledOnce();
  });

  it("uses direct URL download for original HTTP images when the adapter supports it", async () => {
    const adapter = {
      ...makeAdapter(),
      downloadUrl: vi.fn(async () => undefined),
    };
    const processor = new ImageProcessor(adapter);

    await processor.downloadBatch([makeImage("https://example.com/a.png")], {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original",
        reEncodeWebp: false,
      },
    });

    expect(adapter.downloadUrl).toHaveBeenCalledWith(
      "https://example.com/a.png",
      expect.stringContaining(".png"),
      expect.any(String),
      "https://example.com/page",
    );
    expect(adapter.fetchBlob).not.toHaveBeenCalled();
  });

  it("does not use direct URL download for GIF first-frame conversion", async () => {
    const adapter = {
      ...makeAdapter(),
      downloadUrl: vi.fn(async () => undefined),
    };
    const processor = new ImageProcessor(adapter);
    const gifImage = {
      ...makeImage("https://example.com/animated.gif"),
      format: "GIF",
      filename: "animated.gif",
      pageUrl: "",
    } satisfies ImageItem;
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) => {
        callback(new Blob(["png"], { type: "image/png" }));
      });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 10,
        height: 10,
        close: vi.fn(),
      })),
    );

    try {
      await processor.downloadBatch([gifImage], {
        ...defaultSettings,
        gifStrategy: "firstFrame",
        downloadLogic: {
          ...defaultSettings.downloadLogic,
          targetFormat: "original",
          reEncodeWebp: false,
        },
      });
    } finally {
      getContext.mockRestore();
      toBlob.mockRestore();
      vi.unstubAllGlobals();
    }

    expect(adapter.downloadUrl).not.toHaveBeenCalled();
    expect(adapter.fetchBlob).toHaveBeenCalledWith(
      "https://example.com/animated.gif",
      expect.any(String),
    );
  });

  it("does not use direct URL download in extension mode for cross-origin referers", async () => {
    const adapter = {
      ...makeAdapter(),
      env: "extension" as const,
      downloadUrl: vi.fn(async () => undefined),
    };
    const processor = new ImageProcessor(adapter);
    const image = {
      ...makeImage("https://cdn.example.net/a.png"),
      pageUrl: "https://example.com/page",
    };

    await processor.downloadBatch([image], {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original",
        reEncodeWebp: false,
      },
    });

    expect(adapter.downloadUrl).not.toHaveBeenCalled();
    expect(adapter.fetchBlob).toHaveBeenCalledWith(
      "https://cdn.example.net/a.png",
      "https://example.com/page",
    );
  });

  it("uses direct URL download in extension mode for same-origin page images", async () => {
    const adapter = {
      ...makeAdapter(),
      env: "extension" as const,
      downloadUrl: vi.fn(async () => undefined),
    };
    const processor = new ImageProcessor(adapter);

    await processor.downloadBatch([makeImage("https://example.com/a.png")], {
      ...defaultSettings,
      downloadLogic: {
        ...defaultSettings.downloadLogic,
        targetFormat: "original",
        reEncodeWebp: false,
      },
    });

    expect(adapter.downloadUrl).toHaveBeenCalledWith(
      "https://example.com/a.png",
      expect.stringContaining(".png"),
      expect.any(String),
      "https://example.com/page",
    );
    expect(adapter.fetchBlob).not.toHaveBeenCalled();
  });

  describe("conflictResolution mapping", () => {
    it("correctly passes 'overwrite' to adapter", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      await processor.downloadBatch([makeImage("https://example.com/1.png")], {
        ...defaultSettings,
        downloadControl: {
          ...defaultSettings.downloadControl,
          conflictResolution: "overwrite",
        },
      });

      expect(adapter.download).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        "overwrite",
      );
    });

    it("correctly passes 'uniquify' to adapter", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      await processor.downloadBatch([makeImage("https://example.com/1.png")], {
        ...defaultSettings,
        downloadControl: {
          ...defaultSettings.downloadControl,
          conflictResolution: "uniquify",
        },
      });

      expect(adapter.download).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        "uniquify",
      );
    });

    it("correctly passes 'prompt' to adapter", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      await processor.downloadBatch([makeImage("https://example.com/1.png")], {
        ...defaultSettings,
        downloadControl: {
          ...defaultSettings.downloadControl,
          conflictResolution: "prompt",
        },
      });

      expect(adapter.download).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        "prompt",
      );
    });

    it("correctly passes 'prompt' to adapter via downloadUrl", async () => {
      const adapter = {
        ...makeAdapter(),
        downloadUrl: vi.fn(async () => undefined),
      };
      const processor = new ImageProcessor(adapter);

      await processor.downloadBatch([makeImage("https://example.com/1.png")], {
        ...defaultSettings,
        downloadLogic: {
          ...defaultSettings.downloadLogic,
          targetFormat: "original",
        },
        downloadControl: {
          ...defaultSettings.downloadControl,
          conflictResolution: "prompt",
        },
      });

      expect(adapter.downloadUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "prompt",
        expect.any(String),
      );
    });
  });

  describe("simulateDownloadFailure", () => {
    it("throws error in downloadBatch when simulateDownloadFailure is true", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      const promise = processor.downloadBatch(
        [makeImage("https://example.com/1.png")],
        {
          ...defaultSettings,
          debug: { simulateDownloadFailure: true },
        },
      );

      await expect(promise).rejects.toThrow("Simulated download failure");
    });

    it("throws error in downloadAsZip when simulateDownloadFailure is true", async () => {
      const adapter = makeAdapter();
      const processor = new ImageProcessor(adapter);

      const promise = processor.downloadAsZip(
        [makeImage("https://example.com/1.png")],
        {
          ...defaultSettings,
          debug: { simulateDownloadFailure: true },
        },
      );

      await expect(promise).rejects.toThrow("Simulated download failure");
    });
  });
});
