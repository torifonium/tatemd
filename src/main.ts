// エントリポイント。
// Wave 3 (Task 3.1) で editor↔preview↔storage を結線する予定。
// 現段階ではエディタ／プレビューの境界スプリッターのみ初期化する。
import { initSplitter } from './adapter/splitter';

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
    // localStorage 不可でも無視（編集は継続）
  }
}

const container = document.querySelector<HTMLElement>('.app-main');
const divider = document.querySelector<HTMLElement>('.pane-divider');

if (container && divider) {
  initSplitter(container, divider, {
    min: 160,
    initial: loadSplit(),
    onChange: saveSplit,
  });
}
