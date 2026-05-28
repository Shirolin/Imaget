export type AutoScrollStopReason =
  | "completed"
  | "max-steps"
  | "max-duration"
  | "no-growth"
  | "cancelled"
  | "not-scrollable"
  | "disabled-domain";

export interface AutoScrollPolicy {
  maxDurationMs: number;
  maxSteps: number;
  settleMs: number;
  idleRounds: number;
  stepFactor: number;
  minStepPx: number;
  maxStepPx: number;
}

export interface AutoScrollTarget {
  kind: "document" | "container" | "none";
  element: HTMLElement | null;
  maxScrollTop: number;
  viewportHeight: number;
}

const DEFAULT_POLICY: AutoScrollPolicy = {
  maxDurationMs: 30000,
  maxSteps: 120,
  settleMs: 450,
  idleRounds: 4,
  stepFactor: 0.6,
  minStepPx: 300,
  maxStepPx: 700,
};

export function resolveAutoScrollPolicy(
  partial?: Partial<AutoScrollPolicy>,
): AutoScrollPolicy {
  return {
    ...DEFAULT_POLICY,
    ...partial,
  };
}

export function calculateAutoScrollStep(
  viewportHeight: number,
  policy: AutoScrollPolicy,
): number {
  const raw = Math.round(viewportHeight * policy.stepFactor);
  return clamp(raw, policy.minStepPx, policy.maxStepPx);
}

export function pickAutoScrollTarget(doc: Document): AutoScrollTarget {
  const docScroller = doc.scrollingElement as HTMLElement | null;
  const docMax = getMaxScrollTop(docScroller);
  if (docScroller && docMax > 0) {
    return {
      kind: "document",
      element: docScroller,
      maxScrollTop: docMax,
      viewportHeight: docScroller.clientHeight || window.innerHeight || 0,
    };
  }

  const candidates = Array.from(doc.querySelectorAll<HTMLElement>("body *"));
  let best: { element: HTMLElement; score: number; max: number } | null = null;

  for (const element of candidates) {
    if (isImagetUiElement(element)) continue;
    if (!isScrollableContainer(element)) continue;

    const max = getMaxScrollTop(element);
    if (max <= 0) continue;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const score = rect.width * rect.height + max;
    if (!best || score > best.score) {
      best = { element, score, max };
    }
  }

  if (best) {
    return {
      kind: "container",
      element: best.element,
      maxScrollTop: best.max,
      viewportHeight: best.element.clientHeight,
    };
  }

  return {
    kind: "none",
    element: null,
    maxScrollTop: 0,
    viewportHeight: 0,
  };
}

export function getCurrentScrollTop(target: AutoScrollTarget): number {
  if (!target.element) return 0;
  return target.element.scrollTop || 0;
}

export function getTargetMaxScrollTop(target: AutoScrollTarget): number {
  if (!target.element) return 0;
  return getMaxScrollTop(target.element);
}

function getMaxScrollTop(element: HTMLElement | null): number {
  if (!element) return 0;
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

function isScrollableContainer(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  if (!["auto", "scroll", "overlay"].includes(overflowY)) {
    return false;
  }
  return getMaxScrollTop(element) > 0;
}

function isImagetUiElement(element: HTMLElement): boolean {
  return Boolean(
    element.closest("#imaget-reborn-root") ||
    element.closest(".imaget-extension-container") ||
    element.closest(".imaget-floating-host"),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
