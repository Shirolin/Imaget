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

    // Listen for storage changes from other contexts (e.g. content script -> UI)
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
      ) => {
        if (areaName === "local" && changes.imaget_settings) {
          const newValue = changes.imaget_settings.newValue;
          if (newValue) {
            setSettings((prev) => {
              // Deep compare to avoid unnecessary re-renders if the value is the same
              const merged = mergeDeep(defaultSettings, newValue);
              if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
              return merged;
            });
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    } else {
      // For web environment (localStorage), we can listen to the 'storage' event
      const handleLocalStorageChange = (e: StorageEvent) => {
        if (e.key === "imaget_settings" && e.newValue) {
          setSettings((prev) => {
            const merged = mergeDeep(defaultSettings, JSON.parse(e.newValue!));
            if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
            return merged;
          });
        }
      };
      window.addEventListener("storage", handleLocalStorageChange);
      return () =>
        window.removeEventListener("storage", handleLocalStorageChange);
    }
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
