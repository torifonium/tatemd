# TATEmd — 縦書き Markdown プレビュー（VSCode 拡張）

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/torifonium.tatemd-vscode?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=torifonium.tatemd-vscode)
[![Open VSX](https://img.shields.io/open-vsx/v/torifonium/tatemd-vscode?label=Open%20VSX)](https://open-vsx.org/extension/torifonium/tatemd-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/torifonium/tatemd/blob/main/LICENSE)

Markdown ファイルを **縦書き** でリアルタイムプレビューし、**絵巻 PDF（横長1枚）** として書き出せる VSCode 拡張です。
[tatemd](https://github.com/torifonium/tatemd) の変換コア（`renderToTypesettingHtml`）と縦書き CSS を直接再利用しています。

![縦書きプレビュー](https://raw.githubusercontent.com/torifonium/tatemd/main/vscode-extension/images/preview.png)

## 機能

- **縦書きプレビュー** — Markdown を和文組版の縦書き（`writing-mode: vertical-rl`・右から左）でレンダリング。エディタの編集に追従してリアルタイム更新（150ms デバウンス）。
- **本物の縦書き組版** — 禁則処理・英数字の整列・約物はブラウザネイティブ CSS に委譲。傍点（`*強調*`）や見出し・引用・リスト・水平線も縦書きで自然に表示。
- **絵巻 PDF 書き出し** — 本文を既定ブラウザで開き、そこから「PDF で保存」すると**横に長い一枚（絵巻物スタイル）**の PDF になる。文字は画像化せず選択可能。
- **Web 版と同じコア** — [tatemd](https://torifonium.github.io/tatemd/) の Web 版・CLI と同一の変換ロジック／CSS を共有。見た目が揃い、挙動も一貫。

## インストール

### VS Code Marketplace

1. 拡張ビュー（`Ctrl+Shift+X` / `Cmd+Shift+X`）を開く
2. 「TATEmd」で検索してインストール
   - または [Marketplace ページ](https://marketplace.visualstudio.com/items?itemName=torifonium.tatemd-vscode) からインストール

### Open VSX（VSCodium など）

[Open VSX のページ](https://open-vsx.org/extension/torifonium/tatemd-vscode) からインストール、または拡張ビューで「TATEmd」を検索してください。

### 手動インストール（.vsix）

[Releases](https://github.com/torifonium/tatemd/releases) から `.vsix` をダウンロードし、次のいずれかで導入します。

- 拡張ビュー右上の `...` →「VSIX からのインストール...」
- コマンドラインから:

  ```bash
  code --install-extension tatemd-vscode-<version>.vsix
  ```

## 使い方

1. Markdown ファイルをエディタで開く
2. 以下のいずれかの方法でプレビューを開く
   - コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から「TATEmd: 縦書きプレビューを開く」を実行
   - エディタ右上のタイトルバーアイコン（Markdown ファイルのみ表示）をクリック
3. エディタで編集するとプレビューが自動で更新されます（150ms デバウンス）
4. 絵巻 PDF として保存したい場合は「TATEmd: 絵巻 PDF を書き出す（横長1枚）」を実行

## 開発（ローカルビルド）

```bash
cd vscode-extension
npm install
npm run build      # out/extension.js と media/vertical.css を生成
npm run typecheck  # 型チェックのみ（出力なし）
```

### デバッグ起動（F5）

1. VSCode でリポジトリを開く
2. `vscode-extension/` ディレクトリを開いた状態で F5 キーを押す
3. 拡張開発ホストウィンドウが起動し、拡張が読み込まれる

あるいは `.vscode/launch.json` に以下を追加することで `vscode-extension/` から直接起動できます:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "拡張機能を実行",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: build"
    }
  ]
}
```

## 公開（メンテナ向け）

`ext-v*` タグ（例: `ext-v0.0.1`）を push すると、GitHub Actions
（`.github/workflows/publish-extension.yml`）が VS Code Marketplace と Open VSX の
両方へ公開します。手動実行（workflow_dispatch）も可能です。

## ライセンス

MIT — 詳細はリポジトリルートの [LICENSE](https://github.com/torifonium/tatemd/blob/main/LICENSE) を参照してください。
