# TATEmd への貢献ガイド

コントリビューションを歓迎します。バグ報告・機能提案・ドキュメント改善・コードの修正など、どんな形でも構いません。

---

## アーキテクチャを理解してから始める

TATEmd は **3 層分離** を設計の軸に置いています。変更を始める前にこの構造を把握してください。

```
core/      変換ロジック（DOM 非依存の純粋関数）
adapter/   UI 層（DOM・LocalStorage・印刷）
styles/    組版表現（縦書き CSS・印刷 CSS）
```

### `core/`（変換ロジック）

- **DOM 非依存の純粋関数のみ** を置く。`window` / `document` / `localStorage` には触れない。
- 入出力は文字列のみ（`string → string`）。
- Node でもブラウザでも動く純粋 TypeScript として保つ。これにより将来の npm 公開・VSCode 拡張・CLI への再利用が可能になる。
- **`core/` の変更にはユニットテストが必須**。Vitest で純粋関数として検証できる。
- 禁則処理・約物詰め・縦中横・ルビは `core` に実装しない（CSS 責務）。

### `adapter/`（UI 層）

- `core` の関数を呼び出し、結果を DOM に反映する。
- DOM・LocalStorage・`window.print()` を扱う唯一の層。
- `core` の出力（HTML 文字列）を `innerHTML` に代入する以外で DOM 操作ロジックを `core` に混ぜない。

### `styles/`（組版表現）

- 縦書き・禁則・英数字整列・均等割り付けなどの**組版ロジックはすべて CSS で表現する**。JS（`core`）で組版補正を自前実装しない。
- `vertical.css` と `print.css` は特定バンドラに依存しない素の CSS として保つ（将来の VSCode 拡張での再利用を考慮）。

---

## 開発セットアップ

```bash
git clone https://github.com/torifonium/tatemd.git
cd tatemd
npm install
npm run dev   # 開発サーバー起動
```

Node.js は `package.json` の `engines` フィールドを確認してください。

---

## テスト・Lint

プルリクエストを出す前に以下を実行してください。

```bash
npm test        # Vitest によるユニットテスト
npm run lint    # ESLint チェック
npm run build   # ビルドが通ることを確認
```

`core/` の変更は必ずユニットテストを追加・更新してください。

---

## コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。

```
<type>(<scope>): <subject>

[任意の本文・日本語併記可]
```

**type の例:**

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 機能変更を伴わないリファクタリング |
| `test` | テストの追加・修正 |
| `chore` | ビルド設定・依存更新など |

**スコープの例:** `core`, `adapter`, `styles`, `cli`, `deps`

**コミットメッセージの例（英語本文・日本語補足の両立）:**

```
feat(core): add ruby token parser interface

｜漢字《かんじ》 記法のパーサインターフェースを追加。
MVP-1 では未結線（設計余地のみ）。
```

**重要: コミットメッセージに Claude / Anthropic への帰属（`Co-Authored-By: Claude ...`、`Generated with Claude Code` 等）を入れないでください。**

---

## Issues・プルリクエスト

- **バグ報告**: ブラウザ・OS・再現手順を記載してください。
- **機能提案**: ROADMAP に記載のある項目は歓迎します。新しい提案は Issue で先に議論しましょう。
- **プルリクエスト**: `main` ブランチへのマージを目標に、`feat/xxx` や `fix/xxx` のようなブランチ名を使ってください。

---

## ライセンス

このリポジトリへのコントリビューションは MIT ライセンスのもとで公開されることに同意したものとみなします。
