import { useState, useEffect, useCallback } from "react";
import { type Settings, defaultSettings } from "../../types";
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

    const persist = () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.set({ imaget_settings: settings });
      } else {
        localStorage.setItem("imaget_settings", JSON.stringify(settings));
      }
    };

    const timer = setTimeout(persist, 500);
    return () => {
      clearTimeout(timer);
      // effect 清理时立即落盘（含卸载与 settings/loading 依赖变更），避免防抖窗口内修改丢失
      persist();
    };
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

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const sourceVal = (source as Record<string, unknown>)[key];
    if (sourceVal === undefined) continue;
    const targetVal = (target as Record<string, unknown>)[key];
    if (isObject(sourceVal) && isObject(targetVal)) {
      output[key] = mergeDeep(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  }
  return output as T;
}
