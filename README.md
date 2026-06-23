# TATEmd

Markdown を書くと和文組版の縦書きで即プレビュー、そのまま印刷／PDF に出せる静的 Web ツール。

![demo](docs/demo.gif)

**[デモを開く（GitHub Pages）](https://torifonium.github.io/tatemd/)**

---

## 特徴

- **縦書きプレビュー** — `writing-mode: vertical-rl` による本物の縦書き組版。禁則処理・英数字整列はブラウザネイティブ CSS に委譲し、確実に動く。
- **禁則・約物は CSS に任せる** — JS で組版補正を自前実装せず、ブラウザの枯れた処理を活かす設計。
- **印刷／PDF 出力** — A5・B6 の本らしいページ分割 PDF と、絵巻物スタイルの長尺一枚 PDF の 2 モード。
- **自動保存** — 書いた内容は LocalStorage に自動保存。リロードしても失われない。
- **開いた瞬間にサンプル表示** — 初回ロード時にオリジナルの縦書きサンプル原稿が即表示される。説明を読まなくても価値が伝わる。
- **サーバー不要・インストール不要・外部送信なし** — 完全クライアントサイド。原稿がどこかのサーバーに送られることはない。

---

## 提供ティア

| ティア | 使い方 | 特徴 | PDF |
|--------|--------|------|-----|
| **Web（静的）** | ブラウザで URL を開くだけ | 一番軽い・即時・無インストール | ページ分割=確実 / 絵巻=ベスト努力 |
| **VSCode 拡張** | VS Code 内でプレビュー（将来） | エディタで書きながらそのまま縦書き確認 | Web 相当 |
| **CLI（Puppeteer）** | `node tools/emaki-pdf.mjs`（将来） | 精度完全担保・実テキスト・確実に1枚 | 絵巻も用紙別も忠実 |

3 ティアはすべて同じ `core`（変換ロジック）と縦書き CSS を共有する。見た目が揃い、二重実装が発生しない。

---

## 使い方

### Web（即時）

```
https://torifonium.github.io/tatemd/
```

URL を開くだけで縦書きプレビューが始まる。左ペインに Markdown を書くと右ペインに縦書きでリアルタイム反映される。

ヘッダの `A5` / `B6` ボタンで用紙サイズを選び、`PDF・印刷` ボタンでそのままブラウザ印刷ダイアログへ。`長尺（縦巻）` を選ぶと絵巻物スタイルの長尺一枚 PDF が出力できる。

### 忠実 PDF CLI（Puppeteer・将来）

```bash
node tools/emaki-pdf.mjs input.md output.pdf
```

> CLI は現在開発中です。詳細は [ROADMAP](ROADMAP.md) を参照してください。

---

## 開発

### セットアップ

```bash
git clone https://github.com/torifonium/tatemd.git
cd tatemd
npm install
```

### 主要コマンド

```bash
npm run dev     # 開発サーバー起動（Vite）
npm test        # ユニットテスト（Vitest）
npm run lint    # ESLint チェック
npm run build   # プロダクションビルド（dist/ へ出力）
```

### アーキテクチャ概要

```
src/
├── core/        # DOM 非依存の純粋関数（Markdown → 組版 HTML）
│   ├── markdown.ts         # renderToTypesettingHtml(md): string
│   └── sampleManuscript.ts # 同梱サンプル原稿
└── adapter/     # UI 層（DOM・LocalStorage・印刷）
    ├── app.ts
    ├── editor.ts
    ├── preview.ts
    ├── storage.ts
    ├── paperSize.ts
    ├── pdfExport.ts
    └── debounce.ts
```

`core/` は Node でもブラウザでも動く純粋 TypeScript。`adapter/` は Web UI 固有の処理を担当する。この分離により将来 npm パッケージ・VSCode 拡張・CLI への再利用が容易になる。

貢献を歓迎します → [CONTRIBUTING.md](CONTRIBUTING.md)

---

## ライセンス

MIT — Copyright (c) 2026 torifonium

---

## GitHub Topics 案

`japanese` `vertical-writing` `tategaki` `markdown` `typography`
