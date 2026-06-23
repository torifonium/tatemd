# TATEmd — 縦書き Markdown プレビュー（VSCode 拡張）

Markdown ファイルを縦書きでリアルタイムプレビューする VSCode 拡張です。
[tatemd](https://github.com/torifonium/tatemd) の変換コア（`renderToTypesettingHtml`）と縦書き CSS を直接再利用しています。

## 使い方

1. Markdown ファイルをエディタで開く
2. 以下のいずれかの方法でプレビューを開く
   - コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から「TATEmd: 縦書きプレビューを開く」を実行
   - エディタ右上のタイトルバーアイコン（Markdown ファイルのみ表示）をクリック
3. エディタで編集するとプレビューが自動で更新されます（150ms デバウンス）

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

## Marketplace 公開

現在は未公開です。公開する場合は `vsce package` でパッケージ化し、`vsce publish` で公開してください。

## ライセンス

MIT — 詳細はリポジトリルートの [LICENSE](../LICENSE) を参照してください。
