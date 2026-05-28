import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "../../../types";
import { collectLoadedImageItems } from "../loaded-image-candidates";

function loadedImage(url: string, width = 640, height = 480): HTMLImageElement {
  const img = document.createElement("img");
  img.src = url;
  Object.defineProperty(img, "complete", { configurable: true, value: true });
  Object.defineProperty(img, "naturalWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(img, "naturalHeight", {
    configurable: true,
    value: height,
  });
  return img;
}

describe("loaded image candidates", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "http://localhost:3000/gallery");
  });

  it("collects loaded img elements and remembers seen URLs", () => {
    document.body.appendChild(loadedImage("https://cdn.example.com/a.webp"));
    document.body.appendChild(loadedImage("https://cdn.example.com/a.webp"));
    document.body.appendChild(loadedImage("https://cdn.example.com/b.jpg"));
    const seenUrls = new Set<string>();

    const first = collectLoadedImageItems({
      root: document,
      settings: defaultSettings,
      seenUrls,
    });
    const second = collectLoadedImageItems({
      root: document,
      settings: defaultSettings,
      seenUrls,
    });

    expect(first.map((item) => item.url)).toEqual([
      "https://cdn.example.com/a.webp",
      "https://cdn.example.com/b.jpg",
    ]);
    expect(second).toEqual([]);
  });

  it("filters unloaded, tiny data, and extension-root images", () => {
    const unloaded = document.createElement("img");
    unloaded.src = "https://cdn.example.com/unloaded.jpg";
    Object.defineProperty(unloaded, "complete", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(unloaded, "naturalWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(unloaded, "naturalHeight", {
      configurable: true,
      value: 480,
    });

    const placeholder = loadedImage(
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      1,
      1,
    );
    const root = document.createElement("div");
    root.id = "imaget-reborn-root";
    root.appendChild(loadedImage("https://cdn.example.com/ui.png"));

    document.body.append(unloaded, placeholder, root);

    expect(
      collectLoadedImageItems({ root: document, settings: defaultSettings }),
    ).toEqual([]);
  });

  it("respects blob image settings and batch limits", () => {
    document.body.appendChild(loadedImage("blob:http://localhost:3000/one"));
    document.body.appendChild(loadedImage("https://cdn.example.com/two.jpg"));

    expect(
      collectLoadedImageItems({
        root: document,
        settings: defaultSettings,
      }).map((item) => item.url),
    ).toEqual(["https://cdn.example.com/two.jpg"]);

    expect(
      collectLoadedImageItems({
        root: document,
        settings: {
          ...defaultSettings,
          interfaceBehavior: {
            ...defaultSettings.interfaceBehavior,
            identifyBlobImages: true,
          },
        },
        batchLimit: 1,
      }).map((item) => item.url),
    ).toEqual(["blob:http://localhost:3000/one"]);
  });

  it("can collect an image root without scanning the whole document", () => {
    const rootImage = loadedImage("https://cdn.example.com/root.jpg");
    document.body.appendChild(rootImage);
    document.body.appendChild(loadedImage("https://cdn.example.com/other.jpg"));

    expect(
      collectLoadedImageItems({
        root: rootImage,
        settings: defaultSettings,
      }).map((item) => item.url),
    ).toEqual(["https://cdn.example.com/root.jpg"]);
  });
});
