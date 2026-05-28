import type { ImageItem } from "../../types";

export function upsertImageItems(
  existing: ImageItem[],
  incoming: ImageItem[],
): ImageItem[] {
  if (incoming.length === 0) return existing;

  const indexByUrl = new Map<string, number>();
  existing.forEach((item, index) => indexByUrl.set(item.url, index));

  const next = [...existing];
  for (const item of incoming) {
    const existingIndex = indexByUrl.get(item.url);
    if (existingIndex === undefined) {
      indexByUrl.set(item.url, next.length);
      next.push(item);
      continue;
    }

    const previous = next[existingIndex];
    next[existingIndex] = {
      ...item,
      id: previous.id,
      isSelected: previous.isSelected,
    };
  }

  return next;
}
