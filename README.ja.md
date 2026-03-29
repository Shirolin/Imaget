<div align="center">
  <img src="public/icon-128.png" width="120" height="120" alt="Icon" />

  <h1>Imaget</h1>
  <p>
    <b>インテリジェントな画像スニッファー＆一括ダウンロード拡張機能</b>
  </p>

  <p>
    <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | 日本語
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Chrome%20Extension-important?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Mantine-v8-339af0?style=flat-square" alt="Mantine" />
  </p>
</div>

---

## ✨ 特徴

Imagetは、ウェブ画像の検索、ディープスキャン、フィルタリング、および一括ダウンロード（フォーマット変換対応）を行うための強力なブラウザ拡張機能です。リファレンス素材の収集やウェブギャラリーの整理に最適な、高速でスムーズな操作体験を提供します。

#### 🔍 スマートスニッフィングとフィルタリング
- **包括的なスニッフィング**: iframesやCSS背景画像を含む、ページ内のすべての画像を検出します。
- **ディープスキャン**: 遅延読み込みを回避して実際の画像ソースを取得する高度な解析機能を搭載。
- **多次元フィルタリング**: **最小幅/高さ**、**画像形式**、**アスペクト比**（横長/縦長/正方形）で素早く分类可能。
- **検索と除外**: URLやalt属性での検索に加え、除外キーワードによるフィルタリングもサポート。

#### ⚡ 高速な操作とダウンロード
- **フローティングボタン**: 画像ホバー時にダウンロードボタンを表示し、「見たその場で保存」できる直感的な体験を提供。
- **右クリックメニュー連携**: 画像を **WebP、PNG、JPG** として直接書き出したり、一括ダウンロード画面を開いたりできます。
- **アルバム級プレビュー**: **マウスホイールでのズーム**、**ドラッグ移動**、**回転**、**1:1表示** に対応した高品質プレビュー。
- **一括 & ZIP保存**: 選択した画像を一括ダウンロード、または **ZIP形式** にまとめてダウンロードフォルダを整理できます。

#### ⚙️ 高度なカスタマイズとフォーマット制御
- **命名エンジン**: 変数（インデックス、元の名称など）を使用して、サブフォルダやファイル名を自由に定義。
- **衝突防止戦略**: 同名ファイルがある場合、**自動リネーム**、**上書き**、或者 **毎回確認** から選択できます。
- **フォーマット変換**: ダウンロード時に出力形式を強制変更し、**画質（Quality）** を調整することが可能です。
- **GIF処理**: 動くGIF画像に対して、**そのまま保存**、**最初のフレームを抽出**、或者 **スキップ** する設定。

---

## 📦 インストール

### ソースコードからビルド

```bash
# 1. リポジトリをクローン
git clone https://github.com/Shirolin/New-Imaget.git
cd New-Imaget

# 2. 依存関係のインストール
npm install

# 3. ビルド
npm run build

# 4. Chrome に読み込む
# 1. chrome://extensions/ を開く
# 2. 「デベロッパー モード」を有効にする
# 3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` ディレクトリを選択します。
```

### ビルドとリリース

- `npm run build`: プロダクションビルドを作成し、`releases/` ディレクトリに ZIP ファイルを自動生成します。
- `npm run release`: `bumpp` を使用してバージョンを更新し、Git タグを付与してローカルビルドを実行します。

GitHub に `v*` 形式のタグがプッシュされると、[Release ワークフロー](.github/workflows/release.yml) が自動的にトリガーされ、新しいリリースが公開されます。

## 🛠️ 技術スタック

- **コア**: [React 19](https://react.dev/) + TypeScript
- **バンドラー**: [Vite](https://vitejs.dev/)
- **UI フレームワーク**: [Mantine v8](https://mantine.dev/)
- **スタイリング**: Vanilla CSS & Shadow DOM 隔離。
- **アイコン**: [Tabler Icons](https://tabler-icons.io/)

## 🤝 サポート

- **Afdian**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)

## 📄 ライセンス

このプロジェクトは [MIT](./LICENSE) ライセンスの下で公開されています © 2026 shirolin
