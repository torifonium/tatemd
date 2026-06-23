import { describe, it, expect } from 'vitest';
import { buildEmakiDocument, DEFAULT_LINE_LEN_PX } from './emakiDocument';

describe('buildEmakiDocument', () => {
  const base = { bodyHtml: '<h1>水底の灯</h1><p>本文</p>', css: '.tategaki{writing-mode:vertical-rl}' };

  it('本文 HTML と組版 CSS を埋め込む', () => {
    const html = buildEmakiDocument(base);
    expect(html).toContain('<h1>水底の灯</h1><p>本文</p>');
    expect(html).toContain('.tategaki{writing-mode:vertical-rl}');
  });

  it('横長1枚化の核心: 印刷時に html/body 高さを行長へ固定し overflow:hidden にする', () => {
    const html = buildEmakiDocument(base);
    // @media print 内に html, body の高さ固定 + overflow:hidden が含まれること
    expect(html).toMatch(/@media print\s*\{[\s\S]*html,\s*body\s*\{\s*height:\s*640px;\s*overflow:\s*hidden;/);
  });

  it('既定の行長は DEFAULT_LINE_LEN_PX', () => {
    expect(DEFAULT_LINE_LEN_PX).toBe(640);
    const html = buildEmakiDocument(base);
    expect(html).toContain(`height: ${DEFAULT_LINE_LEN_PX}px`);
  });

  it('lineLenPx 指定が CSS と計測スクリプトの両方に反映される', () => {
    const html = buildEmakiDocument({ ...base, lineLenPx: 800 });
    expect(html).toContain('height: 800px');
    expect(html).toContain('var LINE = 800');
  });

  it('描画後に @page を実測幅で決める計測スクリプトを含む', () => {
    const html = buildEmakiDocument(base);
    expect(html).toContain("getElementById('tatemd-page')");
    expect(html).toContain('scrollWidth');
    expect(html).toContain('@page{size:');
  });

  it('印刷時に非表示の保存ボタンを含む', () => {
    const html = buildEmakiDocument(base);
    expect(html).toContain('window.print()');
    expect(html).toMatch(/\.tatemd-toolbar\s*\{\s*display:\s*none/);
  });
});
