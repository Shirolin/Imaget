/**
 * 将 PNG Blob 写入系统剪贴板。
 *
 * 调用约束：必须在用户手势所在的同一任务内**同步**调用一次。
 * ClipboardItem 允许值是 Promise<Blob>，但 clipboard.write 本身若等 await 之后
 * 才调用，浏览器会因 transient activation（用户激活）失效而抛 NotAllowedError。
 */
export async function copyPngToClipboard(blob: Promise<Blob>): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard image writing is not supported");
  }
  if (typeof document !== "undefined" && !document.hasFocus()) {
    throw new Error("Document is not focused");
  }

  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
}
