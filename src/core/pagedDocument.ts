/**
 * Vivliostyle に渡す「用紙別ページ送り（本）」用の自己完結 HTML を組み立てる純粋関数。
 *
 * DOM 非依存。印刷タブ（src/print）が renderToTypesettingHtml の本文＋縦書き CSS を
 * 渡してこの文字列を作り、Vivliostyle.printHTML に渡す。
 *
 * 背景: ブラウザのネイティブ印刷は縦書き(vertical-rl)を複数の固定ページに分割できない。
 * そこで CSS 組版エンジン Vivliostyle（CLI と同一・縦書き忠実）をブラウザ印刷タブで
 * 使い、A5/B6 の複数ページ縦書きを正しく分割する。ここでは Vivliostyle にページ分割を
 * 任せるため、.tategaki の高さは固定せず auto にする（@page がページ箱を決める）。
 */

export type PaperSize = 'a5' | 'b6';

/** @page size に渡す実寸（mm）。paperSize.ts の DIM と一致させる。 */
const PAGE_DIM: Record<PaperSize, string> = {
  a5: '148mm 210mm',
  b6: '128mm 182mm',
};

/** 余白（mm）。本文の行長 = 用紙高 − 余白×2。 */
const MARGIN_MM = 15;

export interface PagedDocumentOptions {
  /** 縦書き本文の HTML（.tategaki の中身）。renderToTypesettingHtml の出力。 */
  bodyHtml: string;
  /** .tategaki に適用する組版 CSS（vertical.css 相当のテキスト）。 */
  css: string;
  /** 用紙サイズ。 */
  paper: PaperSize;
}

/**
 * Vivliostyle 用の完全な HTML 文字列を返す。
 * @page でページ寸法・余白を指定し、本文は通常フロー（Vivliostyle が複数ページへ分割）。
 */
export function buildPagedDocument(options: PagedDocumentOptions): string {
  const { bodyHtml, css, paper } = options;

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<title>TATEmd</title>
<style>
@page { size: ${PAGE_DIM[paper]}; margin: ${MARGIN_MM}mm; }
/* :root を縦書きにすると Vivliostyle がページ進行方向を RTL と判断し、
   縦書き本文を用紙ごとに正しく複数ページへ分割する（これが無いと A5 が
   1 ページに潰れる/ B6 が切れる等、用紙ごとに破綻する）。CLI の book と同方式。 */
:root { writing-mode: vertical-rl; }
html, body { margin: 0; padding: 0; background: #fff; }
${css}
/* 画面用の height:100% / overflow scroll を無効化（Vivliostyle のページ分割を妨げない）。
   高さは指定せず Vivliostyle のページ箱に委ねる。 */
.tategaki { height: auto; overflow: visible; }
</style>
</head>
<body>
<div class="tategaki">${bodyHtml}</div>
</body>
</html>`;
}
