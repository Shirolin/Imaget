import de from "../../locales/de";
import en from "../../locales/en";
import es from "../../locales/es";
import fr from "../../locales/fr";
import id from "../../locales/id";
import it from "../../locales/it";
import ja from "../../locales/ja";
import ko from "../../locales/ko";
import pt_BR from "../../locales/pt_BR";
import ru from "../../locales/ru";
import tr from "../../locales/tr";
import uk from "../../locales/uk";
import zh_CN from "../../locales/zh_CN";
import zh_TW from "../../locales/zh_TW";

const MESSAGES: Record<string, Record<string, { message: string }>> = {
  de: de as Record<string, { message: string }>,
  en: en as Record<string, { message: string }>,
  es: es as Record<string, { message: string }>,
  fr: fr as Record<string, { message: string }>,
  id: id as Record<string, { message: string }>,
  it: it as Record<string, { message: string }>,
  ja: ja as Record<string, { message: string }>,
  ko: ko as Record<string, { message: string }>,
  pt_BR: pt_BR as Record<string, { message: string }>,
  ru: ru as Record<string, { message: string }>,
  tr: tr as Record<string, { message: string }>,
  uk: uk as Record<string, { message: string }>,
  zh_CN: zh_CN as Record<string, { message: string }>,
  zh_TW: zh_TW as Record<string, { message: string }>,
};

/**
 * Single source of truth for the supported locales.
 *
 * Both the runtime dictionary lookup above and the browser-language detection
 * below derive from this list, and `src/entry/sidepanel.tsx` reuses
 * `resolveLocale` for its pre-paint detection. Adding a locale anywhere else
 * while forgetting it here silently falls back to English.
 */
export const SUPPORTED_LOCALES = [
  "de",
  "en",
  "es",
  "fr",
  "id",
  "it",
  "ja",
  "ko",
  "pt_BR",
  "ru",
  "tr",
  "uk",
  "zh_CN",
  "zh_TW",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Pre-computed match table, longest code first.
 *
 * Browser language tags use hyphens (`pt-BR`) while our locale codes use
 * underscores (`pt_BR`), and the codes are mixed case, so both sides are
 * normalised before comparison. Sorting longest-first means a region-coded
 * entry can never be shadowed by a shorter prefix that happens to sort earlier.
 */
const LOCALE_MATCHERS = SUPPORTED_LOCALES.map((code) => ({
  code,
  needle: code.toLowerCase().replace(/_/g, "-"),
})).sort((a, b) => b.needle.length - a.needle.length);

/**
 * Resolve an arbitrary BCP-47 language tag to a supported locale code.
 *
 * Chinese and Portuguese are handled before the generic table because their
 * region variants map onto distinct locale files rather than a shared primary
 * subtag. New variants (e.g. `zh_HK`, `pt_PT`) must be added HERE — the table
 * below only ever matches on a primary subtag prefix.
 */
export const resolveLocale = (rawLang: string): SupportedLocale => {
  const tag = (rawLang || "en").toLowerCase().replace(/_/g, "-");

  if (tag.startsWith("zh")) {
    if (
      tag.includes("tw") ||
      tag.includes("hk") ||
      tag.includes("hant") ||
      tag.includes("traditional")
    ) {
      return "zh_TW";
    }
    return "zh_CN";
  }

  if (tag.startsWith("pt")) {
    return "pt_BR"; // Default to BR as per request
  }

  for (const { code, needle } of LOCALE_MATCHERS) {
    if (tag.startsWith(needle)) return code;
  }

  return "en";
};

let forcedLocale: string | null = null;

type LocaleListener = (locale: SupportedLocale) => void;
const localeListeners = new Set<LocaleListener>();

/**
 * Subscribe to locale changes so host-adaptation layers (entries) can react
 * without the UI querying the host document. Returns an unsubscribe function.
 */
export const onLocaleChange = (listener: LocaleListener): (() => void) => {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
};

export const setLocale = (locale: string) => {
  const next = !locale || locale === "auto" ? null : locale;
  if (next === forcedLocale) return;
  forcedLocale = next;
  const resolved = getLocale();
  for (const listener of localeListeners) listener(resolved);
};

export const getLocale = () =>
  resolveLocale(forcedLocale || navigator.language || "en");

export const t = (
  key: string,
  substitutions?: string | string[],
  overrideLocale?: string,
): string => {
  const locale = overrideLocale || getLocale();
  const table = MESSAGES[locale] || MESSAGES.en;
  const entry = table[key] || MESSAGES.en[key];

  if (entry) {
    let message = entry.message;
    if (substitutions) {
      const subs = Array.isArray(substitutions)
        ? substitutions
        : [substitutions];
      subs.forEach((sub, index) => {
        message = message.replace(`$${index + 1}`, sub);
      });
    }
    return message;
  }

  return key;
};
