// Markdown → 組版用 HTML 変換（Tier 1 / 2 / 3 対応）
// DOM 非依存・副作用なし・純粋関数
import MarkdownIt from 'markdown-it';

// 危険スキームの判定（FR-007 / validateLink 用）
// javascript: / vbscript: / data:（画像以外）を危険とみなす
const DANGEROUS_SCHEME = /^(?:javascript|vbscript):/i;
const SAFE_DATA_IMAGE = /^data:image\//i;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (DANGEROUS_SCHEME.test(trimmed)) return false;
  // data: スキームは image/* のみ許可
  if (/^data:/i.test(trimmed) && !SAFE_DATA_IMAGE.test(trimmed)) return false;
  return true;
}

// markdown-it インスタンス（モジュールスコープで一度だけ生成）
// html: false  → 生 HTML をエスケープ（FR-007 / XSS 対策）
// breaks: true → 単一改行を <br> に（縦書き小説の行送り表現）
// linkify: false → URL の自動リンク化を無効（縦書きで URL が崩れるのを避ける）
const md = new MarkdownIt({ html: false, breaks: true, linkify: false });

// validateLink を上書きして危険スキームを拒否（FR-007）。
// 拒否された link/image はプレーンテキストとして出力され、href/src 属性に危険スキームは現れない。
md.validateLink = isSafeUrl;

// Tier 2（link / image）・Tier 3（backticks / code / fence / table）を有効化。
// strikethrough は Tier 定義外のため引き続き無効化する。
// （US-004 のティア制 Wave 0 実機検証完了済みを受けての解禁）
md.disable([
  'strikethrough', // ~~text~~ — Tier 未定義のため無効
]);

// table は markdown-it のデフォルトで有効だが明示的に有効化してドキュメント化する
md.enable(['table']);

/**
 * Markdown 文字列を組版用 HTML 文字列（本文のみ）に変換する。
 * 縦書きコンテナ `.tategaki` はホスト側（index.html / adapter）が単一所有するため、
 * ここではラッパを付けず本文 HTML だけを返す（二重 `.tategaki` を避ける）。
 *
 * 対応 Tier:
 * - Tier 1: 見出し・段落・強調・リスト・水平線・引用
 * - Tier 2: リンク（validateLink で危険スキームを排除）・画像
 * - Tier 3: インラインコード・コードブロック・テーブル
 *
 * @param markdown - 変換対象の Markdown 文字列
 * @returns 組版用 HTML 文字列（`.tategaki` の中身として差し込む）
 */
export function renderToTypesettingHtml(markdown: string): string {
  return md.render(markdown);
}
