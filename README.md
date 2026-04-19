<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Imaget Icon" />

  <h1>Imaget</h1>
  <p>
    <b>Intelligent Image Sniffer & Batch Downloader for the Modern Web</b>
  </p>

  <p>
    English | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine v8" />
    <img src="https://img.shields.io/badge/i18n-10%20Languages-green?style=flat-square" alt="i18n Support" />
  </p>
</div>

---

## 🚀 Overview

**Imaget** is a professional-grade browser extension designed to capture web image assets with precision and ease. Whether you are a designer collecting inspiration or a researcher organizing data, Imaget provides an industrial-strength toolkit to sniff, filter, convert, and download images in bulk.

Built with **React 19** and **Mantine v8**, it features a sophisticated UI isolated within a **Shadow DOM**, ensuring perfect rendering on any website without style conflicts.

---

## ✨ Key Features

#### 🔍 Industrial Sniffing Engine
- **Shadow DOM Penetration**: Traverses deep into complex web components to find hidden assets.
- **Dynamic Resource Detection**: Identifies `<img>`, `srcset`, CSS `background-image`, and inline SVGs.
- **Deep Scan Mode**: Bypasses lazy-loading restrictions via automated scrolling and DOM analysis.
- **Advanced Metadata**: Real-time calculation of dimensions and file sizes before downloading.

#### 🛠️ Professional Filtering & Search
- **Multi-dimensional Filters**: Instantly filter by **Minimum Resolution**, **Aspect Ratio** (Square, Landscape, Portrait), and **File Format**.
- **Smart Logic**: Supports complex `AND/OR` resolution matching.
- **Precision Search**: Keyword-based search and exclusion filtering for URLs and Alt tags.

#### ⚡ Streamlined Workflow
- **Pill-style Command Bar**: A compact, efficient UI for rapid filtering without obstructing content.
- **Batch Operations**: One-click selection with **Shift+Click** support for range selection.
- **Flexible Export**: Download as individual files or a consolidated **ZIP archive**.
- **On-the-fly Conversion**: Auto-convert images to **WebP** or **JPG** with adjustable quality.

#### 🌍 Global & Accessible
- **Native Localization**: Fully localized in **10 languages** (EN, ZH, JA, KO, DE, FR, ES, PT, TR).
- **A11y First**: Full keyboard navigation support and ARIA-compliant components.
- **Privacy Centric**: 100% local processing. No data collection, no cloud uploads.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + TypeScript
- **Design System**: [Mantine v8](https://mantine.dev/) (Full Dark Mode)
- **Architecture**: Shadow DOM for zero-collision styling.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Automation**: GitHub Actions for automated release and documentation sync.

---

## 📦 Getting Started

### Development

```bash
# 1. Clone the repository
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. Install dependencies
npm install

# 3. Start dev server with Test Page
npm run dev

# 4. Access the Sandbox
# Open http://localhost:5173/ to view the Photography Gallery test page.
```

### Build & Release

- `npm run build`: Production build with automatic manifest version syncing.
- `npm run release`: Semantic versioning via `bumpp` and local build trigger.
- **CI/CD**: Push tags starting with `v*` to trigger the automated [GitHub Release Workflow](.github/workflows/release.yml).

---

## 🤝 Support & Contribution

If you find Imaget helpful, consider supporting the developer:

- **Afdian (爱发电)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

Licensed under the [GPL-3.0](./LICENSE) License © 2026 shirolin.
