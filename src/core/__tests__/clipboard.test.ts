import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { copyPngToClipboard } from "../utils/clipboard";

class FakeClipboardItem {
  static instances: FakeClipboardItem[] = [];
  items: Record<string, Blob | Promise<Blob>>;

  constructor(items: Record<string, Blob | Promise<Blob>>) {
    this.items = items;
    FakeClipboardItem.instances.push(this);
  }
}

function stubClipboard(write: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { write },
  });
}

describe("copyPngToClipboard", () => {
  beforeEach(() => {
    FakeClipboardItem.instances = [];
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls clipboard.write synchronously with an image/png item whose blob is still pending", async () => {
    let resolveBlob!: (blob: Blob) => void;
    const blobPromise = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard(write);

    const pending = copyPngToClipboard(blobPromise);

    // 若这里要等 blob 就绪才调用 write，真实浏览器会因 transient activation 失效而拒绝
    expect(write).toHaveBeenCalledTimes(1);
    const item = write.mock.calls[0][0][0] as FakeClipboardItem;
    expect(Object.keys(item.items)).toEqual(["image/png"]);
    expect(item.items["image/png"]).toBe(blobPromise);

    resolveBlob(new Blob(["png"], { type: "image/png" }));
    await expect(pending).resolves.toBeUndefined();
  });

  it("rejects when the image clipboard API is unavailable", async () => {
    vi.stubGlobal("ClipboardItem", undefined);

    await expect(
      copyPngToClipboard(Promise.resolve(new Blob())),
    ).rejects.toThrow("Clipboard image writing is not supported");
  });

  it("rejects when the document is not focused", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard(write);
    vi.spyOn(document, "hasFocus").mockReturnValue(false);

    await expect(
      copyPngToClipboard(Promise.resolve(new Blob())),
    ).rejects.toThrow("Document is not focused");
    expect(write).not.toHaveBeenCalled();
  });
});
