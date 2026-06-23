// @vitest-environment jsdom

import { applyPaperSize, initPaperSize, getPaperSize } from './paperSize';
import { loadPaperSize } from './storage';

afterEach(() => {
  // storage のクリア
  localStorage.clear();
  // <style id="print-page"> の後始末
  const el = document.getElementById('print-page');
  if (el) {
    el.remove();
  }
  // body[data-paper] のリセット
  delete document.body.dataset.paper;
});

describe('applyPaperSize', () => {
  it("'b6' を渡すと body.dataset.paper が 'b6' になる", () => {
    applyPaperSize('b6');
    expect(document.body.dataset.paper).toBe('b6');
  });

  it("'a5' を渡すと body.dataset.paper が 'a5' になる", () => {
    applyPaperSize('a5');
    expect(document.body.dataset.paper).toBe('a5');
  });

  it("applyPaperSize('b6') で <style id='print-page'> が生成される", () => {
    applyPaperSize('b6');
    const el = document.getElementById('print-page');
    expect(el).not.toBeNull();
  });

  it("applyPaperSize('b6') で textContent に B6 実寸(128mm 182mm)が含まれる", () => {
    applyPaperSize('b6');
    const el = document.getElementById('print-page');
    expect(el?.textContent).toContain('128mm 182mm');
  });

  it("applyPaperSize('a5') で textContent に A5 実寸(148mm 210mm)が含まれる", () => {
    applyPaperSize('a5');
    const el = document.getElementById('print-page');
    expect(el?.textContent).toContain('148mm 210mm');
  });

  it('切替後に textContent が新しいサイズに更新される', () => {
    applyPaperSize('a5');
    applyPaperSize('b6');
    const el = document.getElementById('print-page');
    expect(el?.textContent).toContain('128mm 182mm');
    expect(el?.textContent).not.toContain('148mm 210mm');
  });

  it('applyPaperSize 後に loadPaperSize() が同じ値を返す（storage 保存）', () => {
    applyPaperSize('b6');
    expect(loadPaperSize()).toBe('b6');
  });

  it("'a5' 保存後に loadPaperSize() が 'a5' を返す", () => {
    applyPaperSize('a5');
    expect(loadPaperSize()).toBe('a5');
  });
});

describe('initPaperSize', () => {
  it('未保存の場合は "a5" を返す', () => {
    const result = initPaperSize();
    expect(result).toBe('a5');
  });

  it('未保存の場合は body.dataset.paper が "a5" になる', () => {
    initPaperSize();
    expect(document.body.dataset.paper).toBe('a5');
  });

  it("'b6' が保存されている場合は 'b6' を返す", () => {
    applyPaperSize('b6');
    // storage には 'b6' が入っている
    const result = initPaperSize();
    expect(result).toBe('b6');
  });

  it("'b6' が保存されている場合は body.dataset.paper が 'b6' になる", () => {
    applyPaperSize('b6');
    // body.dataset をリセットして復元を検証
    delete document.body.dataset.paper;
    initPaperSize();
    expect(document.body.dataset.paper).toBe('b6');
  });
});

describe('getPaperSize', () => {
  it('applyPaperSize 後に現在値を返す', () => {
    applyPaperSize('b6');
    expect(getPaperSize()).toBe('b6');
  });

  it('applyPaperSize で a5 → b6 と切り替えると最新値を返す', () => {
    applyPaperSize('a5');
    applyPaperSize('b6');
    expect(getPaperSize()).toBe('b6');
  });
});
