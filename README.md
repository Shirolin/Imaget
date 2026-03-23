<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Icon" />

  <h1>Imaget</h1>
  <p>
    <b>智能图片嗅探与批量下载工具扩展</b><br/>
    <b>Intelligent Image Sniffer & Batch Downloader Extension</b><br/>
    <b>インテリジェントな画像スニッファー＆一括ダウンロード拡張機能</b>
  </p>

  <p>
    <a href="#-简体中文">简体中文</a> | <a href="#-english">English</a> | <a href="#-日本語">日本語</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine" />
  </p>
</div>

---

## 🇨🇳 简体中文

### ✨ 核心亮点

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

## 🇺🇸 English

### ✨ Highlights

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

## 🇯🇵 日本語

### ✨ 特徴

Imagetは、ウェブ画像の検索、ディープスキャン、フィルタリング、および一括ダウンロード（フォーマット変換対応）を行うための強力なブラウザ拡張機能です。リファレンス素材の収集やウェブギャラリーの整理に最適な、高速でスムーズな操作体験を提供します。

#### 🔍 スマートスニッフィングとフィルタリング
- **包括的なスニッフィング**: iframesやCSS背景画像を含む、ページ内のすべての画像を検出します。
- **ディープスキャン**: 遅延読み込みを回避して実際の画像ソースを取得する高度な解析機能を搭載。
- **多次元フィルタリング**: **最小幅/高さ**、**画像形式**、**アスペクト比**（横長/縦長/正方形）で素早く分類可能。
- **検索と除外**: URLやalt属性での検索に加え、除外キーワードによるフィルタリングもサポート。

#### ⚡ 高速な操作とダウンロード
- **フローティングボタン**: 画像ホバー時にダウンロードボタンを表示し、「見たその場で保存」できる直感的な体験を提供。
- **右クリックメニュー連携**: 画像を **WebP、PNG、JPG** として直接書き出したり、一括ダウンロード画面を開いたりできます。
- **アルバム級プレビュー**: **マウスホイールでのズーム**、**ドラッグ移動**、**回転**、**1:1表示** に対応した高品質プレビュー。
- **一括 & ZIP保存**: 選択した画像を一括ダウンロード、または **ZIP形式** にまとめてダウンロードフォルダを整理できます。

#### ⚙️ 高度なカスタマイズとフォーマット制御
- **命名エンジン**: 変数（インデックス、元の名称など）を使用して、サブフォルダやファイル名を自由に定義。
- **衝突防止戦略**: 同名ファイルがある場合、**自動リネーム**、**上書き**、または **毎回確認** から選択できます。
- **フォーマット変換**: ダウンロード時に出力形式を強制変更し、**画質（Quality）** を調整することが可能です。
- **GIF処理**: 動くGIF画像に対して、**そのまま保存**、**最初のフレームを抽出**、または **スキップ** する設定。

---

## 📦 Installation (安装指南)

### Build from source (从源码构建)

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

## 🛠️ Tech Stack (技术栈)

- **Core**: [React 19](https://react.dev/) + TypeScript
- **Bundler**: [Vite](https://vitejs.dev/)
- **UI Framework**: [Mantine v8](https://mantine.dev/)
- **Styling**: Vanilla CSS & Shadow DOM isolation.
- **Icons**: [Tabler Icons](https://tabler-icons.io/)

## 🤝 Support (支持)

- **Afdian**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

## 📄 License

[MIT](./LICENSE) License © 2026 shirolin
