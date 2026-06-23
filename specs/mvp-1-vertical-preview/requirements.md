# tatemd MVP-1（縦書きプレビュー）Requirements

## Overview

tatemd は、Markdown を書くと和文組版が効いた縦書きの本のレイアウトで即プレビューでき、
そのまま印刷／PDF に出せる静的 Web ツール。サーバー不要・インストール不要。
本フェーズ（MVP-1）は「開いた瞬間に縦書きの本が出ている」体験と、その印刷出力までを成立させる
最小スコープに限定する。禁則・約物処理は自前実装せず CSS にネイティブで任せる。

## Personas

- **P-Writer（書き手）**: 小説・エッセイ等の日本語縦書き原稿を書く人。Markdown の基本記法は使える。
- **P-OSS（来訪者）**: GitHub / デモページから初めて訪れる人。価値が一目で伝わるかを判断する。

## User Stories

### US-001: 開いた瞬間に縦書きの本が見える
**As a** P-OSS **I want to** ツールを開いた瞬間に縦書きのサンプル原稿が表示される **So that** 説明を読まずに価値を理解できる

**Acceptance Criteria:**
- WHEN ユーザーがアプリを初回ロードする（LocalStorage に保存原稿が無い）THE SYSTEM SHALL デフォルトのサンプル原稿（短編の冒頭）をエディタとプレビュー双方に表示する
- WHEN サンプル原稿が表示される THE SYSTEM SHALL プレビューを縦書き（vertical-rl）でレンダリングする
- IF LocalStorage に保存された原稿が存在する THEN THE SYSTEM SHALL サンプルではなく保存原稿を表示する

### US-002: 2ペインでリアルタイムにプレビューできる
**As a** P-Writer **I want to** 左でMarkdownを編集すると右の縦書きプレビューが即座に更新される **So that** 仕上がりを見ながら執筆できる

**Acceptance Criteria:**
- WHEN ユーザーがエディタのテキストを変更する THE SYSTEM SHALL プレビューを更新後の内容で再描画する
- WHILE ユーザーが連続して入力している THE SYSTEM SHALL プレビュー更新を 150ms デバウンスして反映する
- WHEN プレビューが更新される THE SYSTEM SHALL エディタの内容を変更しない（一方向：エディタ→プレビュー）

> デバウンス値の正規化（P1指摘反映）: プレビュー反映 = 150ms / LocalStorage 保存 = 500ms を本仕様の正とする。NFR Performance はこの値を前提に「体感即時」を記述する。

### US-003: 和文組版された縦書きで表示される
**As a** P-Writer **I want to** 禁則処理・英数字の整列が効いた縦書きで表示される **So that** 本らしい組版で読める

**Acceptance Criteria:**
- THE SYSTEM SHALL プレビュー領域に `writing-mode: vertical-rl` を適用する
- THE SYSTEM SHALL プレビュー領域に `line-break: strict` を適用し、禁則処理をブラウザに委譲する
- THE SYSTEM SHALL プレビュー領域に `text-orientation: mixed` を適用し、英数字を自然な向きで整列する
- THE SYSTEM SHALL 禁則・約物詰めのロジックを JavaScript で自前実装しない

> 均等割り付け（両端揃え）について（P1指摘反映）: `text-align: justify` を適用するが、行末・段落末の短い行や `text-align-last` の挙動はブラウザ差が大きい。**均等割り付けはベストエフォートとし、受け入れ基準（合否ゲート）にはしない**。「縦書きで行が右→左へ流れ、本文が読める」ことを合否基準とする。

### US-004: Markdown の基本記法が組版に反映される
**As a** P-Writer **I want to** 見出し・段落・強調・改行などの基本Markdownが縦書きに反映される **So that** 構造を持った原稿を書ける

Markdown 対応はティア制とする。**Tier 1 は MVP-1 必達**。Tier 2 は実装し、縦書きで破綻しなければ採用（破綻する場合は ROADMAP 送り）。Tier 3 は Tier 2 が成功した場合のみ着手する努力目標。

- **Tier 1（必達）**: 見出し（`#`〜`######`）・段落・強調（`**`/`*`）・箇条書き・順序付きリスト・水平線（`---`）・引用（`>`）
- **Tier 2（実装するが縦書き破綻なら除外）**: リンク・画像
- **Tier 3（Tier 2 成功時のみ着手）**: コードブロック・表

**Acceptance Criteria（実行時の振る舞い）:**
- WHEN 入力に Tier 1 の記法が含まれる THE SYSTEM SHALL 対応する組版用 HTML 要素として縦書きで描画する
- WHEN 入力に Tier 2 の記法が含まれる THE SYSTEM SHALL 当該要素を描画し、IF 描画できない場合でも THE SYSTEM SHALL クラッシュせず他の本文の描画を継続する
- WHEN 入力に HTML が含まれる THE SYSTEM SHALL スクリプト等の危険な要素を実行可能な形で出力しない（サニタイズ／無害化する）

