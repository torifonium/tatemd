# 絵巻（縦書き長尺）PDF を「ブラウザ印刷で横長1枚」にするまでの調査記録

> 縦書き(`writing-mode: vertical-rl`)の本文を、ブラウザの「PDFに保存」で
> **空白ページなしの横長1枚**にする。テキストはラスタ化せず選択可能なまま。
> ——この一見単純な要件が、なぜ難しく、最終的にどう解いたかの記録。

---

## 1. 症状

`長尺`（絵巻）ボタンで `window.print()` を呼ぶと、本文は1ページ目に収まっているのに
**空白の2・3ページが付いてくる**（＝「3つに分かれる」）。`@page` を実測サイズに
差し替えても、用紙が縦（ポートレート）に戻ったり、複数ページに分裂したりする。

最初の仮説は「現ページの隠した header / editor / Grid の残り高さが空白ページを生む」。
→ 本文だけの**自己完結ページを新タブに開く**ようにした。画面表示は完璧になったが、
**そのタブで印刷しても依然3ページ**。つまり原因はページUIの干渉ではなかった。

---

## 2. 検証方法（headless Chrome を真値とする）

推測の往復をやめ、手元の headless Chrome で実際に PDF 化してページ数と寸法を測った。

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=out.pdf "file:///tmp/test.html"

# ページ数 & 用紙寸法（MediaBox）を PDF から直接読む
python3 - <<'PY'
import re
d = open('out.pdf','rb').read()
print('pages', len(re.findall(rb'/Type\s*/Page[^s]', d)))
print('mediabox', re.findall(rb'/MediaBox\s*\[([^\]]+)\]', d)[:1])
PY

# 中身が崩れていないか目視（PDF→PNG サムネイル）
qlmanage -t -s 1600 out.pdf -o /tmp
```

`--print-to-pdf` はインタラクティブな印刷ダイアログと同じ**印刷メディア**経路。
ここで再現すれば本番でも再現する（最終確認だけは実機ダイアログで行う）。

---

## 3. 実測結果（同一サンプル本文・14段落）

| # | 方式 | ページ数 | MediaBox(pt) | 所見 |
|---|------|:--:|---|------|
| V1 | カスタム `@page`（実測幅2000mm×175mm） | 3 | 5669×496 | `@page` サイズ自体は効く。幅が足りず横にあふれただけ |
| V3 | 新タブが自分で実測→`@page`決定 | 3 | 1251×480 | 実測幅で切っても分裂 |
| vA | 高さ640px固定＋幅`@page`を5000mm | 2 | 14172×480 | 内容が**5m超幅**に膨張 |
| vD | `.tategaki` に明示幅8000px | **13** | 6000×480 | 明示幅も無視され激増 |
| vScale | A4横に `transform: scale` で収める | 1 | 841×594 | 1枚だが**レイアウト崩壊** |
| **prod** | **印刷時 `html,body` 高さ固定＋`@page`実測** | **1** | **1270×480** | **横長1枚・崩れなし・タイト** ✅ |

ポイント：
- `@page { size }` は**効いている**（MediaBox が指定どおり）。問題は寸法ではなく**内容側の再フロー**。
- `.tategaki { height }` / `width` の明示指定は、印刷メディアでは**無視されて**列が激増する（vD で13ページ）。

---

## 4. 根本原因

**Chrome の印刷（paged）メディアは縦書き(vertical-rl)を画面と別レイアウトに再フローする。**
縦書きでは要素の **`height` が行長（inline-size＝1列の縦の長さ）** を決めるが、
印刷時にこの行長が保持されず崩れる。行長が短くなると 1列に入る文字が減り、
列数が爆発的に増える → 横方向（block 方向）に数メートル膨張 → 複数ページに分裂する。

`@page` の幅をいくら広げても（vA: 5m）、内容がそれ以上に膨らむため意味がない。

---

## 5. 効いた条件（勝ちパターン）

**印刷時に `html, body` の高さを行長(px)に固定し `overflow: hidden` にする。**
これで行長が保持され、列が崩れず、`@page` を「実測幅 × 行長」にすれば横長1枚に収まる。

```css
/* 画面: 高めに表示して横スクロールで読む（気に入った表示を維持）*/
.tategaki { height: 88vh; width: max-content; overflow: visible; }

/* 印刷: 行長を固定 → 縦書きの列が崩れず横長1枚になる */
@media print {
  html, body { height: 640px; overflow: hidden; }  /* ← これが鍵 */
  .tategaki  { height: 640px; }
}
```

```js
// 新タブ自身が描画後に実寸を測って @page を確定する（印刷直前の確実な値）
const LINE = 640, MM = 25.4 / 96;
const t = document.querySelector('.tategaki');
const prev = t.style.height;
t.style.height = LINE + 'px';                 // 印刷時の行長で実測
const raw = Math.ceil(t.scrollWidth);
const W = raw + Math.ceil(raw * 0.02) + 16;   // 横スラック（再レイアウト誤差の保険）
t.style.height = prev;                        // 画面表示の高さに復帰
const st = document.createElement('style');
st.textContent = `@page{size:${(W * MM).toFixed(1)}mm ${(LINE * MM).toFixed(1)}mm;margin:0}`;
document.head.appendChild(st);
```

検証では同条件で **1ページ・MediaBox 1270×480pt（≒448×169mm）・崩れなし**。
原稿が長いほど横に長い1枚になる（それが絵巻の意図どおり）。

実装: [`src/adapter/pdfExport.ts`](../../src/adapter/pdfExport.ts) の `exportEmaki()`。

---

## 6. なぜ CLI は最初から1枚を出せるのか

CLI（[`tools/emaki-pdf.mjs`](../../tools/emaki-pdf.mjs)）は Puppeteer の
`page.pdf({ width, height, pageRanges: '1' })` を使う。これは
**用紙サイズを実寸で直接指定**でき、`pageRanges:'1'` で余剰ページを捨てられる。
さらに `page.setContent` 後の**画面寄りのレイアウト**で実測してから1枚を作るため、
`@media print` 由来の再フロー問題を踏みにくい。

ブラウザ単体ではこの API は使えないため、Web ティアは上記の
「印刷時 `html,body` 高さ固定」テクニックで近い結果を得ている（best-effort）。
ローカルで確実・忠実に得たい場合は CLI が正規ルート。

---

## 7. 学び（再利用できる教訓）

- 縦書き × 印刷の不具合は**寸法（@page）より内容の再フロー**を疑う。`@page` は概ね効く。
- 縦書きの「行長」は要素 `height`。印刷で崩れるなら **`html,body` 高さ固定 + `overflow:hidden`** を試す。
- `transform: scale` で1枚に押し込む手は、内側が印刷で再フローするため**崩れる**（不採用）。
- ラスタ化(html2canvas 等)は1枚にできるが**文字が選択不可**になるので不採用。
- 推測で往復せず、**headless で PDF を吐いてページ数・MediaBox・サムネイルを実測**するのが最短。
