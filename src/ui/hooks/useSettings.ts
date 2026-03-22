import { useState, useEffect, useCallback } from "react";
import { Settings, defaultSettings } from "../../types";
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        const result = await chrome.storage.local.get("imaget_settings");
        if (result.imaget_settings) {
          setSettings(mergeDeep(defaultSettings, result.imaget_settings));
        }
      } else {
        const saved = localStorage.getItem("imaget_settings");
        if (saved) {
          setSettings(mergeDeep(defaultSettings, JSON.parse(saved)));
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (loading) return;
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ imaget_settings: settings });
    } else {
      localStorage.setItem("imaget_settings", JSON.stringify(settings));
    }
  }, [settings, loading]);

  const updateSettings = useCallback(
    (newSettings: Partial<Settings> | ((prev: Settings) => Settings)) => {
      setSettings((prev) => {
        if (typeof newSettings === "function") {
          return newSettings(prev);
        }
        return mergeDeep(prev, newSettings);
      });
    },
    [],
  );

  const resetSettings = async () => {
    setSettings(defaultSettings);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      await chrome.storage.local.remove("imaget_settings");
    } else {
      localStorage.removeItem("imaget_settings");
    }
  };

  return { settings, updateSettings, resetSettings, loading };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeDeep(target: any, source: any): any {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}
