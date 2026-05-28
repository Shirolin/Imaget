export async function revealThumbnailImage(
  image: HTMLImageElement,
): Promise<void> {
  const thumb = image.closest<HTMLElement>("[data-image-thumb]");
  if (!thumb) return;

  try {
    await image.decode?.();
  } catch {
    // Decoding can reject for SVGs, cached images, or browser-specific races.
  }

  thumb.dataset.loaded = "true";
  delete thumb.dataset.error;
}

export function markThumbnailError(image: HTMLImageElement): void {
  const thumb = image.closest<HTMLElement>("[data-image-thumb]");
  if (!thumb) return;

  thumb.dataset.error = "true";
  delete thumb.dataset.loaded;
}

export function syncCachedThumbnail(image: HTMLImageElement): void {
  if (image.complete && image.naturalWidth > 0) {
    void revealThumbnailImage(image);
  }
}
