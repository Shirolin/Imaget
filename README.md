<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Icon" />

  <h1>Imaget</h1>
  <p>
    <b>智能图片嗅探与批量下载工具扩展</b>
  </p>
  <p>
    <b>简体中文</b>
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine" />
  </p>
</div>

<br/>

## ✨ 核心亮点

Imaget 是一款功能强大的浏览器扩展，主要用于智能嗅探网页图片、深度扫描、图片过滤分类以及一键批量下载与格式转换。无论是搜集参考素材，还是整理网页图库，Imaget 都能为你提供极速流畅的操作体验。

### 🔍 智能嗅探与高级过滤 (Smart Sniff & Filter)

- **全方位嗅探**: 支持识别网页中所有的图片元素，包括隐藏的 `iframe` 以及 CSS 背景图片 (`Background Images`)。
- **深度扫描 (Deep Scan)**: 提供更深度的页面解析机制，能突破常见的懒加载限制抓取真实图片源。
- **多维度筛选**: 支持按 **最小宽度 / 高度**、**图片类型 (格式)**、**图片宽高比 (横图/竖图/方形)** 进行快速筛选分类。
- **精确搜索与排除**: 支持通过关键词对图片链接或 `alt` 标签进行搜索，同时提供排除词 (空格分隔) 功能过滤无关素材。

### ⚡ 快捷交互与极速下载 (Preview & Fast Download)

- **悬浮下载按钮**: 光标悬停即可在网页图片上显示 Imaget 的快捷下载按钮，实现真正的“预览即下载”体验，并附带直观的下载成功反馈机制。
- **右键菜单集成**: 提供强大的全局右键菜单，支持将网页图片快速导出为 **WebP、PNG、JPG** 格式，或者直接打开批量下载控制台。
- **内置相册级预览**: 在批量控制台即可使用高质量的图片预览组件，支持 **鼠标滚轮缩放**、**拖拽平移**、**旋转** 和 **1:1 原尺寸适配**。
- **批量与 ZIP 打包**: 选择一堆图片后，可以批量下载到本地，也可以选择**打包为 ZIP (打包下载)** 以保持系统下载夹整洁。

### ⚙️ 深度定制与格式处理 (Customization & Format Control)

- **自定义命名引擎**: 支持利用变量 (如图片序号、原名称等) 定义自己的“子文件夹”以及“文件名模板”。
- **文件冲突策略**: 遇到同名文件时，可灵活选择 **自动重命名 (Uniquify)**、**直接覆盖 (Overwrite)** 或 **每次询问 (Prompt)**。
- **格式与画质转换**: 内置强大的前端图片处理逻辑，支持下载时强行改变输出格式 (JPG/PNG/WebP)，并且支持**调整特定的转换质量**，平衡清晰度与体积大小。
- **GIF 专属处理**: 对于动态 GIF 图像，可以选择 **保留原动图**、**提取第一帧** 或 **整体忽略跳过**。

## 📦 安装指南

### 方法一：从源码构建与加载 (开发者)

本扩展基于现代前端技术栈开发，如果你想从源码编译安装：

```bash
# 1. 克隆代码仓库
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 在 Chrome 中加载扩展
# 打开 Chrome，访问 chrome://extensions/
# 开启右上角的“开发者模式”
# 点击左上角“加载已解压的扩展程序”，选择本项目构建出的 `dist` 目录。
```

> **注意：** 在纯网页开发环境 (如 `npm run dev`) 下，由于浏览器的安全机制，诸如**子目录保存**、**重命名解析**等核心扩展由于脱离了 Background 环境可能无法完整生效，请一定要打包并在 Chrome 扩展环境中进行真实体验。

## 🛠️ 技术栈

本项目坚持极致的现代化前端工程化实践：

- **核心框架**: [React 19](https://react.dev/) + TypeScript
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Mantine v8](https://mantine.dev/) (深度使用其暗色主题理念以及 Hooks)
- **CSS 方案**: Vanilla CSS 以及 Mantine Style Props，零外部混乱样式。特意采用 Shadow DOM 隔离机制防止网页样式污染。
- **图标驱动**: [Tabler Icons](https://tabler-icons.io/)

## 🤝 贡献与支持

欢迎提交 Issue 和 Pull Request 来优化下载逻辑或增加新的图片过滤特性！

如果这个工具极大提升了你的找图与素材搜集体验，欢迎请作者喝杯咖啡 ☕，以便持续提供热情的维护与支持：

- **爱发电 (Afdian)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

## 📄 许可证

[MIT](./LICENSE) License © 2026 shirolin
