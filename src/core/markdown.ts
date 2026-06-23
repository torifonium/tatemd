// Markdown → 組版用 HTML 変換（Tier 1 対応）
// DOM 非依存・副作用なし・純粋関数
import MarkdownIt from 'markdown-it';

// markdown-it インスタンス（モジュールスコープで一度だけ生成）
// html: false  → 生 HTML をエスケープ（FR-007 / XSS 対策）
// breaks: true → 単一改行を <br> に（縦書き小説の行送り表現）
// linkify: false → URL の自動リンク化を無効（縦書きで URL が崩れるのを避ける）
const md = new MarkdownIt({ html: false, breaks: true, linkify: false });

// Tier 1（必達）のみに制限する。link/image は Tier 2、code/table は Tier 3 であり、
// それぞれ Task 4.1 で QA（縦書き破綻判定）と validateLink を経てから解禁する。
// strikethrough は Tier に定義が無いため Tier 1 では無効化する。
// （US-004 のティア制／tasks Task 1.2・4.1 と整合させるための明示的な無効化）
md.disable([
  'link', // [text](url)
  'image', // ![alt](src)
  'backticks', // `inline code`
  'strikethrough', // ~~text~~
  'code', // インデントコードブロック
  'fence', // ``` フェンスコードブロック
]);

/**
 * Markdown 文字列を組版用 HTML 文字列（本文のみ）に変換する。
 * 縦書きコンテナ `.tategaki` はホスト側（index.html / adapter）が単一所有するため、
 * ここではラッパを付けず本文 HTML だけを返す（二重 `.tategaki` を避ける）。
 *
 * @param markdown - 変換対象の Markdown 文字列
 * @returns 組版用 HTML 文字列（`.tategaki` の中身として差し込む）
 */
export function renderToTypesettingHtml(markdown: string): string {
  return md.render(markdown);
}
