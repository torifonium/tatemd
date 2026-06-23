/**
 * 絵巻（長尺一枚）PDF エクスポート — 新タブ方式（Chrome 第一対象）。
 *
 * HTML 生成そのものは core/emakiDocument.ts の純粋関数に集約し、Web/拡張で共有する。
 * このアダプタは「現ページの組版 CSS と本文 DOM を集めて新タブに書き込む」役割だけを担う。
 *
 * 横長 1 枚化の核心（印刷時に html/body 高さを行長へ固定）は buildEmakiDocument 側。
 * 詳細は docs/verification/emaki-print-investigation.md。
 */

import { buildEmakiDocument } from '../core/emakiDocument';

/**
 * 現在ページの読み込み済みスタイルシートから `.tategaki` 系の組版ルールだけを
 * 抽出して 1 つの CSS 文字列にまとめる。
 * - app.css / print.css のレイアウト・印刷専用ルールは持ち込まない
 *   （新タブには header/editor 等が存在しないため不要、かつ干渉を避ける）。
 * - @media 等にネストされたルールは対象外（トップレベルの組版ルールのみ）。
 * - クロスオリジンのシートは cssText 参照で例外を投げるため握りつぶす。
 */
function collectTategakiCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // クロスオリジン等で参照不可
    }
    for (const rule of Array.from(rules)) {
      if (
        rule instanceof CSSStyleRule &&
        rule.selectorText.split(',').some((s) => s.trim().startsWith('.tategaki'))
      ) {
        chunks.push(rule.cssText);
      }
    }
  }
  return chunks.join('\n');
}

/**
 * 絵巻（長尺一枚）を新しいタブに開く。
 * 新タブのページは画面では横スクロールで読め、「PDFで保存」ボタン（印刷時は非表示）
 * または ⌘P で内容ぴったりの横長 1 枚 PDF として保存できる（テキスト選択可）。
 */
export function exportEmaki(): void {
  const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki');
  if (!tategaki) return;

  const doc = buildEmakiDocument({
    bodyHtml: tategaki.innerHTML,
    css: collectTategakiCss(),
  });

  // 新タブを開く（長尺ボタンのクリック起点なのでポップアップブロック対象外）。
  const win = window.open('', '_blank');
  if (!win) return; // ブロックされた等

  win.document.open();
  win.document.write(doc);
  win.document.close();
}
