// renderToTypesettingHtml の単体テスト（Tier 1 記法）
import { describe, it, expect } from 'vitest';
import { renderToTypesettingHtml } from './markdown';

describe('renderToTypesettingHtml', () => {
  // 出力が .tategaki ラッパで始まることを確認
  it('出力が <div class="tategaki"> で始まる', () => {
    const html = renderToTypesettingHtml('テスト');
    expect(html).toMatch(/^<div class="tategaki">/);
  });

  // 空文字でも例外を投げず .tategaki ラッパを返す
  it('空文字入力でも例外を投げず .tategaki ラッパを返す', () => {
    expect(() => renderToTypesettingHtml('')).not.toThrow();
    expect(renderToTypesettingHtml('')).toContain('<div class="tategaki">');
  });

  // 見出しレベル: # → h1、### → h3
  it('# が h1 を生成する', () => {
    const html = renderToTypesettingHtml('# 見出し一');
    expect(html).toContain('<h1>見出し一</h1>');
  });

  it('### が h3 を生成する', () => {
    const html = renderToTypesettingHtml('### 見出し三');
    expect(html).toContain('<h3>見出し三</h3>');
  });

  // 強調: **bold** → <strong>、*em* → <em>
  it('**bold** が <strong> を生成する', () => {
    const html = renderToTypesettingHtml('**太字**');
    expect(html).toContain('<strong>太字</strong>');
  });

  it('*em* が <em> を生成する', () => {
    const html = renderToTypesettingHtml('*斜体*');
    expect(html).toContain('<em>斜体</em>');
  });

  // 箇条書き: - → ul > li
  it('箇条書きが ul > li を生成する', () => {
    const html = renderToTypesettingHtml('- りんご\n- みかん');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>りんご</li>');
    expect(html).toContain('<li>みかん</li>');
  });

  // 順序付きリスト: 1. → ol > li
  it('順序付きリストが ol > li を生成する', () => {
    const html = renderToTypesettingHtml('1. 一番目\n2. 二番目');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>一番目</li>');
    expect(html).toContain('<li>二番目</li>');
  });

  // 水平線: --- → <hr>
  it('--- が hr を生成する', () => {
    const html = renderToTypesettingHtml('---');
    expect(html).toContain('<hr');
  });

  // 引用: > → blockquote
  it('> が blockquote を生成する', () => {
    const html = renderToTypesettingHtml('> 引用文');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('引用文');
  });

  // breaks: true により本文中の単一改行が <br> になる
  it('段落内の単一改行が <br> になる', () => {
    const html = renderToTypesettingHtml('一行目\n二行目');
    expect(html).toContain('<br');
  });

  // XSS 対策: <script> がエスケープされ実行可能な形で出ない
  it('<script>alert(1)</script> がエスケープされ実行可能な形で出ない', () => {
    const html = renderToTypesettingHtml('<script>alert(1)</script>');
    // 生の <script> タグが含まれていないこと
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('</script>');
    // エスケープ済みの形（&lt;script&gt; 等）で含まれること
    expect(html).toContain('&lt;script&gt;');
  });

  // XSS 対策: 危険属性付きの生 HTML もエスケープされる
  it('生 HTML（onerror 付き img）がエスケープされる', () => {
    const html = renderToTypesettingHtml('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  // 見出しレベル境界: h2 / h4 / h6 まで（#〜###### が Tier 1）
  it('## が h2、#### が h4、###### が h6 を生成する', () => {
    expect(renderToTypesettingHtml('## 二')).toContain('<h2>二</h2>');
    expect(renderToTypesettingHtml('#### 四')).toContain('<h4>四</h4>');
    expect(renderToTypesettingHtml('###### 六')).toContain('<h6>六</h6>');
  });

  // 水平線の文脈依存: 空行＋--- は hr、段落直後の --- は setext h2
  it('空行を挟んだ --- は hr になる', () => {
    const html = renderToTypesettingHtml('段落\n\n---');
    expect(html).toContain('<hr');
    expect(html).not.toContain('<h2');
  });

  it('段落直後の --- は setext 見出し(h2)になる', () => {
    const html = renderToTypesettingHtml('見出し\n---');
    expect(html).toContain('<h2>見出し</h2>');
  });

  // <br>（単一改行）と段落（空行）の境界が共存する
  it('"a\\nb\\n\\nc" が <br>1個・<p>2個になる', () => {
    const html = renderToTypesettingHtml('a\nb\n\nc');
    expect((html.match(/<br/g) ?? []).length).toBe(1);
    expect((html.match(/<p>/g) ?? []).length).toBe(2);
  });

  // 空白のみ入力でも例外を投げない
  it('空白のみ入力でも例外を投げない', () => {
    expect(() => renderToTypesettingHtml('   \n  \t ')).not.toThrow();
    expect(renderToTypesettingHtml('   \n  ')).toMatch(/^<div class="tategaki">/);
  });

  // --- Tier 境界: Tier 2/3 記法は Tier 1 では描画されない（無効化の意図を固定）---
  it('Tier 2 リンク [x](url) は <a> を生成しない', () => {
    const html = renderToTypesettingHtml('[リンク](https://example.com)');
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('href');
  });

  it('Tier 2 画像 ![alt](src) は <img> を生成しない', () => {
    const html = renderToTypesettingHtml('![代替](pic.png)');
    expect(html).not.toContain('<img');
  });

  it('Tier 3 インラインコード `x` は <code> を生成しない', () => {
    const html = renderToTypesettingHtml('これは `コード` です');
    expect(html).not.toContain('<code>');
  });

  it('Tier 3 フェンスコードブロックは <pre>/<code> を生成しない', () => {
    const html = renderToTypesettingHtml('```\nconst a = 1;\n```');
    expect(html).not.toContain('<pre>');
    expect(html).not.toContain('<code>');
  });

  it('打消し線 ~~x~~ は <s>/<del> を生成しない', () => {
    const html = renderToTypesettingHtml('~~消し~~');
    expect(html).not.toContain('<s>');
    expect(html).not.toContain('<del>');
  });
});
