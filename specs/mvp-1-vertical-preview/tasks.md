# tatemd MVP-1（縦書きプレビュー）Tasks

> 1タスク = 1コミット相当。

## Implementation Plan

### Wave 0（印刷系プロトタイプ — Wave 1 と並行で先行検証）

「CSS 全振り」の中核リスク（印刷系）を実装本格化の前に潰す。使い捨てプロトタイプで可、結果を design に反映する。

- [ ] **Task 0.1**: 印刷プロトタイプ（@page size × 本文抽出 × 複数ページ）
  - What: 最小 HTML に縦書き本文＋ヘッダ＋textarea を置き、(1) `<style id="print-page">` 差し替えで `@page{size:A5/B6}` が Chrome/Safari/Firefox の PDF 用紙に効くか、(2) `@media print` で `.tategaki` のみ全幅・縦書き抽出、(3) 縦書き本文が 2 ページ目以降へ流れるか、を実機確認。Safari で `size` 不発なら実寸固定フォールバック（A5=148×210mm / B6=128×182mm）で本らしさが出るか確認。
  - Files: `proto/print-test.html`（使い捨て可）
  - Done when: 3 ブラウザの結果と採用方式（`@page` / 実寸固定 / 併用）を design「印刷」節と Task 3.2 に反映。複数ページ送りの可否を記録。
  - Depends on: none

- [ ] **Task 0.2**: 縦書き組版プロトタイプ（禁則・英数字・段落・justify）
  - What: サンプル原稿相当を流し込み、`line-break:strict` の禁則挙動、半角英数字（縦中横なし）の見え方、`breaks:true`＋空行段落の段落アキ・字下げ、`text-align:justify`＋`text-align-last` の均等割り付けを 3 ブラウザで確認。
  - Files: `proto/vertical-test.html`（使い捨て可）
  - Done when: `.tategaki p { text-indent }` の要否、justify の実効、英数字の許容可否を design に反映。崩れる項目は要件緩和 or ROADMAP 送りを判断。
  - Depends on: none

- [ ] **Task 0.3**: 長尺一枚 PDF プロトタイプ（モード②のカスタム @page・FR-008）
  - What: `.tategaki` 実測値で `@page { size: <幅>px <高>px }` を設定 → `window.print()` し、3 ブラウザで (a) 改ページされず 1 ページに収まるか (b) 文字が選択可能か (c) どの長さでページ寸法上限に達するか（超過時の挙動）を確認。`proto/print-test.html` に「長尺」ボタンを足す形でよい。
  - Files: `proto/print-test.html`（拡張）
  - Done when: 上限・既定余白・列高・超過時フォールバック方針を design「PDF エクスポート」節へ反映。
  - Depends on: none

### Wave 1（並列 — 依存なし）

- [ ] **Task 1.1**: プロジェクト雛形（Vite + TS）
  - What: `npm create vite@latest`（vanilla-ts）相当の初期化、`package.json` / `tsconfig.json` / `index.html` / `src/main.ts` の空骨格、ESLint + Prettier 設定。
  - Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `.eslintrc` / `.prettierrc`
  - Done when: `npm install && npm run dev` でローカル起動し空ページが出る。`npm run build` 成功。
  - Depends on: none

- [ ] **Task 1.2**: core/markdown.ts（純粋関数・Tier 1）
  - What: markdown-it を `{ html:false, breaks:true, linkify:false }` で初期化し `renderToTypesettingHtml(md): string` を実装。Tier 1 記法（見出し/段落/強調/リスト/順序付き/hr/blockquote/改行→`<br>`）を出力し `.tategaki` でラップ。
  - Files: `src/core/markdown.ts`
  - Done when: Vitest で Tier 1 各記法と `<script>` エスケープのユニットテストが green。DOM/window/localStorage を参照しない。
  - Depends on: none（1.1 と並行可。テスト実行は 1.1 完了後でも本体実装は独立）

- [ ] **Task 1.3**: サンプル原稿（オリジナル書き下ろし）
  - What: 短編の冒頭をオリジナルで書き下ろし、文字列定数として用意。縦書き・改行・段落・強調が映える内容にする。
  - Files: `src/core/sampleManuscript.ts`
  - Done when: `SAMPLE_MANUSCRIPT` をエクスポートし、Tier 1 記法を一通り含む。
  - Depends on: none

- [ ] **Task 1.4**: 汎用デバウンス
  - What: `debounce(fn, ms)` を実装。
  - Files: `src/adapter/debounce.ts`
  - Done when: Vitest でタイマー進行に対する発火回数のテストが green。
  - Depends on: none

