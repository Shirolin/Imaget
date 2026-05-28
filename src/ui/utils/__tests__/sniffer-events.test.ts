import { describe, expect, it } from "vitest";
import {
  FOLLOW_SCAN_CANDIDATES,
  FOLLOW_SCAN_PAUSE,
  FOLLOW_SCAN_RESUME,
  FOLLOW_SCAN_START,
  FOLLOW_SCAN_STOP,
  IMAGET_REOPEN,
  isImagetReopenMessage,
} from "../sniffer-events";

describe("sniffer events", () => {
  it("recognizes the reopen event used to rescan hidden plugin windows", () => {
    expect(isImagetReopenMessage({ type: IMAGET_REOPEN })).toBe(true);
    expect(isImagetReopenMessage({ type: "IMAGET_CLOSE" })).toBe(false);
    expect(isImagetReopenMessage(null)).toBe(false);
  });

  it("exports follow scan message names", () => {
    expect([
      FOLLOW_SCAN_START,
      FOLLOW_SCAN_STOP,
      FOLLOW_SCAN_PAUSE,
      FOLLOW_SCAN_RESUME,
      FOLLOW_SCAN_CANDIDATES,
    ]).toEqual([
      "FOLLOW_SCAN_START",
      "FOLLOW_SCAN_STOP",
      "FOLLOW_SCAN_PAUSE",
      "FOLLOW_SCAN_RESUME",
      "FOLLOW_SCAN_CANDIDATES",
    ]);
  });
});
