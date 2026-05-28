import { describe, expect, it } from "vitest";
import { createImageItemFromElement } from "../utils/image-item-factory";

describe("createImageItemFromElement", () => {
  it("infers PNG format from the resolved URL", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/image.png";

    const item = createImageItemFromElement({
      id: "test-1",
      url: img.src,
      target: img,
      pageTitle: "Gallery",
      pageUrl: "https://example.com/gallery",
    });

    expect(item.format).toBe("PNG");
    expect(item.filename).toBe("image.png");
    expect(item.pageTitle).toBe("Gallery");
    expect(item.pageUrl).toBe("https://example.com/gallery");
  });

  it("uses natural dimensions for image elements when available", () => {
    const img = document.createElement("img");
    Object.defineProperty(img, "naturalWidth", { value: 1280 });
    Object.defineProperty(img, "naturalHeight", { value: 720 });

    const item = createImageItemFromElement({
      id: "test-2",
      url: "https://cdn.example.com/photo.webp?size=large",
      target: img,
      pageTitle: "Gallery",
      pageUrl: "https://example.com/gallery",
    });

    expect(item.width).toBe(1280);
    expect(item.height).toBe(720);
    expect(item.format).toBe("WEBP");
  });
});
