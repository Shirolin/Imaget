import { describe, expect, it } from "vitest";
import {
  applyTargetFormat,
  getSnifferSettings,
  getSnifferSettingsKey,
  isDomainDisabled,
} from "../utils/settings-policy";
import { defaultSettings, type Settings } from "../../types";

describe("settings policy helpers", () => {
  it("applies a context menu target format without mutating base settings", () => {
    const next = applyTargetFormat(defaultSettings, "webp");

    expect(next.downloadLogic.targetFormat).toBe("webp");
    expect(defaultSettings.downloadLogic.targetFormat).toBe("original");
  });

  it("ignores unsupported context menu target formats", () => {
    const next = applyTargetFormat(defaultSettings, "exe");

    expect(next.downloadLogic.targetFormat).toBe("original");
  });

  it("matches disabled domains against the current host and subdomains", () => {
    expect(
      isDomainDisabled("https://images.example.com/gallery", ["example.com"]),
    ).toBe(true);
    expect(
      isDomainDisabled("https://notexample.com/gallery", ["example.com"]),
    ).toBe(false);
  });

  it("uses a bounded default download concurrency", () => {
    expect(defaultSettings.downloadControl.maxConcurrency).toBe(5);
  });

  it("keeps the sniffer settings key stable when unrelated settings change", () => {
    const baseKey = getSnifferSettingsKey(defaultSettings);
    const changed: Settings = {
      ...defaultSettings,
      general: {
        ...defaultSettings.general,
        language: "ja",
      },
      fileSaving: {
        ...defaultSettings.fileSaving,
        subfolder: "Changed/{date}",
      },
    };

    expect(getSnifferSettingsKey(changed)).toBe(baseKey);
  });

  it("changes the sniffer settings key when DOM extraction settings change", () => {
    const changed = {
      ...defaultSettings,
      interfaceBehavior: {
        ...defaultSettings.interfaceBehavior,
        identifyBackgroundImages:
          !defaultSettings.interfaceBehavior.identifyBackgroundImages,
      },
    };

    expect(getSnifferSettingsKey(changed)).not.toBe(
      getSnifferSettingsKey(defaultSettings),
    );
  });

  it("normalizes disabled domains in the sniffer settings key", () => {
    const first = {
      ...defaultSettings,
      interfaceBehavior: {
        ...defaultSettings.interfaceBehavior,
        disabledDomains: [" Example.com ", "CDN.EXAMPLE.com", ""],
      },
    };
    const second = {
      ...defaultSettings,
      interfaceBehavior: {
        ...defaultSettings.interfaceBehavior,
        disabledDomains: ["cdn.example.com", "example.com"],
      },
    };

    expect(getSnifferSettingsKey(first)).toBe(getSnifferSettingsKey(second));
  });

  it("projects only the settings needed by the sniffer", () => {
    const projected = getSnifferSettings(defaultSettings);

    expect(projected.interfaceBehavior.searchAllFrames).toBe(
      defaultSettings.interfaceBehavior.searchAllFrames,
    );
    expect(projected.interfaceBehavior.identifyBackgroundImages).toBe(
      defaultSettings.interfaceBehavior.identifyBackgroundImages,
    );
    expect(projected.interfaceBehavior.identifyBlobImages).toBe(
      defaultSettings.interfaceBehavior.identifyBlobImages,
    );
    expect(projected.interfaceBehavior.disabledDomains).toEqual(
      defaultSettings.interfaceBehavior.disabledDomains,
    );
  });

  it("enables follow scan by default but keeps it out of sniffer settings", () => {
    expect(defaultSettings.interfaceBehavior.followScanEnabled).toBe(true);
    expect(
      "followScanEnabled" in
        getSnifferSettings(defaultSettings).interfaceBehavior,
    ).toBe(false);
  });
});
