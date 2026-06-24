/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// ESM（"type":"module"）なので __dirname は使わず import.meta.url から解決する。
const entry = (file: string): string => fileURLToPath(new URL(file, import.meta.url));

// base: GitHub Actions（Pages）ではサブパス `/tatemd/`、
// それ以外（ローカル開発・スタンドアロン zip 配布）では相対 `./`。
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/tatemd/' : './',
  build: {
    rollupOptions: {
      // 印刷タブ（Vivliostyle 同梱）を独立エントリに。
      // @vivliostyle/core は print エントリにだけバンドルされ、メイン本体は軽いまま。
      input: {
        main: entry('index.html'),
        print: entry('print.html'),
      },
    },
  },
  test: {
    // core は DOM 非依存（node）。adapter のテストはファイル先頭に
    // `// @vitest-environment jsdom` を付けて個別に切り替える。
    environment: 'node',
    globals: true,
  },
});
