/**
 * 絵巻（長尺一枚）PDF エクスポート — 新タブ方式（Chrome 第一対象）。
 *
 * 背景（headless Chrome で 6 通り検証して判明した制約）:
 *   Chrome の印刷メディアは縦書き(vertical-rl)を画面と別レイアウトに再フローし、
 *   要素の行長(height)指定を無視して列を激増させる。その結果、実測幅で @page を
 *   切っても 3〜13 ページに分裂し、横長 1 枚にならない。
 *
 * 効いた条件（本実装の核）:
 *   印刷時に **html, body の高さを行長(px)に固定し overflow:hidden** にすると、
 *   行長が保持され、列が崩れず、@page を実測幅 × 行長にすれば横長 1 枚に収まる。
 *   （ラスタ化しないためテキストは選択可能なまま）
 *
 * 方針:
 *   - 本文(.tategaki)だけを載せた自己完結ページを新タブに開く。
 *   - 画面では height:88vh で表示（横スクロールで読める）。
 *   - @media print でのみ html/body/.tategaki の高さを行長に固定。
 *   - 新タブ自身が描画後に実寸を測って @page を決める（印刷直前の確実な値）。
 *   - 用紙無視の忠実 PDF が要るときは CLI(tools/emaki-pdf.mjs) を案内する。
 */

/** 1 行（縦の列）の長さ = 長尺1枚の高さ（px）。@page 高さ・印刷時の行長になる。 */
const LINE_LEN_PX = 640;

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
 * 新タブの本文描画後に実寸幅を測り @page を確定する自己完結スクリプト。
 * 印刷の行長(LINE)で一旦測り、画面表示用の高さに戻してから @page を流し込む。
 * 文字列として新タブへ書き込み、新タブ内で実行させる。
 */
function measureScript(line: number): string {
  return `(function(){
  var LINE = ${line}, MM = 25.4/96;
  function measure(){
    var t = document.querySelector('.tategaki');
    if(!t) return;
    var prev = t.style.height;
    t.style.height = LINE + 'px';          // 印刷時の行長で実測
    var raw = Math.ceil(t.scrollWidth);
    var W = raw + Math.ceil(raw*0.02) + 16; // 横方向スラック（再レイアウト誤差の保険）
    t.style.height = prev;                  // 画面表示の高さに復帰
    var st = document.getElementById('tatemd-page') || document.createElement('style');
    st.id = 'tatemd-page';
    st.textContent = '@page{size:'+(W*MM).toFixed(1)+'mm '+(LINE*MM).toFixed(1)+'mm;margin:0}';
    document.head.appendChild(st);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function(){ requestAnimationFrame(measure); });
  } else {
    requestAnimationFrame(measure);
  }
})();`;
}

/**
 * 絵巻（長尺一枚）を新しいタブに開く。
 * 新タブのページは画面では横スクロールで読め、「PDFで保存」ボタン（印刷時は非表示）
 * または ⌘P で内容ぴったりの横長 1 枚 PDF として保存できる（テキスト選択可）。
 */
export function exportEmaki(): void {
  const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki');
  if (!tategaki) return;

  const tategakiCss = collectTategakiCss();
  const bodyHtml = tategaki.innerHTML;

  // 新タブを開く（長尺ボタンのクリック起点なのでポップアップブロック対象外）。
  const win = window.open('', '_blank');
  if (!win) return; // ブロックされた等

  const doc = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TATEmd 絵巻</title>
<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
${tategakiCss}
/* 画面: 高めに表示して横スクロールで読む（抽出 CSS の height/overflow を上書き）*/
.tategaki { height: 88vh; width: max-content; overflow: visible; }
/* 操作バー（印刷時は非表示）*/
.tatemd-toolbar {
  position: fixed; top: 16px; left: 16px; z-index: 9999;
  display: flex; gap: 8px; align-items: center;
  font-family: system-ui, -apple-system, "Hiragino Kaku Gothic ProN", sans-serif;
}
.tatemd-toolbar button {
  padding: 8px 18px; border: none; border-radius: 8px;
  background: #16a34a; color: #fff; font-size: 14px; cursor: pointer;
}
.tatemd-toolbar span { color: #666; font-size: 12px; }
/* 印刷: 行長を固定し overflow:hidden にすると縦書きの列が崩れず横長 1 枚になる */
@media print {
  html, body { height: ${LINE_LEN_PX}px; overflow: hidden; }
  .tategaki { height: ${LINE_LEN_PX}px; }
  .tatemd-toolbar { display: none !important; }
}
</style>
</head>
<body>
<div class="tatemd-toolbar">
  <button type="button" onclick="window.print()">PDFで保存</button>
  <span>または ⌘P / Ctrl+P → 「PDFに保存」（横長1枚）</span>
</div>
<div class="tategaki">${bodyHtml}</div>
<script>${measureScript(LINE_LEN_PX)}</script>
</body>
</html>`;

  win.document.open();
  win.document.write(doc);
  win.document.close();
}
