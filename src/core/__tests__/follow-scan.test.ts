import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowScanController } from "../follow-scan";
import { defaultSettings, type ImageItem } from "../../types";

function loadedImage(url: string): HTMLImageElement {
  const img = document.createElement("img");
  img.src = url;
  Object.defineProperty(img, "complete", { configurable: true, value: true });
  Object.defineProperty(img, "naturalWidth", {
    configurable: true,
    value: 640,
  });
  Object.defineProperty(img, "naturalHeight", {
    configurable: true,
    value: 480,
  });
  return img;
}

describe("FollowScanController", () => {
  const controllers: FollowScanController[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "http://localhost:3000/gallery");
  });

  afterEach(() => {
    controllers.forEach((controller) => controller.stop());
    controllers.length = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("emits loaded candidates after a debounced scroll", async () => {
    const emitted: Array<{ sessionId: string; items: ImageItem[] }> = [];
    const controller = new FollowScanController({
      onCandidates: (sessionId, items) => emitted.push({ sessionId, items }),
      scrollDebounceMs: 500,
      mutationDebounceMs: 300,
    });
    controllers.push(controller);

    document.body.appendChild(loadedImage("https://cdn.example.com/a.jpg"));
    controller.start({ sessionId: "follow-1", settings: defaultSettings });
    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(499);
    expect(emitted).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(emitted).toEqual([
      {
        sessionId: "follow-1",
        items: [expect.objectContaining({ url: "https://cdn.example.com/a.jpg" })],
      },
    ]);
  });

  it("emits candidates when a newly added image finishes loading", () => {
    const emitted: ImageItem[][] = [];
    const controller = new FollowScanController({
      onCandidates: (_sessionId, items) => emitted.push(items),
    });
    controllers.push(controller);

    controller.start({ sessionId: "follow-1", settings: defaultSettings });
    const img = loadedImage("https://cdn.example.com/lazy.webp");
    document.body.appendChild(img);
    img.dispatchEvent(new Event("load", { bubbles: true }));

    expect(emitted).toEqual([
      [expect.objectContaining({ url: "https://cdn.example.com/lazy.webp" })],
    ]);
  });

  it("scans only the loaded image on load instead of the whole document", () => {
    const emitted: ImageItem[][] = [];
    const controller = new FollowScanController({
      onCandidates: (_sessionId, items) => emitted.push(items),
    });
    controllers.push(controller);

    document.body.appendChild(loadedImage("https://cdn.example.com/old.jpg"));
    controller.start({ sessionId: "follow-1", settings: defaultSettings });

    const lazy = loadedImage("https://cdn.example.com/lazy.jpg");
    document.body.appendChild(lazy);
    lazy.dispatchEvent(new Event("load", { bubbles: true }));

    expect(emitted).toEqual([
      [expect.objectContaining({ url: "https://cdn.example.com/lazy.jpg" })],
    ]);
  });

  it("scans mutated subtrees instead of the whole document", async () => {
    const emitted: ImageItem[][] = [];
    const controller = new FollowScanController({
      onCandidates: (_sessionId, items) => emitted.push(items),
      mutationDebounceMs: 300,
    });
    controllers.push(controller);

    document.body.appendChild(loadedImage("https://cdn.example.com/old.jpg"));
    controller.start({ sessionId: "follow-1", settings: defaultSettings });

    const section = document.createElement("section");
    section.appendChild(loadedImage("https://cdn.example.com/new.jpg"));
    document.body.appendChild(section);
    await vi.advanceTimersByTimeAsync(300);

    expect(emitted).toEqual([
      [expect.objectContaining({ url: "https://cdn.example.com/new.jpg" })],
    ]);
  });

  it("stops, pauses, and resumes without leaking old session messages", async () => {
    const emitted: Array<{ sessionId: string; items: ImageItem[] }> = [];
    const controller = new FollowScanController({
      onCandidates: (sessionId, items) => emitted.push({ sessionId, items }),
      scrollDebounceMs: 500,
    });
    controllers.push(controller);
    document.body.appendChild(loadedImage("https://cdn.example.com/a.jpg"));

    controller.start({ sessionId: "old", settings: defaultSettings });
    controller.pause();
    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(500);
    expect(emitted).toEqual([]);

    controller.resume();
    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(500);
    expect(emitted.at(-1)?.sessionId).toBe("old");

    controller.stop();
    document.body.appendChild(loadedImage("https://cdn.example.com/b.jpg"));
    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(500);
    expect(emitted.map((event) => event.sessionId)).toEqual(["old"]);

    controller.start({ sessionId: "new", settings: defaultSettings });
    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(500);
    expect(emitted.at(-1)?.sessionId).toBe("new");
  });
});
