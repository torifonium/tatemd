import { describe, it, expect } from 'vitest';
import {
  renderVerticalHtml,
  renderToTypesettingHtml,
  verticalCss,
  buildEmakiDocument,
  buildPagedDocument,
  parseRuby,
  DEFAULT_LINE_LEN_PX,
} from './index';

describe('公開バレル (src/index.ts)', () => {
  it('renderVerticalHtml は Markdown を本文 HTML に変換する', () => {
    const html = renderVerticalHtml('# 見出し\n\n本文');
    expect(html).toContain('<h1>');
    expect(html).toContain('見出し');
  });

  it('renderVerticalHtml は既存の renderToTypesettingHtml と同一出力（後方互換 alias）', () => {
    const src = '段落1\n\n段落2';
    expect(renderVerticalHtml(src)).toBe(renderToTypesettingHtml(src));
  });

  it('verticalCss は縦書き組版 CSS の非空文字列', () => {
    expect(typeof verticalCss).toBe('string');
    expect(verticalCss.length).toBeGreaterThan(0);
    expect(verticalCss).toContain('writing-mode: vertical-rl');
    expect(verticalCss).toContain('.tategaki');
  });

  it('buildEmakiDocument は css を埋め込んだ完全 HTML を返す', () => {
    const html = buildEmakiDocument({
      bodyHtml: renderVerticalHtml('本文'),
      css: verticalCss,
    });
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('writing-mode: vertical-rl');
    expect(DEFAULT_LINE_LEN_PX).toBeGreaterThan(0);
  });

  it('buildPagedDocument は用紙サイズに応じた完全 HTML を返す', () => {
    const html = buildPagedDocument({
      bodyHtml: renderVerticalHtml('本文'),
      css: verticalCss,
      paper: 'a5',
    });
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('148mm 210mm');
  });

  it('parseRuby は呼び出せる（MVP は素通し）', () => {
    expect(parseRuby('テキスト')).toEqual(['テキスト']);
  });
});
