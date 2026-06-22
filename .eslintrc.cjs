/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, node: true, es2021: true },
  rules: {
    // 和文組版では全角スペース（U+3000）等を文字列・テンプレートリテラルに
    // 意図的に含めるため、文字列内の不規則空白は許可する。
    'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
  },
  ignorePatterns: ['dist', 'node_modules', 'proto'],
  overrides: [
    {
      // core/ は DOM 非依存の純粋関数のみ（NFR Portability: npm/VSCode 再利用の前提）。
      // window/document/localStorage 等のブラウザ専用グローバルへの参照を機械的に禁止する。
      files: ['src/core/**/*.ts'],
      excludedFiles: ['src/core/**/*.test.ts'],
      rules: {
        'no-restricted-globals': [
          'error',
          { name: 'window', message: 'core は DOM 非依存に保つ（adapter で扱う）' },
          { name: 'document', message: 'core は DOM 非依存に保つ（adapter で扱う）' },
          { name: 'localStorage', message: 'core は永続化に触れない（adapter/storage で扱う）' },
        ],
      },
    },
  ],
};
