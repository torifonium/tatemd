// @vitest-environment jsdom
/**
 * app.ts（全体結線）のスモークテスト。
 * index.html 相当の最小 DOM を組み立てて initApp() を呼び、
 * 主要な結線が期待どおりに動くことを確認する。
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { initApp } from './app';

// テスト用の最小 DOM を組み立てる
function buildDom(): void {
  document.body.innerHTML = `
    <header class="app-header">
      <h1 class="app-title">TATEmd</h1>
      <div class="app-actions">
        <button type="button" class="paper-btn" data-size="a5" aria-pressed="true">A5</button>
        <button type="button" class="paper-btn" data-size="b6" aria-pressed="false">B6</button>
        <button type="button" class="print-btn">印刷</button>
      </div>
    </header>
    <main class="app-main">
      <textarea class="editor" spellcheck="false"></textarea>
      <div class="pane-divider" role="separator" aria-orientation="vertical" tabindex="0"></div>
      <section class="preview-pane">
        <div class="tategaki"></div>
      </section>
    </main>
  `;
  // body に data-paper を設定（index.html に準拠）
  document.body.dataset.paper = 'a5';
}

// localStorage をリセットする（テスト間の干渉防止）
function clearStorage(): void {
  try {
    localStorage.clear();
  } catch {
    // jsdom で localStorage が使えない場合は無視
  }
}

describe('initApp()', () => {
  beforeEach(() => {
    buildDom();
    clearStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearStorage();
  });

  it('例外を投げずに起動できる', () => {
    expect(() => initApp()).not.toThrow();
  });

  it('初回に .tategaki の innerHTML がサンプル原稿で埋まる', () => {
    initApp();
    const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki');
    expect(tategaki).not.toBeNull();
    expect(tategaki!.innerHTML.length).toBeGreaterThan(0);
  });

  it('textarea に input を発火すると 150ms 後に .tategaki が更新される', async () => {
    vi.useFakeTimers();
    initApp();

    const textarea = document.querySelector<HTMLTextAreaElement>('textarea.editor')!;
    const tategaki = document.querySelector<HTMLElement>('.preview-pane > .tategaki')!;

    // 初回描画の innerHTML を記録
    const before = tategaki.innerHTML;

    // textarea の値を変更して input イベントを発火
    textarea.value = '# テスト見出し\n\nテスト段落';
    textarea.dispatchEvent(new Event('input'));

    // 150ms 未満では更新されない
    vi.advanceTimersByTime(100);
    expect(tategaki.innerHTML).toBe(before);

    // 150ms 経過で更新される
    vi.advanceTimersByTime(50);
    expect(tategaki.innerHTML).not.toBe(before);
    expect(tategaki.innerHTML).toContain('テスト見出し');
  });

  it('.paper-btn[data-size="b6"] をクリックすると body.dataset.paper が "b6" になる', () => {
    initApp();
    const b6btn = document.querySelector<HTMLButtonElement>('.paper-btn[data-size="b6"]')!;
    b6btn.click();
    expect(document.body.dataset.paper).toBe('b6');
  });

  it('.paper-btn[data-size="b6"] をクリックすると aria-pressed が更新される', () => {
    initApp();
    const a5btn = document.querySelector<HTMLButtonElement>('.paper-btn[data-size="a5"]')!;
    const b6btn = document.querySelector<HTMLButtonElement>('.paper-btn[data-size="b6"]')!;

    b6btn.click();

    expect(b6btn.getAttribute('aria-pressed')).toBe('true');
    expect(a5btn.getAttribute('aria-pressed')).toBe('false');
  });
});
