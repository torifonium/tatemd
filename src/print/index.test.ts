import { describe, it, expect, vi, beforeEach } from 'vitest';

// @vivliostyle/core（重・ブラウザ依存）はモックし、配線だけ検証する。
vi.mock('@vivliostyle/core', () => ({ printHTML: vi.fn() }));

import { printHTML } from '@vivliostyle/core';
import { printPagedMarkdown, printPagedHtml } from './index';

describe('tatemd/print サブ export', () => {
  beforeEach(() => {
    vi.mocked(printHTML).mockClear();
  });

  it('printPagedMarkdown は用紙寸法と縦書き CSS を埋めた HTML で printHTML を呼ぶ', () => {
    printPagedMarkdown('# 章\n\n本文', 'b6');
    expect(printHTML).toHaveBeenCalledOnce();
    const doc = vi.mocked(printHTML).mock.calls[0][0] as string;
    expect(doc).toContain('<!doctype html>');
    expect(doc).toContain('128mm 182mm'); // B6
    expect(doc).toContain('writing-mode: vertical-rl');
    expect(doc).toContain('章');
  });

  it('paper 省略時は a5', () => {
    printPagedMarkdown('本文');
    const doc = vi.mocked(printHTML).mock.calls[0][0] as string;
    expect(doc).toContain('148mm 210mm'); // A5
  });

  it('printPagedHtml は渡した HTML をそのまま printHTML に渡す', () => {
    printPagedHtml('<!doctype html><html></html>', { title: 'X' });
    expect(printHTML).toHaveBeenCalledOnce();
    const [doc, opts] = vi.mocked(printHTML).mock.calls[0];
    expect(doc).toBe('<!doctype html><html></html>');
    expect((opts as { title: string }).title).toBe('X');
  });
});
