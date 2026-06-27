// tatemd/print — 書籍 PDF（A5/B6・複数ページ縦書き）を Vivliostyle で組版する opt-in サブ export。
//
// なぜ別 export か:
//   ブラウザのネイティブ印刷（window.print）は縦書きを複数ページに分割できない。
//   CSS 組版エンジン Vivliostyle なら正しく分割できるが重い依存なので、コア
//   （`tatemd`）には含めず `tatemd/print` として opt-in 提供する。コアだけ使う
//   消費者のバンドルに Vivliostyle が混ざらないようにするのが目的。
//
// 前提: ブラウザ専用（document/window を使う）。`@vivliostyle/core` は
//   peerDependency（任意）。print を使う消費者だけが `npm i @vivliostyle/core` する。
import { printHTML } from '@vivliostyle/core';
import { renderToTypesettingHtml } from '../core/markdown.js';
import { buildPagedDocument, type PaperSize } from '../core/pagedDocument.js';
// 縦書き組版 CSS は生成済みの文字列モジュールから取り込む（バンドラ非依存・?inline 不使用）。
import { verticalCss } from '../styles/verticalCss.js';

export type { PaperSize } from '../core/pagedDocument.js';

export interface PrintPagedOptions {
  /** 印刷ドキュメントのタイトル。既定 'TATEmd'。 */
  title?: string;
  /** 印刷ダイアログを開いた直後に呼ばれる。 */
  onPrinted?: () => void;
  /** 組版エラー時に呼ばれる。 */
  onError?: (message: string) => void;
}

/**
 * Markdown を A5/B6 の複数ページ縦書きに組版し、印刷ダイアログを開く（ブラウザ専用）。
 * 文字は画像化せず選択可能。`@vivliostyle/core` が必要。
 */
export function printPagedMarkdown(
  markdown: string,
  paper: PaperSize = 'a5',
  options: PrintPagedOptions = {},
): void {
  const htmlDoc = buildPagedDocument({
    bodyHtml: renderToTypesettingHtml(markdown),
    css: verticalCss,
    paper,
  });
  printPagedHtml(htmlDoc, options);
}

/**
 * 既に組まれた完全 HTML（buildPagedDocument 等の出力）を Vivliostyle で印刷する。
 */
export function printPagedHtml(htmlDoc: string, options: PrintPagedOptions = {}): void {
  const { title = 'TATEmd', onPrinted, onError } = options;
  printHTML(htmlDoc, {
    title,
    hideIframe: true,
    removeIframe: true,
    // Vivliostyle が全ページの組版を終えたら印刷ダイアログを開く
    printCallback: (iframeWin: Window) => {
      iframeWin.print();
      onPrinted?.();
    },
    errorCallback: (message: string) => {
      onError?.(message);
    },
  });
}
