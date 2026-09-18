/**
 * One-off helper: build a `sync` payload for the i18n toolchain.
 *
 * The toolchain flattens the nested `{ key: { message } }` locale format with
 * dots, so payload keys MUST be "<key>.message". Passing bare keys silently
 * replaces the `{ message }` wrapper and corrupts the locale file, so this
 * script builds the payload from the `en` baseline rather than by hand: the key
 * set is guaranteed to be exactly the baseline's, and any key missing from the
 * translation map is a hard error instead of a silent English fallback.
 *
 * Usage: npx tsx scripts/gen-locale-payload.mts <code>
 *
 * Reads the translation map from `tr-<code>.json` placed NEXT TO this script.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import en from "../src/locales/en.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");

type Baseline = Record<string, { message: string }>;

const baseline = en as unknown as Baseline;
const baselineKeys = Object.keys(baseline).sort();

const code = process.argv[2];
if (!code) {
  console.error("usage: gen-locale-payload.mts <code>");
  process.exit(1);
}

const translationPath = join(HERE, `tr-${code}.json`);
let translations: Record<string, string>;
try {
  translations = JSON.parse(readFileSync(translationPath, "utf8")) as Record<
    string,
    string
  >;
} catch (error) {
  console.error(`cannot read ${translationPath}: ${(error as Error).message}`);
  process.exit(1);
}

const missing = baselineKeys.filter(
  (key) => typeof translations[key] !== "string" || translations[key] === "",
);
if (missing.length > 0) {
  console.error(
    `tr-${code}.json is missing ${missing.length} key(s):\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}

const extra = Object.keys(translations).filter(
  (key) => !baselineKeys.includes(key),
);
if (extra.length > 0) {
  console.error(
    `tr-${code}.json has ${extra.length} unknown key(s):\n  ${extra.join("\n  ")}`,
  );
  process.exit(1);
}

const placeholdersOf = (text: string): string[] =>
  Array.from(text.matchAll(/\$(\d)/g), (match) => match[1]).sort();

const droppedPlaceholders: string[] = [];
for (const key of baselineKeys) {
  const expected = placeholdersOf(baseline[key].message);
  const actual = placeholdersOf(translations[key]);
  for (const placeholder of expected) {
    if (!actual.includes(placeholder)) {
      droppedPlaceholders.push(`${key} lost $${placeholder}`);
    }
  }
}
if (droppedPlaceholders.length > 0) {
  console.error(
    `placeholder regression:\n  ${droppedPlaceholders.join("\n  ")}`,
  );
  process.exit(1);
}

const payload: Record<string, string> = {};
for (const key of baselineKeys) {
  payload[`${key}.message`] = translations[key];
}

const outputPath = join(HERE, `${code}.json`);
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const keyCount = Object.keys(payload).length;
if (keyCount !== baselineKeys.length) {
  console.error(`key count mismatch: ${keyCount} vs ${baselineKeys.length}`);
  process.exit(1);
}

console.log(`wrote ${outputPath} with ${keyCount} keys`);
