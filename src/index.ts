// tatemd ライブラリ公開エントリ（フレームワーク非依存・ブラウザ ESM 対応）
//
// 任意の Web アプリ（noveditor 等）が縦書きレンダリングと書籍化用 HTML を
// 二重実装せずに利用するための公開 API。すべて DOM 非依存・副作用なしの純関数。
// Node 専用 API には依存しないため、ブラウザの ESM からそのまま import できる。
//
// PDF 出力（Vivliostyle・重依存）はコアに含めず、別 export（`tatemd/print`）で
// opt-in 提供する方針（Issue #1 の項目 5）。コア利用時はバンドルを軽く保つ。

import { renderToTypesettingHtml } from './core/markdown.js';

/**
 * Markdown を縦書き組版用の本文 HTML 文字列に変換する。
 *
 * 返るのは `.tategaki` の「中身」のみ（ラッパは付かない）。消費側で
 * `<div class="tategaki">…</div>` に差し込み、{@link verticalCss} を適用する。
 *
 * @param markdown - 変換対象の Markdown 文字列
 * @returns 縦書き本文 HTML（ルビ・禁則は CSS ネイティブ前提）
 */
export function renderVerticalHtml(markdown: string): string {
  return renderToTypesettingHtml(markdown);
}

// 既存名も後方互換のため公開（CLI / 既存利用者向け）。
export { renderToTypesettingHtml } from './core/markdown.js';

// 縦書き組版 CSS（文字列）。<style> へ注入するか、下記ドキュメント生成 API の
// `css` 引数に渡すと tatemd 本家と視覚的に一致した組版になる。
export { verticalCss } from './styles/verticalCss.js';

// 絵巻（横長 1 枚）PDF 用の完全 HTML を生成。
export {
  buildEmakiDocument,
  DEFAULT_LINE_LEN_PX,
  type EmakiDocumentOptions,
} from './core/emakiDocument.js';

// A5/B6 など複数ページ書籍 PDF（Vivliostyle 用）の完全 HTML を生成。
export {
  buildPagedDocument,
  type PagedDocumentOptions,
  type PaperSize,
} from './core/pagedDocument.js';

// ルビ記法パーサ（インターフェース）。
export { parseRuby, type RubyToken } from './core/ruby.js';
