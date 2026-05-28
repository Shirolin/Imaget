import type { ImageItem } from "../types";
import type { LoadedImageCandidateSettings } from "./utils/loaded-image-candidates";
import { collectLoadedImageItems } from "./utils/loaded-image-candidates";

type FollowScanSettings = LoadedImageCandidateSettings;

interface FollowScanStartOptions {
  sessionId: string;
  settings: FollowScanSettings;
}

interface FollowScanControllerOptions {
  onCandidates: (sessionId: string, items: ImageItem[]) => void;
  scrollDebounceMs?: number;
  mutationDebounceMs?: number;
  batchLimit?: number;
}

export class FollowScanController {
  private sessionId: string | null = null;
  private settings: FollowScanSettings | null = null;
  private seenUrls = new Set<string>();
  private paused = false;
  private scrollTimer: number | null = null;
  private mutationTimer: number | null = null;
  private observer: MutationObserver | null = null;
  private pendingRoots = new Set<ParentNode>();
  private readonly scrollDebounceMs: number;
  private readonly mutationDebounceMs: number;
  private readonly batchLimit: number;
  private readonly onCandidates: (sessionId: string, items: ImageItem[]) => void;

  constructor({
    onCandidates,
    scrollDebounceMs = 500,
    mutationDebounceMs = 300,
    batchLimit = 100,
  }: FollowScanControllerOptions) {
    this.onCandidates = onCandidates;
    this.scrollDebounceMs = scrollDebounceMs;
    this.mutationDebounceMs = mutationDebounceMs;
    this.batchLimit = batchLimit;
  }

  start({ sessionId, settings }: FollowScanStartOptions) {
    this.stop();
    this.sessionId = sessionId;
    this.settings = settings;
    this.paused = false;
    this.seenUrls.clear();
    window.addEventListener("scroll", this.handleScroll, true);
    document.addEventListener("load", this.handleLoad, true);
    this.observer = new MutationObserver(this.handleMutation);
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "style", "class"],
    });
  }

  stop() {
    window.removeEventListener("scroll", this.handleScroll, true);
    document.removeEventListener("load", this.handleLoad, true);
    this.observer?.disconnect();
    this.observer = null;
    this.pendingRoots.clear();
    this.clearTimers();
    this.sessionId = null;
    this.settings = null;
    this.paused = false;
    this.seenUrls.clear();
  }

  pause() {
    this.paused = true;
    this.clearTimers();
  }

  resume() {
    this.paused = false;
  }

  scanNow() {
    this.scanRoot(document);
  }

  private scanRoot(root: ParentNode) {
    if (!this.sessionId || !this.settings || this.paused) return;

    const items = collectLoadedImageItems({
      root,
      settings: this.settings,
      seenUrls: this.seenUrls,
      batchLimit: this.batchLimit,
    });
    if (items.length > 0) {
      this.onCandidates(this.sessionId, items);
    }
  }

  private handleScroll = () => {
    if (this.paused || !this.sessionId) return;
    if (this.scrollTimer) window.clearTimeout(this.scrollTimer);
    this.scrollTimer = window.setTimeout(() => {
      this.scrollTimer = null;
      this.scanNow();
    }, this.scrollDebounceMs);
  };

  private handleLoad = (event: Event) => {
    if (this.paused || !this.sessionId) return;
    if (event.target instanceof HTMLImageElement) {
      this.scanRoot(event.target);
    }
  };

  private handleMutation = (records: MutationRecord[]) => {
    if (typeof window === "undefined") return;
    if (this.paused || !this.sessionId) return;

    for (const record of records) {
      if (record.type === "childList") {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement || node instanceof Element) {
            this.pendingRoots.add(node);
          }
        });
      } else if (
        record.type === "attributes" &&
        record.target instanceof HTMLImageElement
      ) {
        this.pendingRoots.add(record.target);
      }
    }

    if (this.pendingRoots.size === 0) return;
    if (this.mutationTimer) window.clearTimeout(this.mutationTimer);
    this.mutationTimer = window.setTimeout(() => {
      this.mutationTimer = null;
      const roots = Array.from(this.pendingRoots);
      this.pendingRoots.clear();
      for (const root of roots) {
        this.scanRoot(root);
      }
    }, this.mutationDebounceMs);
  };

  private clearTimers() {
    if (this.scrollTimer) window.clearTimeout(this.scrollTimer);
    if (this.mutationTimer) window.clearTimeout(this.mutationTimer);
    this.scrollTimer = null;
    this.mutationTimer = null;
    this.pendingRoots.clear();
  }
}
