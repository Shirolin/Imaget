import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sniffer } from "../sniffer";
import { defaultSettings } from "../../types";

const originalImage = globalThis.Image;
const originalFetch = globalThis.fetch;

function installMockImage(options?: {
  delayMs?: number;
  onActiveChange?: (active: number) => void;
  neverLoadPattern?: string;
}) {
  let active = 0;

  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 640;
    naturalHeight = 480;
    private value = "";

    set src(value: string) {
      this.value = value;
      if (!value) return;

      active++;
      options?.onActiveChange?.(active);
      if (
        options?.neverLoadPattern &&
        value.includes(options.neverLoadPattern)
      ) {
        return;
      }
      window.setTimeout(() => {
        active--;
        options?.onActiveChange?.(active);
        this.onload?.();
      }, options?.delayMs ?? 0);
    }

    get src() {
      return this.value;
    }
  }

  vi.stubGlobal("Image", MockImage);
}

function mockResourceTiming(urls: string[]) {
  vi.spyOn(performance, "getEntriesByType").mockReturnValue(
    urls.map(
      (name) =>
        ({
          name,
          initiatorType: "img",
        }) as PerformanceResourceTiming,
    ),
  );
}

describe("Sniffer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "http://localhost:3000/gallery");
    vi.stubGlobal("fetch", vi.fn());
    mockResourceTiming([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    globalThis.Image = originalImage;
    globalThis.fetch = originalFetch;
  });

  it("sniffs DOM, shadow DOM, iframe, SVG, and performance image sources", async () => {
    installMockImage();
    mockResourceTiming(["https://cdn.example.com/perf.jpg"]);

    document.body.innerHTML = `
      <img src="https://cdn.example.com/plain.jpg">
      <picture>
        <source srcset="https://cdn.example.com/small.jpg 320w, https://cdn.example.com/large.jpg 1280w">
      </picture>
      <div id="bg" style="background-image: url('https://cdn.example.com/bg.webp')"></div>
    `;

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<img src="https://cdn.example.com/shadow.png">';
    document.body.appendChild(host);

    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframe.contentDocument?.body.appendChild(
      Object.assign(document.createElement("img"), {
        src: "https://cdn.example.com/frame.gif",
      }),
    );

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = '<rect width="40" height="40"></rect>';
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      width: 40,
      height: 40,
      x: 0,
      y: 0,
      top: 0,
      right: 40,
      bottom: 40,
      left: 0,
      toJSON: () => ({}),
    });
    document.body.appendChild(svg);

    const results = await new Sniffer().sniffAll(defaultSettings);
    const urls = results.map((item) => item.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://cdn.example.com/plain.jpg",
        "https://cdn.example.com/large.jpg",
        "https://cdn.example.com/bg.webp",
        "https://cdn.example.com/shadow.png",
        "https://cdn.example.com/frame.gif",
        "https://cdn.example.com/perf.jpg",
      ]),
    );
    expect(urls.some((url) => url.startsWith("data:image/svg+xml"))).toBe(true);
  });

  it("limits concurrent metadata image loads to twelve", async () => {
    let maxActive = 0;
    installMockImage({
      delayMs: 5,
      onActiveChange: (active) => {
        maxActive = Math.max(maxActive, active);
      },
    });

    for (let i = 0; i < 20; i++) {
      const img = document.createElement("img");
      img.src = `https://cdn.example.com/image-${i}.jpg`;
      document.body.appendChild(img);
    }

    await new Sniffer().sniffAll(defaultSettings);

    expect(maxActive).toBeLessThanOrEqual(12);
  });

  it("does not let stalled image metadata block the initial scan", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    installMockImage({ neverLoadPattern: "stuck" });

    document.body.innerHTML = `
      <img src="https://cdn.example.com/ok.jpg">
      <img src="https://cdn.example.com/stuck.jpg">
    `;

    const scan = new Sniffer().sniffAll(defaultSettings);
    await vi.advanceTimersByTimeAsync(5000);
    const results = await scan;

    expect(results.map((item) => item.url)).toEqual([
      "https://cdn.example.com/ok.jpg",
    ]);
    vi.useRealTimers();
  });

  it("emits already loaded DOM images during the unified scan before metadata finishes", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/loaded.webp";
    Object.defineProperty(img, "complete", { configurable: true, value: true });
    Object.defineProperty(img, "naturalWidth", {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(img, "naturalHeight", {
      configurable: true,
      value: 768,
    });
    document.body.appendChild(img);

    installMockImage({ neverLoadPattern: "loaded" });

    const onCandidates = vi.fn();
    const scan = new Sniffer().sniffAll(defaultSettings, undefined, {
      onCandidates,
    });
    await Promise.resolve();

    expect(onCandidates).toHaveBeenCalledWith([
      expect.objectContaining({
        url: "https://cdn.example.com/loaded.webp",
        width: 1024,
        height: 768,
        format: "WEBP",
        isSelected: false,
      }),
    ]);

    await vi.advanceTimersByTimeAsync(5000);
    await expect(scan).resolves.toEqual([]);
    vi.useRealTimers();
  });

  it("does not emit data placeholders as early scan candidates", async () => {
    const placeholder = document.createElement("img");
    placeholder.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    Object.defineProperty(placeholder, "complete", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(placeholder, "naturalWidth", {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(placeholder, "naturalHeight", {
      configurable: true,
      value: 1,
    });
    document.body.appendChild(placeholder);

    installMockImage();
    const onCandidates = vi.fn();
    await new Sniffer().sniffAll(defaultSettings, undefined, { onCandidates });

    expect(onCandidates).not.toHaveBeenCalled();
  });

  it("skips auto scroll on disabled domains", async () => {
    const scrollBySpy = vi.spyOn(window, "scrollBy");
    const scrollToSpy = vi.spyOn(window, "scrollTo");
    window.history.replaceState(null, "", "http://localhost:3000/list");

    const result = await new Sniffer().autoScroll(
      {
        interfaceBehavior: {
          disabledDomains: ["localhost"],
          searchAllFrames: true,
          identifyBackgroundImages: true,
          identifyBlobImages: false,
        },
      },
      undefined,
      { settleMs: 0 },
    );

    expect(result.reason).toBe("disabled-domain");
    expect(scrollBySpy).not.toHaveBeenCalled();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("restores previous scroll position after auto scroll", async () => {
    const scroller = document.documentElement;
    let scrollTop = 240;

    Object.defineProperty(document, "scrollingElement", {
      configurable: true,
      value: scroller,
    });
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 1800,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    vi.spyOn(window, "scrollBy").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = Math.min(scrollTop + y, 800);
      }
    });

    vi.spyOn(window, "scrollTo").mockImplementation((x, y) => {
      if (typeof x === "number" && typeof y !== "number") {
        scrollTop = x;
        return;
      }
      if (typeof y === "number") {
        scrollTop = y;
      }
    });

    const result = await new Sniffer().autoScroll(
      {
        interfaceBehavior: {
          disabledDomains: [],
          searchAllFrames: true,
          identifyBackgroundImages: true,
          identifyBlobImages: false,
        },
      },
      undefined,
      {
        maxSteps: 2,
        settleMs: 0,
        maxDurationMs: 30000,
      },
    );

    expect(["completed", "max-steps"]).toContain(result.reason);
    expect(scrollTop).toBe(240);
  });

  it("continues to the bottom when scroll height does not grow", async () => {
    const scroller = document.documentElement;
    let scrollTop = 0;

    Object.defineProperty(document, "scrollingElement", {
      configurable: true,
      value: scroller,
    });
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    vi.spyOn(window, "scrollBy").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = Math.min(scrollTop + y, 4000);
      }
    });
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const result = await new Sniffer().autoScroll(
      defaultSettings,
      undefined,
      {
        maxSteps: 10,
        settleMs: 0,
        idleRounds: 4,
        maxDurationMs: 30000,
        minStepPx: 900,
        maxStepPx: 900,
      },
    );

    expect(result.reason).toBe("completed");
    expect(result.steps).toBeGreaterThan(4);
  });

  it("can cancel auto scroll and still restore position", async () => {
    const scroller = document.documentElement;
    const controller = new AbortController();
    let scrollTop = 180;

    Object.defineProperty(document, "scrollingElement", {
      configurable: true,
      value: scroller,
    });
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    vi.spyOn(window, "scrollBy").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = Math.min(scrollTop + y, 4000);
      }
      controller.abort();
    });
    vi.spyOn(window, "scrollTo").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = y;
      }
    });

    const result = await new Sniffer().autoScroll(
      defaultSettings,
      undefined,
      { maxSteps: 10, settleMs: 0, maxDurationMs: 30000 },
      undefined,
      controller.signal,
    );

    expect(result.reason).toBe("cancelled");
    expect(result.steps).toBe(1);
    expect(scrollTop).toBe(180);
  });

  it("calls lightweight capture hooks after settled scroll steps and before restoring position", async () => {
    const scroller = document.documentElement;
    let scrollTop = 100;
    const settledPositions: number[] = [];
    const beforeRestore = vi.fn(() => {
      settledPositions.push(scrollTop);
    });

    Object.defineProperty(document, "scrollingElement", {
      configurable: true,
      value: scroller,
    });
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 1900,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    vi.spyOn(window, "scrollBy").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = Math.min(scrollTop + y, 900);
      }
    });
    vi.spyOn(window, "scrollTo").mockImplementation((_x, y) => {
      if (typeof y === "number") {
        scrollTop = y;
      }
    });

    await new Sniffer().autoScroll(
      defaultSettings,
      undefined,
      {
        maxSteps: 1,
        settleMs: 0,
        maxDurationMs: 30000,
        minStepPx: 500,
        maxStepPx: 500,
      },
      undefined,
      undefined,
      {
        onSettledStep: () => {
          settledPositions.push(scrollTop);
        },
        onBeforeRestore: beforeRestore,
      },
    );

    expect(settledPositions).toEqual([600, 600]);
    expect(beforeRestore).toHaveBeenCalledTimes(1);
    expect(scrollTop).toBe(100);
  });
});