> Tier 2/3 の「縦書きで破綻するか」の判定は実行時挙動ではなく **QA（実機確認）での開発時判断**。破綻した記法は ROADMAP へ送り MVP-1 スコープから除外する（受け入れ基準ではなく開発プロセスとして扱う）。

### US-005: 入力が自動保存される
**As a** P-Writer **I want to** 書いた原稿が自動で保存される **So that** リロードしても失われない

**Acceptance Criteria:**
- WHEN ユーザーがエディタの内容を変更する THE SYSTEM SHALL 変更内容を LocalStorage に保存する（デバウンス可）
- WHEN ユーザーがページを再読み込みする THE SYSTEM SHALL 直近の保存内容を復元してエディタとプレビューに表示する
- IF LocalStorage が利用不可（無効化・容量超過）THEN THE SYSTEM SHALL アプリのクラッシュを起こさず編集とプレビューを継続できる

### US-006: 本っぽいPDF/印刷出力ができる
**As a** P-Writer **I want to** ブラウザの印刷から A5/B6 の本らしいPDFを出力できる **So that** 紙面の仕上がりを得られる

**Acceptance Criteria:**
- WHEN ユーザーがブラウザの印刷を実行する THE SYSTEM SHALL プレビュー（縦書き本文）のみを印刷対象とし、エディタ・UI 操作要素を印刷から除外する
- THE SYSTEM SHALL 用紙サイズ A5 / B6 を UI で切替可能とし、選択中のサイズで `@media print` + `@page` により縦書き本文を組版する
- WHEN ユーザーが用紙サイズを切り替える THE SYSTEM SHALL 選択を LocalStorage に保存し、次回ロード時に復元する
- WHEN 印刷プレビューを表示する THE SYSTEM SHALL `writing-mode: vertical-rl` を保持し、本文の行が右→左へ流れる縦書きのまま出力する

### US-007: PDFエクスポート（2モード）
**As a** P-Writer **I want to** 縦書き原稿を PDF に書き出せる **So that** 配布・保存・入稿ができる

PDF 生成はライブラリに依存せず **CSS `@page` + `window.print()`（ブラウザの「PDF に保存」）** で行い、**文字は画像化せず選択可能なまま**にする。2 モードを用意する。

- **モード①: 一般（ページ分割・本）** — 選択中の用紙（A5/B6）でページ分割した縦書き PDF。
- **モード②: 長尺一枚（縦巻）** — 本文全体を**改ページせず横に連続した 1 ページ**に収めた縦書き PDF（絵巻物スタイル）。

配信経路（design「配信経路」参照）。**静的 Web アプリ**は `window.print()` ベースで即時・無インストール。ただし**ブラウザの印刷エンジンは縦書きを複数ページに分割できない**ため、Web のページ印刷は短文/プレビュー向けの best-effort、絵巻も best-effort。忠実な出力は任意の CLI で提供し、Web と同じ core/CSS を再利用する（外部送信なし）:
- **忠実な複数ページ本**（A5/B6・実テキスト）= `tools/book-pdf.mjs`（**Vivliostyle**。縦書きを正しくページ分割）
- **用紙無視の横長1枚（絵巻）** = `tools/emaki-pdf.mjs`（Puppeteer・実寸測定）

**Acceptance Criteria:**
- WHEN ユーザーがモード①の PDF 出力を実行する THE SYSTEM SHALL 選択中の用紙（A5/B6）でページ分割した縦書き本文を `window.print()` 経由で出力する
- WHEN ユーザーがモード②の PDF 出力を実行する THE SYSTEM SHALL 本文全体を改ページせず、内容の幅に合わせた 1 ページに収めた縦書き本文を出力する
- THE SYSTEM SHALL 出力 PDF の本文を**選択可能なテキスト**として保持する（ラスタライズ／画像化しない）
- WHEN PDF を出力する THE SYSTEM SHALL 本文のみを対象とし、エディタ・UI 操作要素を含めない
- IF 本文がブラウザのページ寸法上限を超える（モード②）THEN THE SYSTEM SHALL クラッシュせず、警告表示またはページ分割へフォールバックする（具体挙動は Wave 0 実機検証で確定）

## Functional Requirements

### FR-001: サンプル原稿の初期表示
**Priority:** P0 | **Persona:** P-OSS
WHEN 保存原稿が存在しない初回ロード時 THE SYSTEM SHALL 同梱のオリジナル書き下ろしサンプル原稿（短編の冒頭・著作権クリーン）を読み込み表示する
**Rationale:** 「開いた瞬間に価値が伝わる」を最優先するため。OSS 公開のため出典表記不要のオリジナルとする。

### FR-002: Markdown→組版用HTML変換（core）
**Priority:** P0 | **Persona:** P-Writer
WHEN エディタ内容が与えられる THE SYSTEM SHALL DOM 非依存の純粋関数で Markdown を組版用 HTML 文字列へ変換する
**Rationale:** core/adapter 分離・テスト可能性・将来の MCP 対応のため。

