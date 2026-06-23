// vscode-extension のビルドスクリプト
// 1. media/ ディレクトリを作成し vertical.css をコピー（単一ソース維持）
// 2. esbuild で extension.ts をバンドルして out/extension.js を生成

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

// パス定義
const mediaDir = resolve(__dirname, 'media');
const srcCss = resolve(__dirname, '..', 'src', 'styles', 'vertical.css');
const dstCss = resolve(mediaDir, 'vertical.css');

// media/ を作成して vertical.css をコピー
mkdirSync(mediaDir, { recursive: true });
copyFileSync(srcCss, dstCss);
console.log(`コピー完了: ${srcCss} → ${dstCss}`);

// esbuild でバンドル
await esbuild.build({
  entryPoints: [resolve(__dirname, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['vscode'],
  outfile: resolve(__dirname, 'out', 'extension.js'),
  target: 'node18',
  sourcemap: true,
  logLevel: 'info',
});

console.log('ビルド完了: out/extension.js');
