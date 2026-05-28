import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateAutoScrollStep,
  pickAutoScrollTarget,
  resolveAutoScrollPolicy,
} from "../utils/auto-scroll-policy";

function defineNumberProp(
  target: object,
  key: string,
  value: number,
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    value,
  });
}

describe("auto scroll policy", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("uses defaults and clamps step size", () => {
    const policy = resolveAutoScrollPolicy();

    expect(calculateAutoScrollStep(100, policy)).toBe(300);
    expect(calculateAutoScrollStep(2000, policy)).toBe(700);
  });

  it("prefers document scrolling element when it is scrollable", () => {
    const doc = document;
    const scroller = doc.documentElement;

    defineNumberProp(scroller, "scrollHeight", 3000);
    defineNumberProp(scroller, "clientHeight", 1000);
    defineNumberProp(scroller, "scrollTop", 120);

    Object.defineProperty(doc, "scrollingElement", {
      configurable: true,
      value: scroller,
    });

    const target = pickAutoScrollTarget(doc);
    expect(target.kind).toBe("document");
    expect(target.element).toBe(scroller);
    expect(target.maxScrollTop).toBe(2000);
  });

  it("falls back to the largest visible scroll container", () => {
    const doc = document;
    Object.defineProperty(doc, "scrollingElement", {
      configurable: true,
      value: doc.documentElement,
    });

    defineNumberProp(doc.documentElement, "scrollHeight", 1000);
    defineNumberProp(doc.documentElement, "clientHeight", 1000);
    defineNumberProp(doc.documentElement, "scrollTop", 0);

    const small = doc.createElement("div");
    small.style.overflowY = "auto";
    defineNumberProp(small, "scrollHeight", 1500);
    defineNumberProp(small, "clientHeight", 500);
    defineNumberProp(small, "clientWidth", 400);
    small.getBoundingClientRect = () =>
      ({
        width: 400,
        height: 500,
      }) as DOMRect;

    const large = doc.createElement("div");
    large.style.overflowY = "auto";
    defineNumberProp(large, "scrollHeight", 2200);
    defineNumberProp(large, "clientHeight", 800);
    defineNumberProp(large, "clientWidth", 700);
    large.getBoundingClientRect = () =>
      ({
        width: 700,
        height: 800,
      }) as DOMRect;

    doc.body.appendChild(small);
    doc.body.appendChild(large);

    const target = pickAutoScrollTarget(doc);
    expect(target.kind).toBe("container");
    expect(target.element).toBe(large);
    expect(target.maxScrollTop).toBe(1400);
  });
});