### FR-003: リアルタイム反映（adapter）
**Priority:** P0 | **Persona:** P-Writer
WHEN エディタの input イベントが発火する THE SYSTEM SHALL デバウンス後に core を呼び出しプレビュー DOM を更新する
**Rationale:** 執筆中の即時フィードバック。

### FR-004: 縦書き組版スタイルの適用
**Priority:** P0 | **Persona:** P-Writer
THE SYSTEM SHALL プレビュー要素に縦書き・禁則・英数字整列の CSS を適用する
**Rationale:** 本らしい和文組版を CSS ネイティブで実現するため。

### FR-005: LocalStorage 永続化（adapter）
**Priority:** P0 | **Persona:** P-Writer
WHEN エディタ内容が変化する THE SYSTEM SHALL デバウンス後に LocalStorage へ保存し、ロード時に復元する
**Rationale:** 原稿喪失の防止。

### FR-006: 印刷／PDF レイアウト
**Priority:** P0 | **Persona:** P-Writer
WHEN 印刷が実行される THE SYSTEM SHALL 本文のみを、選択中の用紙サイズ（A5 / B6）で縦書き印刷する
**Rationale:** 「そのまま本として出せる」価値の中核。用紙サイズは US-006 のとおり A5/B6 切替可能。

### FR-007: HTML サニタイズ
**Priority:** P1 | **Persona:** P-Writer
WHEN Markdown に生 HTML / スクリプトが含まれる THE SYSTEM SHALL 危険要素を無害化して描画する
**Rationale:** XSS 防止（静的ツールでもクリップボード由来の悪意ある入力を考慮）。

### FR-008: PDF エクスポート（2モード・CSS @page）
**Priority:** P1 | **Persona:** P-Writer
WHEN ユーザーが PDF 出力（モード① ページ分割 / モード② 長尺一枚）を実行する THE SYSTEM SHALL ライブラリ非依存の `@page` 制御 + `window.print()` で、文字を選択可能なまま縦書き PDF を出力する
**Rationale:** 縦書きの「絵巻物」出力は他にない差別化価値。依存最小・テキスト選択可を保つため CSS ネイティブで実現する。

## Non-Functional Requirements

- **Performance:** 一般的な短編サイズ（〜2万字程度）の入力に対し、キー入力からプレビュー反映まで体感即時。デバウンス値は US-002 の正規化（プレビュー 150ms / 保存 500ms）に従う。
- **Architecture:** `core/` は DOM 非依存の純粋関数のみ。`adapter/` は core を呼ぶだけ。禁則・約物詰めは core に入れない（CSS 責務）。
- **Portability（将来の配布先を見据えた制約）:** `core/` は Web アプリ専用にしない。ブラウザ専用グローバル（`window`/`document`/`localStorage`）や Vite 固有 API（`import.meta.env` 等）に依存せず、Node でもブラウザでも動く純粋 TS に保つ。これにより将来 (a) `core` の npm パッケージ公開、(b) VSCode 拡張（Webview プレビュー）での再利用が可能になるよう設計余地を残す。組版 CSS（`vertical.css`/`print.css`）も特定バンドラに依存しない素の CSS として再利用可能に保つ。
- **Dependencies:** フレームワーク不使用（Vanilla TS + Vite）。Markdown は markdown-it。エディタは MVP-1 ではプレーン `<textarea>`（必要に応じ将来 CodeMirror 等へ拡張余地を残す）。依存は最小限に保つ。
- **Compatibility:** **Chrome（Chromium 系）を第一サポート対象**とし、縦書き表示・改行解釈・印刷が崩れないこと。Safari / Firefox は**ベストエフォート**（MVP-1 では最初から完全カバーせず、報告された issue に応じて対応）。ただし移植性のため Chrome 専用 CSS プロパティ（例 `word-break: auto-phrase`）への依存は避ける。
- **Security:** 出力 HTML はサニタイズ済みであること。外部送信なし（完全クライアントサイド）。
- **Deploy:** 静的サイトとして GitHub Pages にデプロイ可能（`vite.config.ts` の base を `GITHUB_ACTIONS` で切替）。
- **Offline:** サーバー不要・インストール不要で、単一の静的ビルド成果物として動作する。

## Out of Scope（MVP-1では作らない → ROADMAP行き）

- ルビ記法 `｜漢字《かんじ》`（※ core のパーサ設計余地のみ残す。実装はしない）
- 縦中横の自動適用（`text-combine-upright`）
- JS による組版補正（ルビ位置・約物アキの後処理）
- ページ送り・見開き表示
- テーマ切替（明朝/ゴシック・紙色）
- EPUB 等のエクスポート
- MCP 対応（core の UI 非依存性のみ担保し、実装はしない）
- **npm パッケージ公開**（`core` の変換ロジックを単体配布）※ MVP-1 では Portability 制約で設計余地のみ確保し、publish はしない
- **VSCode 拡張としての配布**（Webview で縦書きプレビュー）※ MVP-1 では再利用可能な core/CSS を保つのみ。拡張本体は実装しない
