// ルビ記法パーサのインターフェース定義（設計余地のみ・MVP-1では未使用）

/** ルビ付きトークン。base に親文字、ruby に振り仮名を持つ */
export interface RubyToken {
  base: string;
  ruby: string;
}

/**
 * ルビ記法を含むテキストをトークン列に分解する。
 *
 * TODO: Tier外: 将来 ｜base《ruby》 をパースする
 *
 * MVP-1 では素通し（入力テキストをそのまま配列に包んで返す）。
 * DOM 非依存・副作用なし。
 */
export function parseRuby(text: string): Array<string | RubyToken> {
  return [text];
}
