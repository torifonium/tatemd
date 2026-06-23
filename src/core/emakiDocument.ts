/**
 * 絵巻（縦書き長尺一枚）PDF 用の自己完結 HTML を組み立てる純粋関数。
 *
 * DOM 非依存。Web アダプタ（新タブに書き込む）と VSCode 拡張（一時 HTML を
 * 外部ブラウザで開く）の両方が、この同じ HTML 生成を再利用する。
 *
 * 核心（headless Chrome で 6 方式検証して確定。詳細は
 * docs/verification/emaki-print-investigation.md）:
 *   Chrome の印刷メディアは縦書き(vertical-rl)を再フローし、要素の行長(height)を
 *   無視して列が激増する。**@media print で html/body の高さを行長(px)に固定し
 *   overflow:hidden** にすると行長が保たれ、実測幅で @page を切れば横長 1 枚に収まる。
 *   文字はラスタ化しないため選択可能なまま。
 */

/** 既定の 1 行（縦の列）の長さ = 長尺1枚の高さ（px）。@page 高さ・印刷時の行長になる。 */
export const DEFAULT_LINE_LEN_PX = 640;

export interface EmakiDocumentOptions {
  /** 縦書き本文の HTML（.tategaki の中身）。renderToTypesettingHtml の出力。 */
  bodyHtml: string;
  /** .tategaki に適用する組版 CSS（vertical.css 相当のテキスト）。 */
  css: string;
  /** 1 列の高さ（px）。省略時は DEFAULT_LINE_LEN_PX。 */
  lineLenPx?: number;
}

/**
 * 新タブ／外部ブラウザで描画後に実寸幅を測り @page を確定する自己完結スクリプト。
 * 印刷の行長(LINE)で一旦測り、画面表示用の高さに戻してから @page を流し込む。
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
 * 絵巻 PDF 用の完全な HTML 文字列を返す。
 * - 画面では height:88vh で表示し横スクロールで読める。
 * - @media print で html/body/.tategaki の高さを行長に固定（横長 1 枚化の核心）。
 * - 「PDFで保存」ボタン（印刷時は非表示）＋ 描画後に @page を決める計測スクリプト付き。
 */
export function buildEmakiDocument(options: EmakiDocumentOptions): string {
  const { bodyHtml, css } = options;
  const line = options.lineLenPx ?? DEFAULT_LINE_LEN_PX;

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TATEmd 絵巻</title>
<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
${css}
/* 画面: 高めに表示して横スクロールで読む（組版 CSS の height/overflow を上書き）*/
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
  html, body { height: ${line}px; overflow: hidden; }
  .tategaki { height: ${line}px; }
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
<script>${measureScript(line)}</script>
</body>
</html>`;
}
