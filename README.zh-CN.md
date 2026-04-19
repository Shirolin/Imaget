<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Imaget Icon" />

  <h1>Imaget</h1>
  <p>
    <b>新一代智能图片嗅探与一键批量下载器</b>
  </p>

  <p>
    <a href="README.md">English</a> | 简体中文 | <a href="README.ja.md">日本語</a>
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

## 🚀 项目概述

**Imaget** 是一款专为现代 Web 设计的专业级浏览器扩展，旨在提供精准、流畅的网页图片资源采集体验。无论您是寻找灵感的设计师，还是整理资料的研究员，Imaget 都能提供工业级的工具链，助您完成图片的嗅探、筛选、转换与批量下载。

基于 **React 19** 和 **Mantine v8** 构建，采用 **Shadow DOM** 隔离架构，确保 UI 样式在任何网站上都能完美呈现，不受原网页样式干扰。

---

## ✨ 核心特性

#### 🔍 工业级嗅探引擎
- **Shadow DOM 穿透**：深入解析复杂的 Web Components，挖掘隐藏的图片资产。
- **全格式识别**：支持 `<img>`、`srcset`、CSS `background-image`、内联 SVG 以及 Canvas。
- **深度扫描模式**：通过自动化滚动和 DOM 递归分析，绕过懒加载限制，获取真实原图。
- **预检元数据**：下载前即可实时获取图片的分辨率、比例及预估文件大小。

#### 🛠️ 专业级过滤与搜索
- **多维度筛选**：支持按 **最小分辨率**、**宽高比**（正方形、横图、竖图）以及 **文件格式** 即时过滤。
- **智能匹配逻辑**：支持分辨率的 `且/或` 复杂逻辑匹配。
- **精准搜索**：支持对 URL 和 Alt 标签进行关键词检索及排除过滤。

#### ⚡ 极致的操作流
- **画廊级预览**：高品质预览组件，支持 **鼠标滚轮缩放**、**自由拖拽**、**旋转** 及 **1:1 像素对齐**。
- **批量操作增强**：支持一键全选及 **Shift+Click** 区间多选，极大地提升了筛选效率。
- **灵活导出**：支持直接下载为独立文件或打包为 **ZIP 压缩包**，保持下载目录整洁。
- **即时转换**：内置图片处理逻辑，支持在下载时自动转为 **WebP** 或 **JPG** 格式并调整质量。

#### 🌍 全球化与无障碍
- **原生多语言**：完整适配 **10 国语言** (中、英、日、韩、德、法、西、葡、土)。
- **A11y 优先**：完善的 ARIA 标签体系，支持全键盘导航操作。
- **隐私保护**：100% 本地处理，不收集任何用户数据，不进行云端上传。

---

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/) + TypeScript
- **设计系统**: [Mantine v8](https://mantine.dev/) (全深色模式)
- **架构**: Shadow DOM 样式隔离技术。
- **构建工具**: [Vite](https://vitejs.dev/)
- **自动化**: GitHub Actions 自动发布与文档同步体系。

---

## 📦 快速开始

### 开发环境

```bash
# 1. 克隆仓库
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. 安装依赖
npm install

# 3. 启动开发服务器（含测试页）
npm run dev

# 4. 访问沙盒
# 打开 http://localhost:5173/ 访问内置的高质量摄影画廊测试页。
```

### 构建与发布

- `npm run build`: 生成生产环境产物，并自动同步 Manifest 版本号。
- `npm run release`: 使用 `bumpp` 进行语义化版本更新并触发本地构建。
- **CI/CD**: 推送 `v*` 格式的标签至 GitHub 即可触发 [自动化发布流程](.github/workflows/release.yml)。

---

## 🤝 支持与贡献

如果您觉得 Imaget 对您有帮助，欢迎支持开发者：

- **爱发电 (Afdian)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

欢迎提交 Pull Request 参与贡献！

---

## 📄 开源协议

基于 [GPL-3.0](./LICENSE) 协议开源 © 2026 shirolin.
