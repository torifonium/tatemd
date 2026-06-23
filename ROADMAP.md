# TATEmd Roadmap

MVP-1（縦書きプレビュー・基本 PDF 出力）のスコープ外の項目をまとめたロードマップ。
各項目は `good first issue` 相当の粒度で記載する。

---

## 組版・表示機能

### ルビ記法 `｜漢字《かんじ》`

- `｜漢字《かんじ》` → `<ruby>漢字<rt>かんじ</rt></ruby>` への変換
- `core/ruby.ts` にパーサのシグネチャ（`parseRuby`）の設計余地はすでに確保済み
- 実装は Markdown 変換パイプラインへの組み込みと CSS 側のルビサイズ調整を含む

### 縦中横（`text-combine-upright`）

- 「2桁の数字・記号」を縦中横で自動組み付けする
- 適用対象の検出（2桁英数字、単位記号など）をどこまで自動化するか要検討
- Chrome / Safari / Firefox の `text-combine-upright` 実装差の吸収

### JS 組版補正（ルビ位置・約物アキ）

- CSS だけでは制御できない微細な組版調整（行末約物のアキ詰め、ぶら下げ組みなど）
- パフォーマンスへの影響を考慮し、オプション化を検討

### ページ送り・見開き表示

- エディタとは独立した「読書モード」として、見開き 2 ページ表示を提供する
- スクロールではなくページ単位でめくるインタラクション

### テーマ切替（明朝／ゴシック・紙色）

- フォントファミリーと背景色（白・クリーム・黒など）の切替 UI
- LocalStorage にテーマ選択を保存

### EPUB エクスポート

- `core/renderToTypesettingHtml` の出力を使い、縦書き EPUB3 を生成する
- `epub` 系ライブラリ（`epub-gen` 等）か手実装を評価

---

## 配布チャネル

### ③ スタンドアロン zip 配布（オフライン動作）

- `vite build` の `dist/` をそのまま zip 化し、`index.html` をダブルクリックするだけで動く配布形態
- 外部 CDN・絶対パス参照を持たないビルド設定（`base: './'`）の検証
- GitHub Releases へのアップロードを CI に組み込む

### ④ npm パッケージ（`core` 単体配布）

- `src/core/` の変換ロジック（`renderToTypesettingHtml` + ルビパーサ）を npm に公開
- `package.json` の `exports` 整理・型定義（`.d.ts`）出力・core 専用ビルド設定
- パッケージ名候補: `@torifonium/tatemd-core`（未確定）
- DOM / window / localStorage 非依存の制約はすでに MVP-1 の NFR で担保済み

### ⑤ CDN 配信（unpkg / jsdelivr）

- ④ の npm publish により自動的に配信される（追加作業は最小）
- README に `<script type="module">` を使ったブラウザ直読みの例を追記

### ⑥ VSCode 拡張（Webview 縦書きプレビュー）

- Markdown ドキュメントを `core.renderToTypesettingHtml` で変換し、Webview に `vertical.css` / `print.css` 付きで描画する
- 永続化は `workspace.getConfiguration` / `globalState` に切り替える（`adapter/storage.ts` の IF は MVP-1 で薄く抽象化済み）
- `package.json` の `contributes`・アクティベーションイベント・Webview ブリッジの実装が主な作業

---

## 3 ティア化・CLI

### CLI（Puppeteer）による忠実 PDF 出力

- `tools/emaki-pdf.mjs` プロトタイプを `core`（`renderToTypesettingHtml`）と縦書き CSS と結線し、`markdown → 忠実 PDF` ツールとして完成させる
- **絵巻（長尺一枚）**: ヘッドレス Chrome で行長を実測 → `page.pdf({ width, height })` で確実に 1 枚に収める
- **ページ分割（A5 / B6）**: `page.pdf({ format: 'A5' })` 相当
- `puppeteer` は `devDependencies` / `optionalDependencies` とし、Web 本体のバンドルには含めない
- 詳細設計は `specs/` または `tools/README.md` にまとめる

---

## その他

- **MCP 対応**: `core` の DOM 非依存性はすでに確保済み。MCP ツールとして `renderToTypesettingHtml` を公開する実装
- **E2E テスト自動化**: MVP-1 では手動チェックリストで代替。Playwright を使ったプレビュー描画・PDF 出力の自動検証
- **レスポンシブ対応**: モバイル・タブレットでの 1 ペイン表示・スワイプ切替
- **Tier 3 Markdown 記法**: コードブロック・表の縦書きでの最適化（Tier 2 が安定したら着手）
