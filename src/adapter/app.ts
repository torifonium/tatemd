/**
 * 全体の結線（Task 3.1）。
 * DOM 参照・イベント結線・初回描画・スプリッター永続化をここに集約する。
 * 各 adapter（editor / preview / storage / paperSize / splitter）は
 * このファイルからのみ組み立てられる。
 */

import { renderToTypesettingHtml } from '../core/markdown';
import { SAMPLE_MANUSCRIPT } from '../core/sampleManuscript';
import { initEditor } from './editor';
import { loadManuscript, saveManuscript, loadSplit, saveSplit } from './storage';
import { type PaperSize } from './storage';
import { applyPaperSize, initPaperSize } from './paperSize';
import { exportEmaki } from './pdfExport';
import { debounce } from './debounce';
import { initSplitter } from './splitter';

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
  const scrollBtn = document.querySelector<HTMLButtonElement>('.scroll-btn');
  const previewPane = document.querySelector<HTMLElement>('.preview-pane');

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
  // 適用済みサイズを単一情報源として受け取る。
  const initialSize = initPaperSize();

  // 現在の用紙サイズに合わせてボタンの aria-pressed を揃える
  const syncPaperBtns = (active: PaperSize): void => {
    paperBtns.forEach((btn) => {
      const isActive = btn.dataset.size === active;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

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

  // --- 長尺ボタン ---
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      exportEmaki();
    });
  }

  // --- 編集位置 → プレビュー スクロール同期 ---
  // キャレット位置に対応するプレビューのブロックが画面外なら、その位置へ寄せる。
  // 既に見えている場合は動かさない（タイプ中に画面が揺れないように）。
  const syncPreviewToCaret = (): void => {
    if (!previewPane) return;
    const blocks = tategaki.children;
    if (blocks.length === 0) return;
    const len = textarea.value.length || 1;
    const ratio = Math.min(1, Math.max(0, textarea.selectionStart / len));
    const idx = Math.min(blocks.length - 1, Math.floor(ratio * blocks.length));
    const target = blocks[idx] as HTMLElement;
    const pane = previewPane.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const visible =
      t.left < pane.right && t.right > pane.left && t.top < pane.bottom && t.bottom > pane.top;
    if (!visible && typeof target.scrollIntoView === 'function') {
      // 縦書きプレビューは横方向にスクロールする（inline 軸＝水平）
      try {
        target.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      } catch {
        // jsdom 等 scrollIntoView 未対応環境では無視
      }
    }
  };

  // --- 入力結線（editor → preview / storage）---
  // プレビュー更新: 150ms デバウンス（更新後にキャレット位置へ追従）
  const debouncedPreview = debounce((md: string) => {
    updatePreview(tategaki, md);
    syncPreviewToCaret();
  }, 150);

  // 保存: 500ms デバウンス
  const debouncedSave = debounce((md: string) => {
    saveManuscript(md);
  }, 500);

  initEditor(textarea, (value: string) => {
    debouncedPreview(value);
    debouncedSave(value);
  });

  // キャレット移動（テキスト変更なし）でもプレビューを追従させる
  const debouncedCaretSync = debounce(syncPreviewToCaret, 120);
  textarea.addEventListener('keyup', debouncedCaretSync);
  textarea.addEventListener('click', debouncedCaretSync);

  // --- スプリッター（main.ts から移設）---
  initSplitter(container, divider, {
    min: 160,
    initial: loadSplit(),
    onChange: saveSplit,
  });
}
