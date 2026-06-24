import { describe, it, expect } from 'vitest';
import {
  imageMarkdown,
  imageRefMarkdown,
  nextImageLabel,
  insertImageReference,
  spliceText,
} from './imageInsert';

describe('imageMarkdown', () => {
  it('alt と url から画像記法を作る', () => {
    expect(imageMarkdown('写真', 'data:image/webp;base64,AAA')).toBe(
      '![写真](data:image/webp;base64,AAA)',
    );
  });

  it('alt から角括弧を除き空白を畳む（記法が壊れない）', () => {
    expect(imageMarkdown('a [b] \n c', 'u')).toBe('![a b c](u)');
  });
});

describe('imageRefMarkdown', () => {
  it('参照スタイルの記法を作る', () => {
    expect(imageRefMarkdown('写真', 'tatemd-img1')).toBe('![写真][tatemd-img1]');
  });
});

describe('nextImageLabel', () => {
  it('定義が無ければ tatemd-img1', () => {
    expect(nextImageLabel('本文だけ')).toBe('tatemd-img1');
  });
  it('既存の最大番号+1 を返す', () => {
    const v = 'x\n[tatemd-img1]: data:...\n[tatemd-img3]: data:...';
    expect(nextImageLabel(v)).toBe('tatemd-img4');
  });
});

describe('insertImageReference', () => {
  it('本文に短い参照を挿入し、定義を最後尾へ追記する', () => {
    const r = insertImageReference('あいうえお', 2, 2, '猫', 'data:image/webp;base64,ZZZ');
    // 本文側は短い参照のみ（base64 で埋めない）
    expect(r.value).toContain('![猫][tatemd-img1]');
    expect(r.value).not.toMatch(/あい.*base64.*うえお/s);
    // 定義は最後尾
    expect(r.value.trimEnd().endsWith('[tatemd-img1]: data:image/webp;base64,ZZZ')).toBe(true);
    // キャレットは本文の参照直後（最後尾の定義より手前）
    expect(r.cursor).toBeLessThan(r.value.indexOf('[tatemd-img1]: '));
  });

  it('2枚目はラベルが連番になる', () => {
    const first = insertImageReference('本文', 2, 2, 'a', 'urlA');
    const second = insertImageReference(first.value, first.cursor, first.cursor, 'b', 'urlB');
    expect(second.value).toContain('![a][tatemd-img1]');
    expect(second.value).toContain('![b][tatemd-img2]');
    expect(second.value).toContain('[tatemd-img1]: urlA');
    expect(second.value).toContain('[tatemd-img2]: urlB');
  });
});

describe('spliceText', () => {
  it('空文字に挿入（前後改行は付かない）', () => {
    const r = spliceText('', 0, 0, 'X');
    expect(r.value).toBe('X');
    expect(r.cursor).toBe(1);
  });

  it('文中カーソルに挿入すると前後へ改行を補い独立行にする', () => {
    const r = spliceText('あいうえお', 2, 2, 'X');
    expect(r.value).toBe('あい\nX\nうえお');
    expect(r.cursor).toBe('あい\nX\n'.length);
  });

  it('既に改行境界なら余分な改行を足さない', () => {
    const r = spliceText('あい\nうえ', 3, 3, 'X');
    // before='あい\n'（改行で終わる）/ after='うえ' → 末尾側だけ改行付与
    expect(r.value).toBe('あい\nX\nうえ');
  });

  it('選択範囲を置換する', () => {
    const r = spliceText('abcde', 1, 4, 'X');
    // before='a'（改行なし→前に改行）/ after='e'（前に改行）
    expect(r.value).toBe('a\nX\ne');
  });

  it('末尾に挿入（after が空なら末尾改行は付かない）', () => {
    const r = spliceText('abc', 3, 3, 'X');
    expect(r.value).toBe('abc\nX');
  });
});