- [ ] **Task 1.5**: ルビパーサIF（設計余地のみ）
  - What: `RubyToken` 型と `parseRuby` のシグネチャ（未実装 or stub）を置く。MVP-1 では呼ばない。
  - Files: `src/core/ruby.ts`
  - Done when: 型がエクスポートされビルドを壊さない。本文には未結線。
  - Depends on: none

### Wave 2（Wave 1 後）

- [ ] **Task 2.1**: storage（LocalStorage 永続化 + フォールバック）
  - What: `manuscript` / `paperSize` の get/set。例外を握りつぶす（FR-005）。キーは `tatemd.*.v1`。
  - Files: `src/adapter/storage.ts`
  - Done when: Vitest で正常 get/set、および localStorage 例外時に throw しないテストが green。
  - Depends on: Task 1.1

- [ ] **Task 2.2**: preview（core 呼び出し → DOM 反映）＋プレビューDOM構造の確定
  - What: 受け取った md を `renderToTypesettingHtml` に渡し `.preview-pane > .tategaki` の innerHTML を更新する関数。**プレビューDOM構造（`header.app-header` / `main.app-main` > `textarea.editor` + `section.preview-pane` > `div.tategaki`）をここで確定**し、印刷抽出（Task 3.2）がこの構造に従う。
  - Files: `src/adapter/preview.ts`, `index.html`
  - Done when: 任意 md で `.tategaki` の innerHTML が更新される（jsdom）。確定したクラス名・階層を design の DOM 構造と一致させる。
  - Depends on: Task 1.2

- [ ] **Task 2.3**: editor（textarea input 購読）
  - What: `<textarea>` の `input` を購読し、デバウンス済みコールバックへ現在値を通知。
  - Files: `src/adapter/editor.ts`
  - Done when: 入力でコールバックが（デバウンス後）発火する。
  - Depends on: Task 1.4

- [ ] **Task 2.4**: paperSize（A5/B6 状態 + body 属性 + print-page 差し替え）
  - What: `'a5'|'b6'` 状態を保持し `<body data-paper>` へ反映。あわせて `<style id="print-page">` の `@page { size }` を差し替える（design 確定方式）。storage と連動。
  - Files: `src/adapter/paperSize.ts`
  - Done when: 切替で body 属性と `#print-page` の中身が変わり、値が storage に保存・復元される（jsdom で属性/style 反映を検証）。
  - Depends on: Task 2.1

- [ ] **Task 2.5**: 縦書きCSS（vertical.css）
  - What: `.tategaki` に writing-mode:vertical-rl / text-orientation:mixed / line-break:strict / text-align:justify、`.tategaki p { text-indent:1em }`（段落字下げ）。フォント・行間は初期値（数値のみ後調整）。Wave 0.2 の結果を反映。
  - Files: `src/styles/vertical.css`
  - Done when: Chrome/Safari/Firefox でサンプルが縦書き表示・段落字下げ・崩れなし（justify はベストエフォートで可）。
  - Depends on: Task 1.2, 1.3, Task 0.2

- [ ] **Task 2.6**: UIレイアウトCSS（app.css）
  - What: ヘッダ（用紙切替・印刷ボタン）+ 2ペイン（左 textarea / 右 preview）Grid/Flex。
  - Files: `src/styles/app.css`, `index.html`
  - Done when: 2ペインが横並びで表示され、ヘッダ操作要素が配置される。
  - Depends on: Task 1.1

### Wave 3（Wave 2 後 — 結線）

- [ ] **Task 3.1**: app.ts（全体結線）
  - What: 起動時に storage 復元（無ければサンプル）→ 初回プレビュー描画。editor→debounce→(preview, storage save) を結線。用紙切替ボタン→paperSize。プレビュー150ms / 保存500ms。
  - Files: `src/adapter/app.ts`, `src/main.ts`
  - Done when: 入力でリアルタイム反映、リロードで復元、用紙切替が効く（手動確認）。
  - Depends on: Task 2.1〜2.6

- [ ] **Task 3.2**: 印刷CSS（print.css・本文抽出＋実寸フォールバック）
  - What: design 確定方式の実装。`@media print` で `.app-header`/`.editor` を非表示、`.app-main` の Grid 解除、`.preview-pane` を `position:static` 全幅化し `.tategaki` のみを縦書き出力。Wave 0.1 の結果に従い `@page size`（差し替えは Task 2.4 済）に加え `.tategaki` の実寸固定（A5/B6）フォールバックを併用。`@page size` 動的切替の検証は Wave 0.1 で完了済みなので本タスクは実装に専念。
  - Files: `src/styles/print.css`
  - Done when: 印刷プレビューで本文のみ・A5/B6 反映・縦書き維持・複数ページ送りが Chrome/Safari/Firefox で確認できる。
  - Depends on: Task 3.1, Task 0.1

