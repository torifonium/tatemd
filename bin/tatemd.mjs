#!/usr/bin/env node
/**
 * tatemd CLI — 忠実な縦書き PDF を生成するコマンドラインツール。
 *
 * 既存の tools/*.mjs に委譲する薄いラッパ:
 *   - emaki モード … tools/emaki-pdf.mjs（Puppeteer / 横長 1 枚の絵巻 PDF）
 *   - book  モード … tools/book-pdf.mjs（Vivliostyle / A5・B6 の複数ページ本 PDF）
 *
 * 設計方針:
 *   Web ティアを軽量に保つため puppeteer / @vivliostyle/cli は通常の依存にしない。
 *   実行時に未導入なら「導入コマンドを案内する親切なエラー」を出して終了する。
 *
 * 実行権限:
 *   npm 経由で `tatemd` として配布される際は package.json の "bin" により
 *   npm が自動でシンボリックリンク＋実行権限を付与する（chmod は不要）。
 *   リポジトリから直接叩く場合は `node bin/tatemd.mjs ...` で動く。
 */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const require = createRequire(import.meta.url);

const PKG = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

const HELP = `TATEmd — 縦書き Markdown を忠実な PDF に書き出す CLI

使い方:
  tatemd <input.md|input.html> [out.pdf] [options]

オプション:
  --mode <emaki|book>   出力形式（既定: emaki）
                          emaki: 横に長い 1 枚の「絵巻」PDF（Puppeteer）
                          book : A5/B6 の複数ページ「本」PDF（Vivliostyle）
  --paper <A5|B6|...>   用紙サイズ（book / paged 時。既定: A5）
  --line  <px>          絵巻 1 枚の行長 = 高さ（emaki 時。既定: 640）
  --margin <mm>         余白（emaki の paged 時のみ有効。book は 15mm 固定）
  -h, --help            このヘルプを表示
  -v, --version         バージョンを表示

例:
  tatemd novel.md                       # 絵巻 PDF（novel.md → tatemd-output.pdf）
  tatemd novel.md out.pdf --mode emaki
  tatemd novel.md book.pdf --mode book --paper B6

事前準備（初回のみ・必要な形式に応じて）:
  npm i -D puppeteer            # emaki モードに必要
  npm i -D @vivliostyle/cli     # book モードに必要

備考:
  入力は Markdown（.md / .markdown）または組版済み HTML を受け付けます。
  tatemd 本体は静的 Web アプリです。本 CLI は「忠実な PDF をローカルで確実に
  得たい人」向けの任意ツールで、Web と同じ core を再利用します。
`;

/** 引数からモードと、それ以外の素通し引数を切り分ける（モード判定のみ責務）。 */
function parse(argv) {
  const out = { help: false, version: false, mode: 'emaki', rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else if (a === '--mode') {
      out.mode = argv[++i];
    } else {
      out.rest.push(a);
    }
  }
  return out;
}

/** モジュールが解決できるか（= 依存が導入済みか）を判定する。 */
function isInstalled(moduleId) {
  try {
    require.resolve(moduleId);
    return true;
  } catch {
    return false;
  }
}

/** 依存未導入時の親切なエラーを出して終了する。 */
function failMissingDependency(moduleId, installHint) {
  console.error(
    `エラー: '${moduleId}' が見つかりません。\n` +
      `この機能には ${moduleId} が必要です。次のコマンドで導入してください:\n\n` +
      `    ${installHint}\n\n` +
      `（tatemd は Web ティアを軽量に保つため、PDF 用の重い依存を既定では同梱しません）`,
  );
  process.exit(1);
}

async function run() {
  const opts = parse(process.argv.slice(2));

  if (opts.version) {
    console.log(PKG.version);
    return;
  }
  if (opts.help || opts.rest.length === 0) {
    // 入力が無いだけの場合もヘルプを出す（help は正常終了）
    console.log(HELP);
    process.exit(opts.rest.length === 0 && !opts.help ? 1 : 0);
  }

  const mode = opts.mode === 'book' || opts.mode === 'paged' ? 'book' : 'emaki';

  // 対応する tool に必要な依存を実行前に確認する。
  if (mode === 'book') {
    if (!isInstalled('@vivliostyle/cli')) {
      failMissingDependency('@vivliostyle/cli', 'npm i -D @vivliostyle/cli');
    }
    // tools/book-pdf.mjs は --mode を解さないので渡さない（--paper 等はそのまま）。
    const toolArgs = opts.rest;
    process.argv = [process.argv[0], 'book-pdf', ...toolArgs];
    await import(path.join(ROOT, 'tools', 'book-pdf.mjs'));
  } else {
    if (!isInstalled('puppeteer')) {
      failMissingDependency('puppeteer', 'npm i -D puppeteer');
    }
    // emaki-pdf.mjs は --mode emaki|paged を解する。emaki を明示して委譲する。
    process.argv = [process.argv[0], 'emaki-pdf', ...opts.rest, '--mode', 'emaki'];
    await import(path.join(ROOT, 'tools', 'emaki-pdf.mjs'));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
