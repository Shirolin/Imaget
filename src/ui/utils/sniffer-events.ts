export const IMAGET_REOPEN = "IMAGET_REOPEN";
export const FOLLOW_SCAN_START = "FOLLOW_SCAN_START";
export const FOLLOW_SCAN_STOP = "FOLLOW_SCAN_STOP";
export const FOLLOW_SCAN_PAUSE = "FOLLOW_SCAN_PAUSE";
export const FOLLOW_SCAN_RESUME = "FOLLOW_SCAN_RESUME";
export const FOLLOW_SCAN_SCAN_NOW = "FOLLOW_SCAN_SCAN_NOW";
export const FOLLOW_SCAN_CANDIDATES = "FOLLOW_SCAN_CANDIDATES";

export function isImagetReopenMessage(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    "type" in data &&
    data.type === IMAGET_REOPEN
  );
}

export type FollowScanCommandType =
  | typeof FOLLOW_SCAN_START
  | typeof FOLLOW_SCAN_STOP
  | typeof FOLLOW_SCAN_PAUSE
  | typeof FOLLOW_SCAN_RESUME
  | typeof FOLLOW_SCAN_SCAN_NOW;