- [ ] **Task 3.4**: 忠実 PDF CLI（Puppeteer・絵巻/ページ分割）
  - What: `tools/emaki-pdf.mjs`（実装済みプロト）を `core`（`renderToTypesettingHtml`）＋縦書き CSS と結線し、`markdown → 忠実 PDF`（モード② 実寸1枚 / モード① A5・B6）にする。puppeteer は任意（dev/optional）依存。README に使い方を記載。
  - Files: `tools/emaki-pdf.mjs`, `package.json`, `README.md`
  - Done when: ローカルで `node tools/emaki-pdf.mjs` から実テキストの絵巻 PDF（確実に 1 枚）とページ分割 PDF が生成できる。
  - Depends on: Task 1.2（core）, Task 2.5（縦書き CSS）

- [ ] **Task 3.3**: PDF エクスポート（2モード・FR-008 / US-007）
  - What: `adapter/pdfExport.ts` を実装。`exportPdf(mode, paper)` で、モード①は `@page{size:A5/B6}` のまま `window.print()`、モード②は `.tategaki` を実測して `@page{size:幅×高}`＋改ページ抑止に差し替えて `window.print()`、`afterprint` で復帰。ヘッダに「長尺（縦巻）」選択を追加し（index.html / app.css）、`PDF/印刷` ボタンと結線。文字はラスタライズしない。
  - Files: `src/adapter/pdfExport.ts`, `src/adapter/app.ts`, `index.html`, `src/styles/app.css`, `src/styles/print.css`
  - Done when: ①A5/B6 のページ分割 PDF、②改ページなしの長尺1ページ PDF が出力でき、いずれも本文のみ・文字選択可（3 ブラウザ確認）。超過時フォールバックは Task 0.3 の結論に従う。
  - Depends on: Task 3.1, Task 3.2, Task 0.3

### Wave 4（仕上げ）

- [ ] **Task 4.1**: Tier 2/3 判定（リンク・画像 → コード・表）
  - What: link/image を有効化し、markdown-it の `validateLink` で `javascript:`/`data:` 等の危険スキームを無害化。縦書きを画面・印刷の両方で実機確認（印刷での崩れも見る）。破綻するものは ROADMAP へ。成功時のみ code/table を試す。
  - Files: `src/core/markdown.ts`, `ROADMAP.md`
  - Done when: 採用/除外が判定され除外分は ROADMAP に記載。`javascript:`/`data:` 無害化のユニットテストが green。
  - Depends on: Task 3.1, 3.2, 2.5

- [ ] **Task 4.2**: GitHub Pages デプロイ
  - What: `vite.config.ts` の base を `GITHUB_ACTIONS` で切替、`.github/workflows/deploy.yml`。
  - Files: `vite.config.ts`, `.github/workflows/deploy.yml`
  - Done when: ワークフローで build → Pages デプロイ成功、公開URLで動作。
  - Depends on: Task 3.1
  - 公開先 org: **`torifonium`（確定）** → base は `/tatemd/`。🚫 `geniee`/`jai` には作成・push しない。

- [ ] **Task 4.3**: OSS 必須成果物
  - What: `README.md`（demo GIF プレースホルダ・Pages リンク欄・特徴・使い方・開発手順・Topics案）, `ROADMAP.md`（スコープ外 + 配布チャネル③〜⑥「スタンドアロンzip / npm(core) / CDN / VSCode拡張」を good first issue 粒度で）, `LICENSE`(MIT), `CONTRIBUTING.md`（core/adapter 分離の入口）。
  - Files: `README.md`, `ROADMAP.md`, `LICENSE`, `CONTRIBUTING.md`
  - Done when: 4 ファイルが揃い、README 冒頭に `![demo](docs/demo.gif)` プレースホルダ。
  - Depends on: none（並行可だが内容確定のため Wave 4 に配置）

- [ ] **Task 4.4**: クロスブラウザ最終確認（手動チェックリスト）
  - What: Chrome/Safari/Firefox で縦書き表示・禁則・均等割り付け（ベストエフォート）・印刷 A5/B6・複数ページ送りを確認する手動チェックリストを実施。
  - Files: `specs/mvp-1-vertical-preview/qa-checklist.md`（任意）
  - Done when: 全項目 pass または既知の差分が記録される。
  - Depends on: Task 3.2

## Progress

- Total: 21 tasks | Completed: 0 | In Progress: 0
- Wave 0: 3（印刷/組版/長尺PDF プロトタイプ・先行） / Wave 1: 5（並列） / Wave 2: 6 / Wave 3: 3 / Wave 4: 4
- 注: Wave 1 全 + Wave 2 の storage/editor/app.css は実装・テスト済み（spec のチェックボックスは追って更新）。
