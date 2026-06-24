/// <reference types="vite/client" />

// CSS を文字列として取り込む（Vivliostyle 用の自己完結ドキュメント生成に使う）
declare module '*?inline' {
  const css: string;
  export default css;
}
