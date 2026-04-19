<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Imaget Icon" />

  <h1>Imaget</h1>
  <p>
    <b>次世代のスマート画像スニッファー＆一括ダウンローダー</b>
  </p>

  <p>
    <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | 日本語
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine v8" />
    <img src="https://img.shields.io/badge/i18n-10%20Languages-green?style=flat-square" alt="i18n Support" />
  </p>
</div>

---

## 🚀 概要

**Imaget** は、モダンなウェブサイトから画像アセットを正確かつ簡単に取得するために設計された、プロフェッショナル仕様のブラウザ拡張機能です。インスピレーションを収集するデザイナーから、データを整理する研究者まで、Imaget は画像の検出、フィルタリング、変換、一括ダウンロードを支援する強力なツールキットを提供します。

**React 19** と **Mantine v8** で構築され、**Shadow DOM** による隔離アーキテクチャを採用しています。これにより、元のウェブサイトのスタイルと干渉することなく、あらゆるページで完璧な UI 表示を実現します。

---

## ✨ 主な機能

#### 🔍 高性能スニッフィングエンジン
- **Shadow DOM 貫通**: 複雑なウェブコンポーネントの深部まで解析し、隠れた画像アセットを発見します。
- **あらゆる形式に対応**: `<img>`、`srcset`、CSS `background-image`、インライン SVG、Canvas を自動識別。
- **ディープスキャンモード**: 自動スクロールと DOM 再帰解析により、遅延読み込み（Lazy-load）の制限を回避し、高解像度のオリジナル画像を取得。
- **メタデータの事前プレビュー**: ダウンロード前に解像度、アスペクト比、推定ファイルサイズをリアルタイムで確認可能。

#### 🛠️ プロフェッショナルなフィルタリング
- **多次元フィルタ**: **最小解像度**、**アスペクト比**（正方形、横長、縦長）、**ファイル形式**で瞬時に絞り込み。
- **スマートロジック**: 解像度の `AND/OR` 条件による高度なマッチングをサポート。
- **キーワード検索**: URL や Alt タグに基づくキーワード検索および除外フィルタリングが可能。

#### ⚡ 洗練されたワークフロー
- **ギャラリー級のプレビュー**: **マウスホイールズーム**、**自由ドラッグ**、**回転**、**1:1 原寸表示**に対応した高品質プレビュー。
- **一括操作の強化**: 全選択および **Shift+Click** による範囲選択をサポートし、作業効率を最大化。
- **柔軟なエクスポート**: 個別ファイルとしての保存に加え、フォルダを整理するための **ZIP アーカイブ** 出力に対応。
- **オンザフライ変換**: ダウンロード時に **WebP** または **JPG** へ自動変換し、品質を調整可能。

#### 🌍 グローバル対応 ＆ アクセシビリティ
- **ネイティブ多言語対応**: 日本語を含む **10 言語** (日、中、英、韓、独、仏、西、葡、土) に完全対応。
- **A11y 第一主義**: 充実した ARIA タグとフルキーボードナビゲーションをサポート。
- **プライバシー保護**: すべての処理はローカルで完結。ユーザーデータの収集やクラウドへのアップロードは一切行いません。

---

## 🛠️ 技術スタック

- **フレームワーク**: [React 19](https://react.dev/) + TypeScript
- **デザインシステム**: [Mantine v8](https://mantine.dev/) (フルダークモード)
- **アーキテクチャ**: スタイル干渉をゼロにする Shadow DOM 技術。
- **ビルドツール**: [Vite](https://vitejs.dev/)
- **自動化**: GitHub Actions による自動リリースおよびドキュメント同期。

---

## 📦 開発とビルド

### 開発環境

```bash
# 1. リポジトリをクローン
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. 依存関係のインストール
npm install

# 3. 開発サーバーの起動（テストページ含む）
npm run dev

# 4. サンドボックスへのアクセス
# http://localhost:5173/ を開き、内蔵のフォトギャラリーテストページを確認します。
```

### ビルドとリリース

- `npm run build`: 本番用ビルドの生成と Manifest バージョンの自動同期。
- `npm run release`: `bumpp` によるセマンティックバージョニングの更新とビルド。
- **CI/CD**: `v*` 形式のタグを GitHub にプッシュすると、[自動リリースワークフロー](.github/workflows/release.yml) が実行されます。

---

## 🤝 サポートと貢献

Imaget がお役に立てましたら、開発者のサポートをご検討ください：

- **Afdian (爱发电)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

コントリビューションは大歓迎です！プルリクエストもお待ちしております。

---

## 📄 ライセンス

[GPL-3.0](./LICENSE) ライセンスの下で公開されています © 2026 shirolin.
