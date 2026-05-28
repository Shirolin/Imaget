interface RollingScanFollowSessionInput {
  hasActiveSession: boolean;
  followScanEnabled: boolean;
}

interface RollingScanFollowSessionPolicy {
  startSession: boolean;
  stopAfterScan: boolean;
}

export function getRollingScanFollowSessionPolicy({
  hasActiveSession,
  followScanEnabled,
}: RollingScanFollowSessionInput): RollingScanFollowSessionPolicy {
  if (hasActiveSession) {
    return {
      startSession: false,
      stopAfterScan: false,
    };
  }

  return {
    startSession: true,
    stopAfterScan: !followScanEnabled,
  };
}
