#!/usr/bin/env node
/**
 * tatemd 忠実 PDF エクスポート（Puppeteer / ヘッドレス Chrome）
 *
 * 思想:
 *   用紙サイズに「押し込む」と改ページが起きる。逆に、内容の実寸を測ってから
 *   その寸法のページを 1 枚だけ作る。これで内容がどれだけ長くても 1 ページに収まり、
 *   かつ文字は実テキストのまま（画像化しない）。
 *
 *   縦書き(vertical-rl)では行が右→左へ積まれるので「横にいくらでも長い 1 枚」になる:
 *     ページ高 = 行長(LINE_LEN, 固定)  /  ページ幅 = 行が積まれた総延長(実測)
 *
 * 位置づけ:
 *   tatemd 本体は静的 Web アプリ（サーバー不要）。本 CLI は「忠実な絵巻 PDF を
 *   ローカルで確実に得たい人」向けの任意ツール。Web と同じ core/CSS を再利用する。
 *   （現状は HTML 入力を受け取る素の実装。core 連携は npm/CLI タスクで結線予定。）
 *
 * 事前準備:
 *   npm i -D puppeteer            # もしくは puppeteer-core + 既存 Chrome
 *
 * 使い方:
 *   node tools/emaki-pdf.mjs <input.html> [out.pdf] [--mode emaki|paged] \
 *        [--paper A5|B6] [--line 640] [--margin 0]
 */
import puppeteer from 'puppeteer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = { mode: 'emaki', paper: 'A5', line: 640, margin: 0, _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mode') args.mode = argv[++i];
    else if (a === '--paper') args.paper = argv[++i];
    else if (a === '--line') args.line = Number(argv[++i]);
    else if (a === '--margin') args.margin = Number(argv[++i]);
    else args._.push(a);
  }
  return args;
}

/**
 * HTML を「用紙無視・横に長い 1 枚」の縦書き PDF にする（emaki モード）。
 * @param {string} html      組版済み HTML（.tategaki を含む）
 * @param {string} outPath   出力先 PDF
 * @param {number} lineLenPx 行長(px) = 1 枚の高さ
 */
async function exportEmaki(html, outPath, lineLenPx) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 行長を固定し、行が積まれる方向(横)の総延長を測る
    const widthPx = await page.evaluate((lineLen) => {
      const el = document.querySelector('.tategaki') || document.body;
      el.style.height = lineLen + 'px';
      el.style.width = 'auto';
      el.style.overflow = 'visible';
      // レイアウト確定
      void el.offsetWidth;
      return Math.ceil(el.scrollWidth);
    }, lineLenPx);

    const slack = Math.ceil(widthPx * 0.02) + 16; // 横方向の保険
    await page.pdf({
      path: outPath,
      width: `${widthPx + slack}px`,
      height: `${lineLenPx}px`,
      printBackground: true,
      pageRanges: '1',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }
}

/**
 * HTML を用紙サイズ別（A5/B6）のページ分割 PDF にする（paged モード）。
 */
async function exportPaged(html, outPath, paper, marginMm) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outPath,
      format: paper, // 'A5' | 'B6' など Puppeteer の用紙指定
      printBackground: true,
      margin: {
        top: `${marginMm}mm`,
        right: `${marginMm}mm`,
        bottom: `${marginMm}mm`,
        left: `${marginMm}mm`,
      },
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args._[0];
  const out = args._[1] || 'tatemd-output.pdf';
  if (!input) {
    console.error(
      '使い方: node tools/emaki-pdf.mjs <input.html> [out.pdf] [--mode emaki|paged] [--paper A5|B6] [--line 640]',
    );
    process.exit(1);
  }

  const abs = path.resolve(process.cwd(), input);
  let html = await readFile(abs, 'utf8');
  // 相対リソース解決のため <base> を付与（CSS/フォントがローカル相対の場合）
  if (!/<base\s/i.test(html)) {
    const baseHref = pathToFileURL(path.dirname(abs) + path.sep).href;
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
  }

  if (args.mode === 'paged') {
    await exportPaged(html, out, args.paper, args.margin || 15);
  } else {
    await exportEmaki(html, out, args.line);
  }
  console.log(`生成完了: ${out} (mode=${args.mode})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
