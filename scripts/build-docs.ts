import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const template = (privacyContent: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Imaget - Intelligent Web Image Sniffer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #1A1B1E;
            --surface-color: #25262B;
            --primary-color: #339af0;
            --text-color: #C1C2C5;
            --text-bright: #FFFFFF;
            --border-color: #373A40;
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            scroll-behavior: smooth;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* --- Header --- */
        header {
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
            font-size: 20px;
            color: var(--text-bright);
            text-decoration: none;
        }
        .logo img { width: 32px; height: 32px; }

        nav a {
            margin-left: 24px;
            text-decoration: none;
            color: var(--text-color);
            font-size: 14px;
            font-weight: 600;
            transition: color 0.2s;
        }
        nav a:hover { color: var(--primary-color); }

        /* --- Hero --- */
        .hero {
            padding: 100px 0 60px;
            text-align: center;
        }
        .hero h1 {
            font-size: 48px;
            font-weight: 800;
            color: var(--text-bright);
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }
        .hero p {
            font-size: 20px;
            max-width: 600px;
            margin: 0 auto 32px;
            color: var(--text-color);
        }
        .cta-button {
            display: inline-block;
            background-color: var(--primary-color);
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            transition: transform 0.2s, background-color 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            background-color: #228be6;
        }

        /* --- Showcase --- */
        .showcase {
            padding: 60px 0;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 40px;
            align-items: center;
        }
        .showcase-media {
            background: var(--surface-color);
            padding: 12px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .showcase-media img {
            width: 100%;
            border-radius: 6px;
            display: block;
        }

        /* --- Features --- */
        .features {
            padding: 80px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }
        .feature-card {
            background: var(--surface-color);
            padding: 32px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        .feature-card h3 {
            color: var(--text-bright);
            margin-top: 0;
            font-size: 20px;
        }
        .feature-card p {
            margin-bottom: 0;
            font-size: 15px;
        }

        /* --- Privacy --- */
        .privacy-section {
            padding: 80px 0;
            border-top: 1px solid var(--border-color);
        }
        .privacy-content {
            background: var(--surface-color);
            padding: 40px;
            border-radius: 12px;
            font-size: 14px;
        }
        .privacy-content h1, .privacy-content h2 { color: var(--text-bright); }
        .privacy-content strong { color: var(--primary-color); }

        footer {
            padding: 40px 0;
            text-align: center;
            border-top: 1px solid var(--border-color);
            font-size: 13px;
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 32px; }
            .showcase { grid-template-columns: 1fr; }
            .hero { padding: 60px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="#" class="logo">
                <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/public/icon-128.png" alt="Logo">
                Imaget
            </a>
            <nav>
                <a href="https://github.com/Shirolin/Imaget">GitHub</a>
                <a href="#privacy">Privacy</a>
            </nav>
        </header>

        <section class="hero">
            <h1>Powerful Image Sniffing</h1>
            <p>The modern browser extension for batch image exploration and downloading. Built for speed, privacy, and precision.</p>
            <a href="https://github.com/Shirolin/Imaget/releases" class="cta-button">Download Extension</a>
        </section>

        <section class="showcase">
            <div class="showcase-media">
                <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/Imaget-Quick-DL.gif" alt="Quick Download Demo">
            </div>
            <div>
                <h2 style="color: var(--text-bright); font-size: 28px;">Seamless Extraction</h2>
                <p>Use the <strong>Side Panel</strong> to browse images without leaving your tab. Our <strong>Quick-Extract Floating Buttons</strong> allow you to capture images from any corner of the page instantly.</p>
                <p>Supports deep sniffing for <strong>Pixiv, Twitter, Weibo</strong>, and more.</p>
            </div>
        </section>

        <section class="screenshots-section">
            <h2 style="color: var(--text-bright); text-align: center; font-size: 32px;">Product Tour</h2>
            <div class="screenshots-grid">
                <div class="screenshot-item">
                    <div class="screenshot-wrapper">
                        <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/图片列表-截图.png" alt="Gallery View">
                    </div>
                    <h4>Organized Gallery</h4>
                    <p>Structured grid view with real-time resolution and metadata preview.</p>
                </div>
                <div class="screenshot-item">
                    <div class="screenshot-wrapper">
                        <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/设置页面-截图.png" alt="Settings View">
                    </div>
                    <h4>Full Control</h4>
                    <p>Customize extraction depth, auto-conversion formats, and saving paths.</p>
                </div>
                <div class="screenshot-item">
                    <div class="screenshot-wrapper">
                        <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/弹窗-截图.png" alt="Filter View">
                    </div>
                    <h4>Precision Filters</h4>
                    <p>Filter by dimensions, format, or name to find exactly what you need.</p>
                </div>
            </div>
        </section>

        <section class="features">
            <div class="feature-card">
                <h3>🔍 Smart Sniffing</h3>
                <p>Automatically detects high-res images, background assets, and hidden elements across any webpage.</p>
            </div>
            <div class="feature-card">
                <h3>⚡ Batch Process</h3>
                <p>Filter by dimensions, format, or name. Select hundreds of images and save them in one click.</p>
            </div>
            <div class="feature-card">
                <h3>🛡️ Privacy First</h3>
                <p>No tracking. No servers. All processing happens locally in your browser. Fully open-source.</p>
            </div>
        </section>

        <section id="privacy" class="privacy-section">
            <h2 style="color: var(--text-bright); margin-bottom: 24px;">Privacy Policy</h2>
            <div class="privacy-content">
                ${privacyContent}
            </div>
        </section>

        <footer>
            <p>&copy; 2026 Shirolin. Imaget is open-source under the GPL-3.0 License.</p>
        </footer>
    </div>
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
  console.log("✅ [Docs] Generated professional Landing Page in docs/index.html");
}

buildDocs();
