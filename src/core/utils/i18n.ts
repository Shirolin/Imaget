import de from "../../locales/de";
import en from "../../locales/en";
import es from "../../locales/es";
import fr from "../../locales/fr";
import ja from "../../locales/ja";
import ko from "../../locales/ko";
import pt_BR from "../../locales/pt_BR";
import tr from "../../locales/tr";
import zh_CN from "../../locales/zh_CN";
import zh_TW from "../../locales/zh_TW";

const MESSAGES: Record<string, Record<string, { message: string }>> = {
  de: de as Record<string, { message: string }>,
  en: en as Record<string, { message: string }>,
  es: es as Record<string, { message: string }>,
  fr: fr as Record<string, { message: string }>,
  ja: ja as Record<string, { message: string }>,
  ko: ko as Record<string, { message: string }>,
  pt_BR: pt_BR as Record<string, { message: string }>,
  tr: tr as Record<string, { message: string }>,
  zh_CN: zh_CN as Record<string, { message: string }>,
  zh_TW: zh_TW as Record<string, { message: string }>,
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
  const lang = (forcedLocale || navigator.language || "en").toLowerCase();

  // Handle common variants
  if (lang.startsWith("zh")) {
    if (lang.includes("tw") || lang.includes("hk") || lang.includes("hant"))
      return "zh_TW";
    return "zh_CN";
  }

  if (lang.startsWith("pt")) {
    if (lang.includes("br")) return "pt_BR";
    return "pt_BR"; // Default to BR as per request
  }

  // Exact matches
  const supported = ["de", "en", "es", "fr", "ja", "ko", "tr"];
  for (const s of supported) {
    if (lang.startsWith(s)) return s;
  }

  return "en";
};

export const t = (
  key: string,
  substitutions?: string | string[],
  overrideLocale?: string,
): string => {
  let message = "";

  // 1. Try Chrome i18n API
  if (
    !forcedLocale &&
    !overrideLocale &&
    typeof chrome !== "undefined" &&
    chrome.i18n &&
    chrome.i18n.getMessage
  ) {
    message = chrome.i18n.getMessage(key, substitutions);
  }

  // 2. Fallback to dictionary
  if (!message) {
    const locale = overrideLocale || getLocale();
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
