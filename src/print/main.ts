/**
 * 印刷タブのエントリ（src/print）。
 *
 * 役割: メインアプリが sessionStorage に渡した原稿と用紙サイズを受け取り、
 * Vivliostyle（CLI と同一の縦書き忠実エンジン）で A5/B6 の複数ページ縦書きに組版し、
 * 印刷ダイアログを開く（テキスト選択可能・ラスタ化なし）。
 *
 * @vivliostyle/core はこの印刷エントリにだけバンドルされる（メイン本体は軽いまま）。
 * 外部 CDN は使わず同梱＝オフライン動作・外部送信なし。
 */

import { printHTML } from '@vivliostyle/core';
import { renderToTypesettingHtml } from '../core/markdown';
import { buildPagedDocument, type PaperSize } from '../core/pagedDocument';
// 縦書き組版 CSS を文字列として取り込み、Vivliostyle 用ドキュメントに埋め込む
import verticalCss from '../styles/vertical.css?inline';

const MANUSCRIPT_KEY = 'tatemd:print:manuscript';
const PAPER_KEY = 'tatemd:print:paper';

function setStatus(html: string): void {
  const el = document.getElementById('status');
  if (el) el.innerHTML = html;
}

function start(): void {
  const manuscript = sessionStorage.getItem(MANUSCRIPT_KEY);
  const paper = (sessionStorage.getItem(PAPER_KEY) as PaperSize | null) ?? 'a5';

  if (manuscript == null) {
    setStatus(
      '<div>印刷する原稿がありません。</div>' +
        '<div class="muted">TATEmd 本体の「印刷」ボタンから開いてください。</div>',
    );
    return;
  }

  const htmlDoc = buildPagedDocument({
    bodyHtml: renderToTypesettingHtml(manuscript),
    css: verticalCss,
    paper,
  });

  const doPrint = (): void => {
    setStatus('<div>Vivliostyle で縦書きを組版中…</div><div class="muted">完了すると印刷ダイアログが開きます。</div>');
    printHTML(htmlDoc, {
      title: 'TATEmd',
      hideIframe: true,
      removeIframe: true,
      // Vivliostyle が全ページの組版を終えたら印刷ダイアログを開く
      printCallback: (iframeWin: Window) => {
        iframeWin.print();
        setStatus(
          '<div>印刷ダイアログを開きました。</div>' +
            '<div class="muted">「PDF に保存」で複数ページの縦書き PDF を保存できます。</div>' +
            '<button type="button" id="reprint">もう一度印刷</button>',
        );
        document.getElementById('reprint')?.addEventListener('click', doPrint);
      },
      errorCallback: (message: string) => {
        setStatus(
          '<div>組版でエラーが発生しました。</div>' +
            `<div class="muted">${message}</div>` +
            '<button type="button" id="reprint">再試行</button>',
        );
        document.getElementById('reprint')?.addEventListener('click', doPrint);
      },
    });
  };

  doPrint();
}

start();
