/**
 * 用紙サイズ（A5/B6）の状態管理と DOM 反映。
 * - body[data-paper] 属性への反映
 * - <style id="print-page"> の @page { size } 差し替え（design 確定方式）
 * - storage と連動した永続化
 *
 * ボタンのクリック結線は Task 3.1 (app.ts) の責務。
 */

import { type PaperSize, loadPaperSize, savePaperSize } from './storage';

// @page size に渡す CSS 識別子（大文字）
const DIM: Record<PaperSize, string> = {
  a5: 'A5',
  b6: 'B6',
} as const;

// デフォルト用紙サイズ
const DEFAULT_SIZE: PaperSize = 'a5';

// 現在の用紙サイズ（モジュールスコープの状態）
let _current: PaperSize = DEFAULT_SIZE;

/**
 * 用紙サイズを DOM・storage に反映する。
 * - document.body.dataset.paper を更新
 * - <style id="print-page"> の textContent を差し替え（なければ head に生成）
 * - storage に保存
 */
export function applyPaperSize(size: PaperSize): void {
  _current = size;

  // body[data-paper] の更新
  document.body.dataset.paper = size;

  // <style id="print-page"> の取得または生成
  let el = document.getElementById('print-page') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'print-page';
    document.head.appendChild(el);
  }

  // @page { size } の差し替え
  el.textContent = `@page { size: ${DIM[size]}; margin: 15mm; }`;

  // storage に保存
  savePaperSize(size);
}

/**
 * storage から用紙サイズを復元し applyPaperSize を呼ぶ。
 * 未保存の場合はデフォルト値 'a5' を使用する。
 * @returns 適用した用紙サイズ
 */
export function initPaperSize(): PaperSize {
  const saved = loadPaperSize();
  const size: PaperSize = saved ?? DEFAULT_SIZE;
  applyPaperSize(size);
  return size;
}

/**
 * 現在の用紙サイズを返す。
 * initPaperSize / applyPaperSize が呼ばれる前はモジュール初期値 'a5'。
 */
export function getPaperSize(): PaperSize {
  return _current;
}
