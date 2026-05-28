import { describe, expect, it } from "vitest";
import { getRollingScanFollowSessionPolicy } from "../rolling-scan-session";

describe("getRollingScanFollowSessionPolicy", () => {
  it("reuses an active follow scan session during rolling scan", () => {
    expect(
      getRollingScanFollowSessionPolicy({
        hasActiveSession: true,
        followScanEnabled: true,
      }),
    ).toEqual({
      startSession: false,
      stopAfterScan: false,
    });
  });

  it("starts and keeps a normal follow scan session when follow scan is enabled", () => {
    expect(
      getRollingScanFollowSessionPolicy({
        hasActiveSession: false,
        followScanEnabled: true,
      }),
    ).toEqual({
      startSession: true,
      stopAfterScan: false,
    });
  });

  it("starts a temporary follow scan session when follow scan is disabled", () => {
    expect(
      getRollingScanFollowSessionPolicy({
        hasActiveSession: false,
        followScanEnabled: false,
      }),
    ).toEqual({
      startSession: true,
      stopAfterScan: true,
    });
  });
});
