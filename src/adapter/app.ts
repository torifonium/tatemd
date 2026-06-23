/**
 * 全体の結線（Task 3.1）。
 * DOM 参照・イベント結線・初回描画・スプリッター永続化をここに集約する。
 * 各 adapter（editor / preview / storage / paperSize / splitter）は
 * このファイルからのみ組み立てられる。
 */

import { renderToTypesettingHtml } from '../core/markdown';
import { SAMPLE_MANUSCRIPT } from '../core/sampleManuscript';
import { initEditor } from './editor';
import { loadManuscript, saveManuscript } from './storage';
import { type PaperSize } from './storage';
import { applyPaperSize, initPaperSize } from './paperSize';
import { debounce } from './debounce';
import { initSplitter } from './splitter';

// スプリッター位置を保存する LocalStorage キー（main.ts から移設）
const SPLIT_KEY = 'tatemd.split.v1';

function loadSplit(): number | null {
  try {
    const v = localStorage.getItem(SPLIT_KEY);
    const n = v == null ? NaN : parseFloat(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function saveSplit(px: number): void {
  try {
    localStorage.setItem(SPLIT_KEY, String(Math.round(px)));
  } catch {
    // localStorage 不可でも無視（操作は継続）
  }
}

/**
 * プレビュー DOM (.tategaki) を更新する。
 * preview.ts が未実装のため、ここで最小実装として保持する。
 */
function updatePreview(tategaki: HTMLElement, markdown: string): void {
  tategaki.innerHTML = renderToTypesettingHtml(markdown);
}

/**
 * アプリ全体を初期化する。
 * index.html に DOM が既に存在することを前提とする。
 */
export function initApp(): void {
  // --- DOM 取得 ---
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea.editor');
  const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki');
  const container = document.querySelector<HTMLElement>('.app-main');
  const divider = document.querySelector<HTMLElement>('.pane-divider');
  const paperBtns = document.querySelectorAll<HTMLButtonElement>('.paper-btn[data-size]');
  const printBtn = document.querySelector<HTMLButtonElement>('.print-btn');

  // 必須 DOM が無ければ起動しない
  if (!textarea || !tategaki || !container || !divider) {
    return;
  }

  // --- 初期表示（US-001）---
  // storage から復元。未保存であればサンプル原稿を使用する。
  const initial = loadManuscript() ?? SAMPLE_MANUSCRIPT;
  textarea.value = initial;
  updatePreview(tategaki, initial);

  // --- 用紙サイズ初期化 ---
  // storage から復元し、body[data-paper] と @page { size } に反映する。
  initPaperSize();

  // 現在の用紙サイズに合わせてボタンの aria-pressed を揃える
  const syncPaperBtns = (active: PaperSize): void => {
    paperBtns.forEach((btn) => {
      const isActive = btn.dataset.size === active;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  // initPaperSize が返す値を使って初期 aria 状態を反映
  // （initPaperSize は body.dataset.paper を更新済みなので、そこから読む）
  const initialSize = (document.body.dataset.paper ?? 'a5') as PaperSize;
  syncPaperBtns(initialSize);

  // --- 用紙サイズ切替ボタン ---
  paperBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size as PaperSize | undefined;
      if (size !== 'a5' && size !== 'b6') return;
      applyPaperSize(size);
      syncPaperBtns(size);
    });
  });

  // --- 印刷ボタン ---
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // --- 入力結線（editor → preview / storage）---
  // プレビュー更新: 150ms デバウンス
  const debouncedPreview = debounce((md: string) => {
    updatePreview(tategaki, md);
  }, 150);

  // 保存: 500ms デバウンス
  const debouncedSave = debounce((md: string) => {
    saveManuscript(md);
  }, 500);

  initEditor(textarea, (value: string) => {
    debouncedPreview(value);
    debouncedSave(value);
  });

  // --- スプリッター（main.ts から移設）---
  initSplitter(container, divider, {
    min: 160,
    initial: loadSplit(),
    onChange: saveSplit,
  });
}
