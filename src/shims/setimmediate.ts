const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextHandle = 1;

const globalScope = globalThis as Record<string, unknown>;

if (typeof globalScope.setImmediate !== "function") {
  globalScope.setImmediate = (
    callback: (...args: unknown[]) => void,
    ...args: unknown[]
  ): number => {
    const handle = nextHandle++;
    const timer = setTimeout(() => {
      timers.delete(handle);
      callback(...args);
    }, 0);

    timers.set(handle, timer);
    return handle;
  };
}

if (typeof globalScope.clearImmediate !== "function") {
  globalScope.clearImmediate = (handle: number): void => {
    const timer = timers.get(handle);
    if (timer) {
      clearTimeout(timer);
      timers.delete(handle);
    }
  };
}
