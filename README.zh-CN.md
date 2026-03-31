<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Icon" />

  <h1>Imaget</h1>
  <p>
    <b>智能图片嗅探与批量下载工具扩展</b>
  </p>

  <p>
    <a href="README.md">English</a> | 简体中文 | <a href="README.ja.md">日本語</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine" />
  </p>
</div>

---

## ✨ 核心亮点

Imaget 是一款功能强大的浏览器扩展，主要用于智能嗅探网页图片、深度扫描、图片过滤分类以及一键批量下载与格式转换。无论是搜集参考素材，还是整理网页图库，Imaget 都能为你提供极速流畅的操作体验。

#### 🔍 智能嗅探与高级过滤
- **全方位嗅探**: 支持识别网页中所有的图片元素，包括隐藏的 `iframe` 以及 CSS 背景图片 (`Background Images`)。
- **深度扫描 (Deep Scan)**: 提供更深度的页面解析机制，能突破常见的懒加载限制抓取真实图片源。
- **多维度筛选**: 支持按 **最小宽度 / 高度**、**图片类型 (格式)**、**图片宽高比 (横图/竖图/方形)** 进行快速筛选分类。
- **精确搜索与排除**: 支持通过关键词对图片链接或 `alt` 标签进行搜索，同时提供排除词 (空格分隔) 功能过滤无关素材。

#### ⚡ 快捷交互与极速下载
- **悬浮下载按钮**: 光标悬停即可在网页图片上显示 Imaget 的快捷下载按钮，实现真正的“预览即下载”体验，并附带直观的下载成功反馈机制。
- **右键菜单集成**: 提供强大的全局右键菜单，支持将网页图片快速导出为 **WebP、PNG、JPG** 格式，或者直接打开批量下载控制台。
- **内置相册级预览**: 在批量控制台即可使用高质量的图片预览组件，支持 **鼠标滚轮缩放**、**拖拽平移**、**旋转** 和 **1:1 原尺寸适配**。
- **批量与 ZIP 打包**: 选择一堆图片后，可以批量下载到本地，也可以选择 **打包为 ZIP** 以保持系统下载夹整洁。

#### ⚙️ 深度定制与格式处理
- **自定义命名引擎**: 支持利用变量 (如图片序号、原名称等) 定义自己的“子文件夹”以及“文件名模板”。
- **文件冲突策略**: 遇到同名文件时，可灵活选择 **自动重命名 (Uniquify)**、**直接覆盖 (Overwrite)** 或 **每次询问 (Prompt)**。
- **格式与画质转换**: 内置强大的前端图片处理逻辑，支持下载时强行改变输出格式 (JPG/PNG/WebP)，并且支持 **调整转换质量**。
- **GIF 专属处理**: 对于动态 GIF 图像，可以选择 **保留原动图**、**提取第一帧** 或 **整体忽略跳过**。

---

## 📦 安装指南

### 从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 在 Chrome 中加载
# 1. 打开 chrome://extensions/
# 2. 启用 “开发者模式”
# 3. 点击 “加载已解压的扩展程序” 并选择 `dist` 目录。
```

### 打包与发布

- `npm run build`: 构建生产版本并自动在 `releases/` 目录下生成 ZIP 打包文件。
- `npm run release`: 使用 `bumpp` 自动更新版本号、提交 Git Tag，并触发本地构建。

当推送 `v*` 格式的标签到 GitHub 时，将自动触发 [Release 工作流](.github/workflows/release.yml) 并发布新版本。

## 🛠️ 技术栈

- **核心**: [React 19](https://react.dev/) + TypeScript
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 框架**: [Mantine v8](https://mantine.dev/)
- **样式**: Vanilla CSS & Shadow DOM 隔离。
- **图标**: [Tabler Icons](https://tabler-icons.io/)

## 🤝 支持

- **爱发电**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

## 📄 开源协议

本项目基于 [GPL-3.0](./LICENSE) 协议开源 © 2026 shirolin
