import { describe, expect, it } from "vitest";
import type { ImageItem } from "../../../types";
import { upsertImageItems } from "../image-state";

function item(overrides: Partial<ImageItem>): ImageItem {
  return {
    id: "id",
    url: "https://cdn.example.com/image.jpg",
    width: 100,
    height: 100,
    sizeKB: 0,
    format: "JPG",
    isSelected: false,
    ...overrides,
  };
}

describe("image state", () => {
  it("updates existing images by URL while preserving selection and stable ID", () => {
    const existing = [
      item({
        id: "stable-id",
        url: "https://cdn.example.com/a.jpg",
        isSelected: true,
        width: 320,
      }),
    ];

    const incoming = [
      item({
        id: "new-id",
        url: "https://cdn.example.com/a.jpg",
        isSelected: false,
        width: 1280,
      }),
    ];

    expect(upsertImageItems(existing, incoming)).toEqual([
      expect.objectContaining({
        id: "stable-id",
        url: "https://cdn.example.com/a.jpg",
        isSelected: true,
        width: 1280,
      }),
    ]);
  });

  it("appends newly discovered images without replacing the current list", () => {
    const existing = [item({ id: "a", url: "https://cdn.example.com/a.jpg" })];
    const incoming = [item({ id: "b", url: "https://cdn.example.com/b.jpg" })];

    expect(
      upsertImageItems(existing, incoming).map((image) => image.url),
    ).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
    ]);
  });
});
