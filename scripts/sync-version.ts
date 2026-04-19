import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function syncVersion() {
  const pkgPath = path.join(root, "package.json");
  const manifestPath = path.join(root, "public/manifest.json");

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  if (manifest.version !== pkg.version) {
    manifest.version = pkg.version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`✅ [Sync] Updated manifest.json version to ${pkg.version}`);
  }
}

syncVersion();
