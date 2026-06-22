/// <reference types="vitest" />
import { defineConfig } from 'vite';

// base: GitHub Actions（Pages）ではサブパス `/tatemd/`、
// それ以外（ローカル開発・スタンドアロン zip 配布）では相対 `./`。
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/tatemd/' : './',
  test: {
    // core は DOM 非依存（node）。adapter のテストはファイル先頭に
    // `// @vitest-environment jsdom` を付けて個別に切り替える。
    environment: 'node',
    globals: true,
  },
});
