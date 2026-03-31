<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Icon" />

  <h1>Imaget</h1>
  <p>
    <b>Intelligent Image Sniffer & Batch Downloader Extension</b>
  </p>

  <p>
    English | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine" />
  </p>
</div>

---

## ✨ Highlights

Imaget is a powerful browser extension for sniffing web images, deep scanning, filtering, and one-click batch downloading with format conversion. It provides a smooth experience for collecting reference materials or organizing web galleries.

#### 🔍 Smart Sniff & Filter
- **Full Sniffing**: Detects all images in a page, including those inside `iframes` and CSS `Background Images`.
- **Deep Scan**: Advanced parsing mechanism to bypass common lazy-loading restrictions and fetch real image sources.
- **Multi-dimensional Filtering**: Quickly filter by **min width/height**, **image format**, and **aspect ratio** (landscape/portrait/square).
- **Precise Search**: Search by keywords in image URLs or `alt` tags, with support for exclusion keywords.

#### ⚡ Fast Interaction & Download
- **Floating Button**: Hover over an image to display a quick download button, enabling a "preview then download" experience with visual feedback.
- **ContextMenu Integration**: Global right-click menu support to export images as **WebP, PNG, or JPG**, or open the batch download console.
- **Album-level Preview**: High-quality preview component supporting **mouse wheel zoom**, **dragging**, **rotation**, and **1:1 original size fitting**.
- **Batch & ZIP**: Download images in bulk or pack them into a **ZIP archive** to keep your downloads folder organized.

#### ⚙️ Deep Customization & Format Control
- **Naming Engine**: Define your own subfolders and filename templates using variables like index and original name.
- **Conflict Strategy**: Choose between **Uniquify**, **Overwrite**, or **Prompt** when encountering files with the same name.
- **Format & Quality Conversion**: Built-in image processing logic to force change output format and **adjust conversion quality**.
- **GIF Handling**: Options to **keep original**, **extract first frame**, or **skip/ignore** dynamic GIF images.

---

## 📦 Installation

### Build from source

```bash
# 1. Clone repo
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. Install
npm install

# 3. Build
npm run build

# 4. Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the `dist` directory.
```

### Build & Release

- `npm run build`: Build production version and automatically generate a ZIP package in the `releases/` directory.
- `npm run release`: Use `bumpp` to automatically update the version number, commit Git Tag, and trigger local build.

When pushing tags in `v*` format to GitHub, the [Release Workflow](.github/workflows/release.yml) will be automatically triggered to publish a new version.

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/) + TypeScript
- **Bundler**: [Vite](https://vitejs.dev/)
- **UI Framework**: [Mantine v8](https://mantine.dev/)
- **Styling**: Vanilla CSS & Shadow DOM isolation.
- **Icons**: [Tabler Icons](https://tabler-icons.io/)

## 🤝 Support

- **Afdian**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

## 📄 License

This project is licensed under the [GPL-3.0](./LICENSE) License © 2026 shirolin
