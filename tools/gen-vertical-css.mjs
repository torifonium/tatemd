#!/usr/bin/env node
/**
 * 縦書き組版 CSS（src/styles/vertical.css）を「JS から import できる文字列」に変換する。
 *
 * なぜ必要か:
 *   消費側（noveditor 等の任意 Web アプリ）が tatemd 本家と視覚的に一致した組版を
 *   得るには、buildEmakiDocument / buildPagedDocument の `css` 引数に組版 CSS を
 *   渡す必要がある。バンドラ（Vite の `?inline`）に依存せず、純粋な ESM ライブラリ
 *   として配布するため、ビルド時に CSS を JS 文字列モジュールへ焼き込む。
 *
 * 出力: src/styles/verticalCss.ts（自動生成・編集禁止）
 *   - JSON.stringify でエスケープするのでバッククォートや ${ を含んでも安全。
 *   - vitest（TS）でも tsc ビルドでも追加依存なしに解決できる。
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const srcCss = path.join(root, 'src', 'styles', 'vertical.css');
const outTs = path.join(root, 'src', 'styles', 'verticalCss.ts');

const css = await readFile(srcCss, 'utf8');

const banner =
  '// 自動生成ファイル — 編集しないでください。\n' +
  '// 生成元: src/styles/vertical.css / 生成: `npm run gen:css`（tools/gen-vertical-css.mjs）\n';

// 型は明示的に `string`。注釈が無いと tsc が CSS 全文を巨大な文字列リテラル型として
// .d.ts に出力し、消費側の型チェックを重くするため。
const body =
  '/** 縦書き組版 CSS のテキスト。buildEmakiDocument/buildPagedDocument の `css` に渡すか、\n' +
  ' *  <style> へ注入して tatemd 本家と一致した縦書きを得る。 */\n' +
  `export const verticalCss: string = ${JSON.stringify(css)};\n`;

await writeFile(outTs, banner + body, 'utf8');

console.log(`gen:css → ${path.relative(root, outTs)} (${css.length} bytes)`);
