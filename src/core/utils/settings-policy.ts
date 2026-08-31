import type { Settings } from "../../types";

const SUPPORTED_TARGET_FORMATS = new Set<
  Settings["downloadLogic"]["targetFormat"]
>(["original", "webp", "png", "jpg", "avif", "bmp"]);

export function applyTargetFormat(
  settings: Settings,
  targetFormat: string,
): Settings {
  const normalized = targetFormat.toLowerCase();
  if (
    !SUPPORTED_TARGET_FORMATS.has(
      normalized as Settings["downloadLogic"]["targetFormat"],
    )
  ) {
    return settings;
  }

  return {
    ...settings,
    downloadLogic: {
      ...settings.downloadLogic,
      targetFormat: normalized as Settings["downloadLogic"]["targetFormat"],
    },
  };
}

export function isDomainDisabled(
  href: string,
  disabledDomains?: string[],
): boolean {
  if (!disabledDomains?.length) return false;

  let host = "";
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    host = href.toLowerCase();
  }
  if (!host) return false;

  return disabledDomains.some((entry) => {
    const normalized = normalizeDomainEntry(entry);
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

export interface SnifferSettings {
  interfaceBehavior: {
    disabledDomains?: string[];
    searchAllFrames: boolean;
    identifyBackgroundImages: boolean;
    identifyBlobImages: boolean;
  };
}

export function getSnifferSettings(settings: Settings): SnifferSettings {
  return {
    interfaceBehavior: {
      disabledDomains: settings.interfaceBehavior.disabledDomains,
      searchAllFrames: settings.interfaceBehavior.searchAllFrames,
      identifyBackgroundImages:
        settings.interfaceBehavior.identifyBackgroundImages,
      identifyBlobImages: settings.interfaceBehavior.identifyBlobImages,
    },
  };
}

export function getSnifferSettingsKey(settings: Settings): string {
  const projected = getSnifferSettings(settings);
  const disabledDomains = [
    ...(projected.interfaceBehavior.disabledDomains ?? []),
  ]
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .sort();

  return JSON.stringify({
    ...projected.interfaceBehavior,
    disabledDomains,
  });
}

function normalizeDomainEntry(entry: string): string {
  const trimmed = entry.trim().toLowerCase();
  if (!trimmed) return "";

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").split("/")[0];
  }
}
