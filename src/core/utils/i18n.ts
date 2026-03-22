import en from "../../locales/en";
import zh from "../../locales/zh";

const MESSAGES: Record<string, Record<string, { message: string }>> = {
  en: en as Record<string, { message: string }>,
  zh: zh as Record<string, { message: string }>,
};

let forcedLocale: string | null = null;

export const setLocale = (locale: string) => {
  if (!locale || locale === "auto") {
    forcedLocale = null;
  } else {
    forcedLocale = locale;
  }
};

export const getLocale = () => {
  const locale = forcedLocale || "";
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("en")) return "en";

  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return "en";
};

export const t = (key: string, substitutions?: string | string[]): string => {
  let message = "";

  // 1. Try Chrome i18n API
  if (
    !forcedLocale &&
    typeof chrome !== "undefined" &&
    chrome.i18n &&
    chrome.i18n.getMessage
  ) {
    message = chrome.i18n.getMessage(key, substitutions);
  }

  // 2. Fallback to dictionary
  if (!message) {
    const locale = getLocale();
    const table = MESSAGES[locale] || MESSAGES.en;
    const entry = table[key] || MESSAGES.en[key];

    if (entry) {
      message = entry.message;
      if (substitutions) {
        const subs = Array.isArray(substitutions)
          ? substitutions
          : [substitutions];
        subs.forEach((sub, index) => {
          message = message.replace(`$${index + 1}`, sub);
        });
      }
    } else {
      message = key;
    }
  }

  return message;
};
