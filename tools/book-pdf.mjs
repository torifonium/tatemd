#!/usr/bin/env node
/**
 * 忠実な「複数ページの縦書き本」PDF（Vivliostyle）
 *
 * なぜ Vivliostyle か:
 *   ブラウザの印刷エンジン（window.print / 生 Puppeteer page.pdf）は
 *   縦書き(vertical-rl)を複数ページに分割できず、1ページ幅を超えた列が
 *   クリップされてしまう。CSS 組版エンジン Vivliostyle は縦書きを
 *   正しくページ分割できるため、A5/B6 の「本らしい」複数ページ PDF を出せる。
 *
 * 位置づけ:
 *   tatemd 本体は静的 Web アプリ。本 CLI は「忠実な本 PDF をローカルで
 *   確実に得たい人」向けの任意ツール（絵巻 1 枚は tools/emaki-pdf.mjs）。
 *
 * 事前準備:
 *   npm i -D @vivliostyle/cli
 *
 * 使い方:
 *   node tools/book-pdf.mjs <input.html> [out.pdf] [--paper A5|B6]
 *   ※ 入力 HTML は .tategaki に縦書き CSS（writing-mode: vertical-rl 等）を
 *      含むこと。@page の余白は HTML 側 CSS で調整可。
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToHtml, isMarkdownPath } from './lib/md-to-html.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { paper: 'A5', _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--paper') a.paper = argv[++i];
    else a._.push(x);
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const input = args._[0];
const output = args._[1] || 'tatemd-book.pdf';
if (!input) {
  console.error('使い方: node tools/book-pdf.mjs <input.html> [out.pdf] [--paper A5|B6]');
  process.exit(1);
}

async function main() {
  // Markdown 入力なら core で HTML 化して一時ファイルに書き出し、それを入力にする
  let inputPath = path.resolve(process.cwd(), input);
  if (isMarkdownPath(input)) {
    const html = await markdownToHtml(input, { mode: 'book', paper: args.paper });
    const dir = await mkdtemp(path.join(os.tmpdir(), 'tatemd-book-'));
    inputPath = path.join(dir, 'index.html');
    await writeFile(inputPath, html, 'utf8');
  }

  const bin = path.resolve(here, '..', 'node_modules', '.bin', 'vivliostyle');
  const cmdArgs = [
    'build',
    inputPath,
    '-o',
    path.resolve(process.cwd(), output),
    '-s',
    args.paper, // A5 / B5 等のプリセット。B6 はカスタム指定（128mm,182mm）で対応可
    '-d', // single HTML document
  ];

  const child = spawn(bin, cmdArgs, { stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code === 0) console.log(`生成完了: ${output} (paper=${args.paper})`);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
