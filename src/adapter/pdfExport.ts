/**
 * 絵巻（長尺一枚）PDF エクスポート — best-effort 実装（Chrome 第一対象）。
 *
 * 方針:
 *   - 縦書き要素をクローンして固定行長(LINE_LEN_PX)で横方向総延長(scrollWidth)を実測。
 *   - 実測 scrollHeight をページ高の基準とし、下端の切れを防ぐ。
 *   - @page { size: <幅>mm <高>mm; margin: 0 } に差し替えて window.print() を呼ぶ。
 *   - afterprint（＋3秒タイムアウト保険）で inline style・data 属性・@page を復帰させる。
 */

import { applyPaperSize, getPaperSize } from './paperSize';

/** 1 行（縦の列）の長さ = 長尺1枚の高さ（px）。実測の基準となる固定値。 */
const LINE_LEN_PX = 640;

/** 横方向スラック: 印刷再レイアウト時の誤差吸収。contentW の 5% + 24px。 */
const slackW = (contentW: number): number => Math.ceil(contentW * 0.05) + 24;

/** px → mm 変換係数（96 dpi 基準）*/
const PX_TO_MM = 25.4 / 96;

/**
 * <style id="print-page"> の textContent を差し替える。
 * 要素が存在しない場合は head に生成する。
 */
function setPrintPageStyle(css: string): void {
  let el = document.getElementById('print-page') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'print-page';
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/**
 * 絵巻（長尺一枚）モードで印刷ダイアログを開く。
 * 印刷完了後（afterprint または 3 秒タイムアウト）に元の状態へ復帰する。
 */
export function exportEmaki(): void {
  const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki');
  if (!tategaki) return;

  // --- 手順 1: クローンで横方向総延長(scrollWidth)を実測 ---
  // 縦書き(vertical-rl)では:
  //   scrollWidth  = 列が増える方向（横）の総延長 ≒ ページ幅
  //   scrollHeight = 1 列の高さ                  ≒ ページ高
  // 画面上の .tategaki は viewport 依存の高さになるため、
  // 固定行長(LINE_LEN_PX)でクローンを画面外に配置して実測する。
  const clone = tategaki.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-100000px';
  clone.style.top = '0';
  clone.style.visibility = 'hidden';
  clone.style.height = LINE_LEN_PX + 'px';
  clone.style.width = 'auto';
  clone.style.overflow = 'visible';
  // writing-mode が継承されない環境でも確実に反映させる
  clone.style.writingMode = 'vertical-rl';
  document.body.appendChild(clone);

  // レイアウト確定（強制リフロー）
  void clone.offsetWidth;
  const contentW = clone.scrollWidth;
  // ページ高は実測 scrollHeight ベース（padding 込み）にして下端の切れを防ぐ
  const contentH = Math.max(clone.scrollHeight, LINE_LEN_PX);
  document.body.removeChild(clone);

  // ページボックス寸法（px）
  const boxW = contentW + slackW(contentW);
  const boxH = contentH;

  // px → mm
  const pageWmm = (boxW * PX_TO_MM).toFixed(1);
  const pageHmm = (boxH * PX_TO_MM).toFixed(1);

  // --- 手順 2: 長尺モード設定 ---
  document.body.dataset.pdfMode = 'scroll';

  // .tategaki をページボックスぴったりに固定
  tategaki.style.width = boxW + 'px';
  tategaki.style.height = boxH + 'px';

  // @page を長尺寸法（余白 0）に差し替え
  setPrintPageStyle(`@page { size: ${pageWmm}mm ${pageHmm}mm; margin: 0; }`);

  // --- 手順 3: 印刷 ---
  window.print();

  // --- 手順 4: 復帰処理（afterprint + 3 秒タイムアウト保険）---
  const restore = (): void => {
    if (document.body.dataset.pdfMode !== 'scroll') return; // 既に復帰済み
    document.body.removeAttribute('data-pdf-mode');
    tategaki.style.removeProperty('width');
    tategaki.style.removeProperty('height');
    applyPaperSize(getPaperSize());
  };

  const onAfterPrint = (): void => {
    window.removeEventListener('afterprint', onAfterPrint);
    restore();
  };
  window.addEventListener('afterprint', onAfterPrint);

  // afterprint が発火しないブラウザ（旧 Safari 等）への保険
  setTimeout(() => {
    window.removeEventListener('afterprint', onAfterPrint);
    restore();
  }, 3000);
}
