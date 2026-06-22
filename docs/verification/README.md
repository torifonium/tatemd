# 動作確認・デバッグフロー

tatemd の「変更したら何をどの順で確認するか」をまとめたドキュメント。
自動チェック（CI 相当）と、人手でしかできない手動クロスブラウザ検証（Wave 0）の両方を扱う。

- 手動の印刷・組版チェックリストは [`browser-checklist.md`](./browser-checklist.md) を参照。
- 仕様の根拠は [`../../specs/mvp-1-vertical-preview/`](../../specs/mvp-1-vertical-preview/)（requirements / design / tasks）。

---

## 0. 前提（初回セットアップ）

```bash
npm install
```

- Node は LTS 系を想定。`node_modules` / `dist` は Git 管理外（`.gitignore`）。
- `core/` は **DOM 非依存**を保つ制約があり、`window`/`document`/`localStorage` 参照は ESLint で機械的に弾く（`.eslintrc.cjs` の `src/core/**` override）。

---

## 1. 自動チェック（コミット前に毎回・この順で）

| # | コマンド | 何を保証するか | 落ちたら |
|---|----------|----------------|----------|
| 1 | `npx tsc --noEmit` | 型（strict / noUnusedLocals/Params） | §4「build/型が通らない」 |
| 2 | `npm test` | core/adapter のユニットテスト（Vitest） | §4「テストが落ちる」 |
| 3 | `npm run lint` | ESLint（core の DOM 非依存ガード含む） | §4「lint が落ちる」 |
| 4 | `npm run build` | `tsc --noEmit && vite build`（本番ビルド） | §4「build/型が通らない」 |

ワンライナーでまとめて:

```bash
npx tsc --noEmit && npm test && npm run lint && npm run build
```

> 補足: `npm run build` は内部で `tsc --noEmit` を含むので、最終確認は build だけでも型ゲートは通る。
> 開発中の高速ループはテストの watch（`npm run test:watch`）が便利。

---

## 2. ローカル動作確認（dev サーバ）

```bash
npm run dev      # http://localhost:5173/ を開く
```

確認観点（実装の進捗 Wave に応じて）:

- **Wave 1 時点**: ビルドが通り空のシェルが表示される（core はテストで担保、UI 未結線）。
- **Wave 2/3 結線後**:
  - 初回ロードでサンプル原稿「水底の灯」が**縦書き**で右ペインに出る（US-001）
  - 左 textarea を編集すると右プレビューが**約 150ms 後**に更新（US-002）
  - リロードで直近内容が復元される（US-005）
  - A5/B6 切替が効き、選択が保存される（US-006）

`vite preview`（`npm run preview`）で本番ビルド成果物の確認も可能。

---

## 3. Wave 0 手動クロスブラウザ検証（印刷・組版）

「CSS 全振り」の中核リスクは **自動テスト不能**。実装本格化（Wave 2）の前に、
プロトタイプを **Chrome / Safari / Firefox の 3 ブラウザ実機**で確認する。

```bash
# ビルド不要。ファイルを直接ブラウザで開く（外部依存なし）
open proto/print-test.html       # 印刷検証（Task 0.1）
open proto/vertical-test.html    # 縦書き組版検証（Task 0.2）
```

→ チェック項目・結果記入欄は [`browser-checklist.md`](./browser-checklist.md)。

**最大の地雷**は ①Safari が `@page { size }` を無視するか ②縦書き本文が複数ページへ正しく流れるか の 2 点。

---

## 4. デバッグ早見表（症状 → 原因 → 対処）

| 症状 | よくある原因 | 対処 |
|------|--------------|------|
| `build`/型が通らない（`Cannot find name 'process'` 等） | `@types/node` 未導入 / `tsconfig` の `types` 漏れ | `tsconfig.json` の `types` に `node` があるか確認 |
| テストが落ちる | Tier 境界の退行（link/image/code が有効化された等） | `src/core/markdown.ts` の `md.disable([...])` を確認。Tier 2/3 は Task 4.1 まで無効 |
| lint が落ちる（`no-irregular-whitespace`） | 和文の全角スペース（U+3000）を文字列外で使用 | 文字列/テンプレート内に収める（rule は `skipStrings/skipTemplates` 許可済み） |
| lint が落ちる（`no-restricted-globals`） | `core/` で `window`/`document`/`localStorage` を参照 | その処理は `adapter/` 側へ。core は純粋関数に保つ |
| プレビューが**縦書きにならない** | `.tategaki` に `writing-mode: vertical-rl` が当たっていない | `styles/vertical.css` の適用、`.tategaki` ラッパの有無（core 出力）を確認 |
| 英数字が読みにくい（2桁数字が横倒し） | 縦中横（`text-combine-upright`）は MVP-1 スコープ外 | 許容可否を判断。不可なら ROADMAP の縦中横へ |
| 印刷で**本文以外も出る** | `@media print` の本文抽出が効いていない | `.app-header`/`.editor` を `display:none`、`.app-main` の Grid 解除、`.tategaki` 全幅を確認 |
| 印刷で**用紙サイズが変わらない**（特に Safari） | Safari は `@page { size }` を無視しがち | `<style id="print-page">` 差し替えの確認＋ `.tategaki` 実寸固定フォールバック（A5=148×210/B6=128×182mm） |
| 縦書きが**2ページ目に流れない/切れる** | ブラウザの縦書きページネーション差 | Wave 0.1 で挙動を記録。崩れる項目は design に明記して回避策を検討 |
| 段落の字下げ・アキが本らしくない | `.tategaki p` の `text-indent`/`margin-inline-start` 未調整 | Wave 0.2 の結果を design に反映してから `vertical.css` に実装 |

---

## 5. 検証結果の反映先

- **Wave 0 の実機結果**（用紙サイズ方式の確定値、複数ページ可否、段落アキ方式、justify の実効、英数字の許容可否）は
  `specs/mvp-1-vertical-preview/design.md` の「印刷（print.css）」「CSS 組版方針」節へ追記してから Wave 2 に進む。
- 崩れて MVP-1 から外す記法・機能は `ROADMAP.md`（Task 4.3 で作成）へ。

---

## 6. CI（将来 / Task 4.2 と併設候補）

現状は手元での §1 自動チェックが基本。将来 GitHub Actions に同じ流れ
（`tsc --noEmit` → `test` → `lint` → `build`）を載せ、Pages デプロイ前のゲートにする。
（ROADMAP / Task 4.2 で検討）
