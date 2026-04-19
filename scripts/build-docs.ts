import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const template = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Imaget - Privacy Policy</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <style>
        body { padding: 40px 20px; max-width: 800px; margin: 0 auto; background: #0d1117; color: #c9d1d9; }
        h1, h2, h3 { color: #58a6ff; }
        pre { background: #161b22; padding: 15px; border-radius: 6px; }
        hr { border-color: #21262d; }
    </style>
</head>
<body>
    <main class="container">
        ${content}
    </main>
</body>
</html>
`;

function buildDocs() {
  const privacyMdPath = path.join(root, "docs/PRIVACY.md");
  const outputPath = path.join(root, "docs/index.html");

  if (!fs.existsSync(privacyMdPath)) {
    console.error("❌ PRIVACY.md not found!");
    return;
  }

  const content = fs.readFileSync(privacyMdPath, "utf-8");
  
  // 简单的 Markdown 转换 (仅针对此项目)
  const htmlContent = content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br>');

  fs.writeFileSync(outputPath, template(htmlContent));
  console.log("✅ [Docs] Generated docs/index.html for GitHub Pages.");
}

buildDocs();
