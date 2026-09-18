import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SUPPORTED_LOCALES, resolveLocale } from "../i18n";
import {
  EN_FONT_STACK,
  ZH_CN_FONT_STACK,
  ZH_TW_FONT_STACK,
  JA_FONT_STACK,
  KO_FONT_STACK,
  getFontStackByLocale,
} from "../../../ui/theme";
import type { Settings } from "../../../types";

/**
 * Guard tests for the two parallel locale asset trees.
 *
 * Rationale: every failure mode in this file is SILENT at runtime. A locale that
 * is added to disk but not registered falls back to English with no error; a
 * locale missing from `.i18n-skill.json` is skipped by the toolchain while
 * `audit --lang all` still reports success. These assertions convert those
 * silent failures into loud ones.
 */

type Messages = Record<string, { message: string }>;

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "../../../..");
const SRC_LOCALES_DIR = join(PROJECT_ROOT, "src", "locales");
const CHROME_LOCALES_DIR = join(PROJECT_ROOT, "public", "_locales");
const I18N_CONFIG_PATH = join(PROJECT_ROOT, ".i18n-skill.json");

const localeModules = import.meta.glob<{ default: Messages }>(
  "../../../locales/*.ts",
  { eager: true },
);

const loadedLocales: Record<string, Messages> = {};
for (const [path, mod] of Object.entries(localeModules)) {
  const code = path.split("/").pop()!.replace(/\.ts$/, "");
  loadedLocales[code] = mod.default;
}

const fileLocaleCodes = readdirSync(SRC_LOCALES_DIR)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => name.replace(/\.ts$/, ""))
  .sort();

const supportedLocales = [...SUPPORTED_LOCALES].sort();

// Returns a SORTED ARRAY, not a Set: duplicates matter. `t()` substitutes with
// String.prototype.replace, which only replaces the FIRST occurrence of each
// `$n`, so a message that repeats a placeholder would render the later ones
// literally.
const placeholdersOf = (text: string): string[] =>
  Array.from(text.matchAll(/\$(\d)/g), (match) => match[1]).sort();

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8"));

describe("i18n coverage guards", () => {
  it("registers exactly the locale modules that exist on disk", () => {
    expect(supportedLocales).toEqual(fileLocaleCodes);
  });

  it("exposes every registered locale as a loadable module", () => {
    expect(Object.keys(loadedLocales).sort()).toEqual(supportedLocales);
  });

  it("keeps every locale key set identical to the en baseline", () => {
    const baseline = Object.keys(loadedLocales.en ?? {}).sort();
    expect(baseline.length).toBeGreaterThan(0);
    for (const code of supportedLocales) {
      const keys = Object.keys(loadedLocales[code] ?? {}).sort();
      expect(keys, `locale "${code}" key set drifted from en`).toEqual(
        baseline,
      );
    }
  });

  it("keeps every entry wrapped as { message: string }", () => {
    for (const code of supportedLocales) {
      for (const [key, entry] of Object.entries(loadedLocales[code] ?? {})) {
        const message = (entry as { message?: unknown }).message;
        expect(
          typeof message,
          `${code}.${key} is not wrapped as { message }`,
        ).toBe("string");
        expect(
          (message as string).length,
          `${code}.${key} has an empty message`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("keeps $n placeholders identical to the en baseline", () => {
    const baseline = loadedLocales.en ?? {};
    for (const code of supportedLocales) {
      for (const [key, entry] of Object.entries(loadedLocales[code] ?? {})) {
        const expected = placeholdersOf(baseline[key]?.message ?? "");
        const actual = placeholdersOf(entry.message);
        // Multiset equality: catches a dropped placeholder, an invented one
        // (would render a literal "$4"), and a duplicated one (only the first
        // occurrence gets substituted).
        expect(
          actual,
          `${code}.${key} placeholder mismatch (en has: ${expected.join(", ") || "none"})`,
        ).toEqual(expected);
      }
    }
  });

  it("keeps the chrome _locales tree in sync with src/locales", () => {
    const dirs = readdirSync(CHROME_LOCALES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(dirs).toEqual(supportedLocales);

    const baseline = Object.keys(
      readJson(join(CHROME_LOCALES_DIR, "en", "messages.json")) as Messages,
    ).sort();
    expect(baseline.length).toBeGreaterThan(0);

    for (const code of supportedLocales) {
      const messages = readJson(
        join(CHROME_LOCALES_DIR, code, "messages.json"),
      ) as Messages;
      expect(
        Object.keys(messages).sort(),
        `public/_locales/${code} key set drifted from en`,
      ).toEqual(baseline);
    }
  });

  it("registers every locale in the i18n toolchain config", () => {
    const config = readJson(I18N_CONFIG_PATH) as { enabled_langs?: string[] };
    const enabled = new Set(config.enabled_langs ?? []);
    const missing = supportedLocales.filter((code) => !enabled.has(code));
    expect(
      missing,
      `.i18n-skill.json enabled_langs is missing: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("gives cyrillic locales their own font stack", () => {
    const cjkStacks = [
      ZH_CN_FONT_STACK,
      ZH_TW_FONT_STACK,
      JA_FONT_STACK,
      KO_FONT_STACK,
    ];
    for (const code of ["ru", "uk"]) {
      const stack = getFontStackByLocale(code);
      expect(stack, `"${code}" must not fall back to the latin stack`).not.toBe(
        EN_FONT_STACK,
      );
      expect(cjkStacks, `"${code}" must not reuse a CJK stack`).not.toContain(
        stack,
      );
      expect(stack, `"${code}" stack needs a cyrillic-capable family`).toMatch(
        /Segoe UI|PT Sans|Noto Sans Cyrillic/,
      );
    }
  });

  it("round-trips every registered locale through its own code", () => {
    // Guards the matching table: browser tags use hyphens while locale codes use
    // underscores, so a naive `startsWith` comparison would leave every
    // region-coded entry (`pt_BR`, `zh_CN`, `zh_TW`) unreachable.
    for (const code of SUPPORTED_LOCALES) {
      expect(resolveLocale(code), `resolveLocale("${code}")`).toBe(code);
      expect(
        resolveLocale(code.replace(/_/g, "-")),
        `resolveLocale("${code.replace(/_/g, "-")}")`,
      ).toBe(code);
    }
  });

  it("resolves browser language tags to supported locales", () => {
    const cases: Array<[string, string]> = [
      ["uk", "uk"],
      ["uk-UA", "uk"],
      ["UK-ua", "uk"],
      ["ru", "ru"],
      ["ru-RU", "ru"],
      ["it-IT", "it"],
      ["id-ID", "id"],
      ["de-DE", "de"],
      ["es-419", "es"],
      ["pt-BR", "pt_BR"],
      ["pt-PT", "pt_BR"],
      ["pt_BR", "pt_BR"],
      ["zh-CN", "zh_CN"],
      ["zh_CN", "zh_CN"],
      ["zh-TW", "zh_TW"],
      ["zh-HK", "zh_TW"],
      ["zh-Hant", "zh_TW"],
      ["xx-YY", "en"],
      ["", "en"],
    ];
    for (const [input, expected] of cases) {
      expect(resolveLocale(input), `resolveLocale("${input}")`).toBe(expected);
    }
  });

  it("accepts the new codes in the settings union", () => {
    const codes: Settings["general"]["language"][] = ["uk", "ru", "it", "id"];
    expect(codes).toHaveLength(4);
  });
});
