import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/**
 * docs/index.html and docs/privacy.html are hand-built pages that share assets/system.css.
 * The old generator rewrote index.html from a template string on every build, which would
 * overwrite the current design. This step now only verifies the pages ship with their assets.
 */
function buildDocs() {
  const pages = ["docs/index.html", "docs/privacy.html"];
  const missing = pages.filter((p) => !fs.existsSync(path.join(root, p)));

  if (missing.length) {
    console.error(`❌ [Docs] missing page: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  for (const p of pages) {
    const html = fs.readFileSync(path.join(root, p), "utf-8");
    if (/\[NEED\]|lorem ipsum/i.test(html)) {
      console.error(`❌ [Docs] placeholder left in ${p}`);
      process.exitCode = 1;
      return;
    }
  }

  console.log("✅ [Docs] index.html and privacy.html are hand-built; nothing to generate.");
}

buildDocs();
