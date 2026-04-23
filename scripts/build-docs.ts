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
    <title>Imaget - Powerful Web Image Sniffer & Batch Downloader</title>
    
    <!-- SEO & GEO Meta Tags -->
    <meta name="description" content="Imaget is a professional Chrome extension for sniffing and batch downloading images. Supports original resolution for Pixiv, Twitter (X), Weibo, Reddit, and more.">
    <meta name="keywords" content="image downloader, batch download, image sniffer, pixiv downloader, twitter image downloader, chrome extension, web scraping, original image">
    <meta name="author" content="Shirolin">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://shirolin.github.io/Imaget/">
    <meta property="og:title" content="Imaget - Intelligent Web Image Sniffer">
    <meta property="og:description" content="One-click batch image exploration and downloading with Side Panel integration. Built for speed and privacy.">
    <meta property="og:image" content="https://raw.githubusercontent.com/Shirolin/Imaget/main/public/icon-128.png">

    <!-- JSON-LD for GEO (Generative Engine Optimization) -->
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Imaget",
        "description": "Powerful web image sniffer and batch downloader with Side Panel integration. Supports high-resolution extraction for Pixiv, Twitter, and Weibo.",
        "operatingSystem": "Chrome, Edge, Brave",
        "applicationCategory": "MultimediaApplication",
        "license": "https://opensource.org/licenses/GPL-3.0",
        "softwareVersion": "1.0.0",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How do I download original images from Pixiv using Imaget?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Open Imaget's side panel on any Pixiv page. The extension's built-in resolver will automatically detect illustrations and map them to their original high-resolution source URLs for batch downloading."
            }
          },
          {
            "@type": "Question",
            "name": "Does Imaget protect my privacy?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Imaget performs all image sniffing and processing locally in your browser. No user data, browsing history, or images are ever uploaded to any server."
            }
          }
        ]
      }
    ]
    </script>

    <link rel="icon" href="https://raw.githubusercontent.com/Shirolin/Imaget/main/public/favicon.svg" type="image/svg+xml">
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
            --radius: 12px;
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
            max-width: 1100px;
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
            padding: 120px 0 80px;
            text-align: center;
        }
        .hero h1 {
            font-size: 56px;
            font-weight: 800;
            color: var(--text-bright);
            margin-bottom: 16px;
            letter-spacing: -0.03em;
            background: linear-gradient(to bottom right, #fff, #999);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 20px;
            max-width: 650px;
            margin: 0 auto 40px;
            color: var(--text-color);
        }
        .cta-button {
            display: inline-block;
            background-color: var(--primary-color);
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(51, 154, 240, 0.3);
        }
        .cta-button:hover {
            transform: translateY(-2px);
            background-color: #228be6;
            box-shadow: 0 6px 20px rgba(51, 154, 240, 0.4);
        }

        /* --- Feature Rows --- */
        .feature-rows-container {
            padding: 40px 0;
        }
        .feature-row {
            padding: 100px 0;
            display: flex;
            align-items: center;
            gap: 80px;
        }
        .feature-row:nth-of-type(even) {
            flex-direction: row-reverse;
        }

        .feature-image {
            flex: 1.4;
            background: var(--surface-color);
            padding: 10px;
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        .feature-image::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
            pointer-events: none;
        }
        .feature-image:hover {
            transform: scale(1.03) translateY(-5px);
        }
        .feature-image img {
            width: 100%;
            height: auto;
            border-radius: 6px;
            display: block;
        }
        
        .feature-info {
            flex: 1;
        }
        .feature-info h3 {
            color: var(--text-bright);
            font-size: 32px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: -0.01em;
        }
        .feature-info p {
            font-size: 17px;
            line-height: 1.8;
            margin: 0;
        }

        /* --- FAQ Section --- */
        .faq-section {
            padding: 100px 0;
            border-top: 1px solid var(--border-color);
        }
        .faq-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 40px;
            margin-top: 40px;
        }
        .faq-item h4 {
            color: var(--text-bright);
            font-size: 18px;
            margin-bottom: 12px;
        }
        .faq-item p {
            font-size: 15px;
            margin: 0;
        }

        /* --- Features Grid (Bottom) --- */
        .features-grid {
            padding: 100px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 32px;
            border-top: 1px solid var(--border-color);
        }
        .feature-card {
            background: var(--surface-color);
            padding: 40px;
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            transition: border-color 0.2s;
        }
        .feature-card:hover { border-color: var(--primary-color); }
        .feature-card h3 { color: var(--text-bright); margin-top: 0; font-size: 22px; margin-bottom: 12px; }
        .feature-card p { margin-bottom: 0; font-size: 16px; }

        /* --- Privacy --- */
        .privacy-section {
            padding: 100px 0;
            border-top: 1px solid var(--border-color);
        }
        .privacy-content {
            background: var(--surface-color);
            padding: 50px;
            border-radius: var(--radius);
            font-size: 15px;
            max-width: 900px;
            margin: 0 auto;
        }
        .privacy-content h1, .privacy-content h2 { color: var(--text-bright); margin-top: 32px; }
        .privacy-content h1:first-child { margin-top: 0; }
        .privacy-content strong { color: var(--primary-color); }

        footer {
            padding: 60px 0;
            text-align: center;
            border-top: 1px solid var(--border-color);
            font-size: 14px;
            opacity: 0.6;
        }

        @media (max-width: 900px) {
            .hero h1 { font-size: 40px; }
            .feature-row, .feature-row:nth-of-type(even) { 
                flex-direction: column !important; 
                text-align: center;
                gap: 40px;
                padding: 60px 0;
            }
            .feature-image { width: 100%; max-width: 600px; }
            .faq-grid { grid-template-columns: 1fr; }
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
                <a href="#faq">FAQ</a>
                <a href="#privacy">Privacy</a>
            </nav>
        </header>

        <section class="hero">
            <h1>Powerful Image Sniffing</h1>
            <p>The modern browser extension for batch image exploration and downloading. Built with React 19 and Mantine v8 for speed, privacy, and precision.</p>
            <a href="https://github.com/Shirolin/Imaget/releases" class="cta-button">Download Extension</a>
        </section>

        <div class="feature-rows-container">
            <div class="feature-row">
                <div class="feature-image">
                    <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/Imaget-Quick-DL.gif" alt="Quick Download Demo">
                </div>
                <div class="feature-info">
                    <h3>Seamless Extraction</h3>
                    <p>Use the <strong>Side Panel</strong> to browse images without leaving your tab. Our <strong>Quick-Extract Floating Buttons</strong> allow you to capture images from any corner of the page instantly.</p>
                </div>
            </div>

            <div class="feature-row">
                <div class="feature-image">
                    <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/图片列表-截图.png" alt="Gallery View">
                </div>
                <div class="feature-info">
                    <h3>Organized Gallery View</h3>
                    <p>Experience a high-performance grid layout that handles thousands of images effortlessly. Get real-time previews of resolutions, file types, and metadata at a glance.</p>
                </div>
            </div>

            <div class="feature-row">
                <div class="feature-image">
                    <img src="https://raw.githubusercontent.com/Shirolin/Imaget/main/marketing/screenshots/设置页面-截图.png" alt="Settings View">
                </div>
                <div class="feature-info">
                    <h3>Powerful Customization</h3>
                    <p>Tailor the extension to your workflow. Configure auto-conversion rules (WebP/JPG), set extraction depths, and manage download sub-directories with precision.</p>
                </div>
            </div>
        </div>

        <section id="faq" class="faq-section">
            <h2 style="color: var(--text-bright); text-align: center; font-size: 32px;">Common Questions</h2>
            <div class="faq-grid">
                <div class="faq-item">
                    <h4>Which platforms are supported?</h4>
                    <p>Imaget includes built-in adapters for <strong>Pixiv, Twitter (X), Weibo, Reddit, and Telegram</strong>, allowing you to fetch original high-resolution images that are otherwise hidden.</p>
                </div>
                <div class="faq-item">
                    <h4>Is it free and open-source?</h4>
                    <p>Yes. Imaget is fully open-source under the GPL-3.0 license. You can audit the source code on our GitHub repository anytime.</p>
                </div>
                <div class="faq-item">
                    <h4>How does it handle my data?</h4>
                    <p>Imaget follows a <strong>Privacy-First</strong> philosophy. All sniffing, filtering, and processing happen locally in your browser. We never collect or transmit your browsing history.</p>
                </div>
                <div class="faq-item">
                    <h4>Can I filter images by size?</h4>
                    <p>Absolutely. Imaget provides an intelligent filtering system where you can set minimum width, height, or specific file formats like WebP and SVG in real-time.</p>
                </div>
            </div>
        </section>

        <section class="features-grid">
            <div class="feature-card">
                <h3>🔍 Smart Sniffing</h3>
                <p>Traverses Shadow DOM and iframes to find every image asset.</p>
            </div>
            <div class="feature-card">
                <h3>⚡ Manifest V3</h3>
                <p>Fully compliant with the latest Chrome extension standards for better security.</p>
            </div>
            <div class="feature-card">
                <h3>🛡️ 100% Local</h3>
                <p>No account required. No cloud processing. Your data stays yours.</p>
            </div>
        </section>

        <section id="privacy" class="privacy-section">
            <h2 style="color: var(--text-bright); margin-bottom: 32px; text-align: center; font-size: 32px;">Privacy Policy</h2>
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
  
  const htmlContent = content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br>');

  fs.writeFileSync(outputPath, template(htmlContent));
  console.log("✅ [Docs] Refined Landing Page with GEO & AI Optimization.");
}

buildDocs();
