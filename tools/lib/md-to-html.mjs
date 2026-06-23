/**
 * Markdown → 印刷向け縦書き HTML（CLI 共通）。
 *
 * Web/拡張と同じ `core`（renderToTypesettingHtml）を再利用して本文 HTML を作り、
 * 印刷に適した縦書き CSS でラップする。core は dist-cli/ に emit 済みのものを使う
 * （`npm run build:cli` で生成）。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToTypesettingHtml } from '../../dist-cli/core/markdown.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');

// 印刷向けの最小組版 CSS（画面用 vertical.css の screen 依存ルールは持ち込まない）。
const BASE_CSS = `
  html, body { margin: 0; padding: 0; }
  .tategaki {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    line-break: strict;
    text-align: justify;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif;
    font-size: 9pt;
    line-height: 2;
    letter-spacing: 0.05em;
    padding: 4mm;
  }
  .tategaki p { text-indent: 1em; margin: 0; }
  .tategaki p + p { margin-block-start: 0; }
  .tategaki h1 { font-size: 1.8em; font-weight: bold; margin: 0 0 1em; }
  .tategaki h2 { font-size: 1.4em; font-weight: bold; margin: 0 0 0.5em; }
  .tategaki h3, .tategaki h4, .tategaki h5, .tategaki h6 { font-weight: bold; }
  .tategaki blockquote { margin-inline: 1em; border-inline-start: 3px solid #c0c0c0; padding-inline-start: 0.5em; color: #555; }
  .tategaki hr { border: none; border-inline-start: 1px solid #aaa; block-size: 5em; margin-inline: 1em; }
  /* コード・表は縦書き内で横組みの島にする（破綻回避） */
  .tategaki pre, .tategaki table { writing-mode: horizontal-tb; overflow-x: auto; margin-block: 1em; }
  .tategaki pre { background: #f5f5f5; padding: 0.75em 1em; border-radius: 4px; }
  .tategaki table { border-collapse: collapse; font-size: 0.9em; }
  .tategaki th, .tategaki td { border: 1px solid #ccc; padding: 0.4em 0.6em; }
`;

/**
 * Markdown ファイルを印刷向け縦書き HTML 文字列に変換する。
 * @param {string} mdPath  入力 Markdown のパス
 * @param {{ mode?: 'book'|'emaki', paper?: string }} [opts]
 *   - book:  Vivliostyle で複数ページ分割するため :root を縦書きにし @page を付ける
 *   - emaki: Puppeteer 側で .tategaki を実測するため @page は付けない
 * @returns {Promise<string>} 完全な HTML 文字列
 */
export async function markdownToHtml(mdPath, opts = {}) {
  const { mode = 'book', paper = 'A5' } = opts;
  const md = await readFile(path.resolve(process.cwd(), mdPath), 'utf8');
  const body = renderToTypesettingHtml(md);
  // ROOT は将来の参照用（現状は BASE_CSS をインラインで持つ）
  void ROOT;
  const bookCss =
    mode === 'book' ? `:root { writing-mode: vertical-rl; } @page { size: ${paper}; margin: 15mm; }` : '';
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><style>${BASE_CSS}${bookCss}</style></head>
<body><div class="tategaki">${body}</div></body></html>`;
}

/** 入力パスが Markdown 拡張子か判定する。 */
export function isMarkdownPath(p) {
  return /\.(md|markdown)$/i.test(p);
}
