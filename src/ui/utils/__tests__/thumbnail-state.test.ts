import { describe, expect, it, vi } from "vitest";
import {
  markThumbnailError,
  revealThumbnailImage,
  syncCachedThumbnail,
} from "../thumbnail-state";

function createThumbnail() {
  const container = document.createElement("div");
  container.dataset.imageThumb = "true";
  const image = document.createElement("img");
  container.appendChild(image);
  document.body.appendChild(container);
  return { container, image };
}

describe("thumbnail state", () => {
  it("marks a thumbnail as loaded after image decode", async () => {
    const { container, image } = createThumbnail();
    const decode = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(image, "decode", { configurable: true, value: decode });

    await revealThumbnailImage(image);

    expect(decode).toHaveBeenCalledOnce();
    expect(container.dataset.loaded).toBe("true");
    expect(container.dataset.error).toBeUndefined();
  });

  it("marks a thumbnail as loaded even when decode rejects", async () => {
    const { container, image } = createThumbnail();
    Object.defineProperty(image, "decode", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("decode failed")),
    });

    await revealThumbnailImage(image);

    expect(container.dataset.loaded).toBe("true");
  });

  it("marks a thumbnail as errored without loading an external fallback", () => {
    const { container, image } = createThumbnail();
    container.dataset.loaded = "true";

    markThumbnailError(image);

    expect(container.dataset.error).toBe("true");
    expect(container.dataset.loaded).toBeUndefined();
  });

  it("reveals cached images on mount", async () => {
    const { container, image } = createThumbnail();
    Object.defineProperty(image, "complete", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(image, "decode", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    syncCachedThumbnail(image);
    await Promise.resolve();

    expect(container.dataset.loaded).toBe("true");
  });
});
