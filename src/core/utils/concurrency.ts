/**
 * 并发执行器：以限定并发数执行一组异步任务
 */
export async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<void>,
  onProgress?: (current: number, total: number) => void,
): Promise<{ success: number; fail: number }> {
  const total = items.length;
  let currentIndex = 0;
  let completed = 0;
  let failCount = 0;

  const worker = async () => {
    while (currentIndex < total) {
      const index = currentIndex++;
      const item = items[index];
      try {
        await handler(item, index);
      } catch {
        failCount++;
      } finally {
        completed++;
        onProgress?.(completed, total);
      }
    }
  };

  const effectiveConcurrency =
    concurrency > 0 ? Math.min(concurrency, total) : total;
  const workers = Array(effectiveConcurrency)
    .fill(null)
    .map(() => worker());
  await Promise.all(workers);

  return { success: total - failCount, fail: failCount };
}
