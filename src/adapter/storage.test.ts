// @vitest-environment jsdom

import {
  loadManuscript,
  saveManuscript,
  loadPaperSize,
  savePaperSize,
} from './storage';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('loadManuscript', () => {
  it('未保存時は null を返す', () => {
    expect(loadManuscript()).toBeNull();
  });

  it('save→load で同じ文字列が得られる', () => {
    const text = '吾輩は猫である。名前はまだ無い。';
    saveManuscript(text);
    expect(loadManuscript()).toBe(text);
  });

  it('空文字を保存した場合は空文字を返す', () => {
    saveManuscript('');
    expect(loadManuscript()).toBe('');
  });

  it('getItem が throw してもクラッシュせず null を返す', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('読み込みエラー');
    });
    expect(() => loadManuscript()).not.toThrow();
    expect(loadManuscript()).toBeNull();
  });
});

describe('saveManuscript', () => {
  it('setItem が throw しても saveManuscript が throw しない', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('容量超過');
    });
    expect(() => saveManuscript('原稿テキスト')).not.toThrow();
  });
});

describe('loadPaperSize', () => {
  it('未保存時は null を返す', () => {
    expect(loadPaperSize()).toBeNull();
  });

  it("'a5' を save→load で同じ値が得られる", () => {
    savePaperSize('a5');
    expect(loadPaperSize()).toBe('a5');
  });

  it("'b6' を save→load で同じ値が得られる", () => {
    savePaperSize('b6');
    expect(loadPaperSize()).toBe('b6');
  });

  it("直接 setItem で不正値を書いた場合は null を返す", () => {
    localStorage.setItem('tatemd.paperSize.v1', 'xyz');
    expect(loadPaperSize()).toBeNull();
  });

  it("空文字を直接 setItem した場合は null を返す", () => {
    localStorage.setItem('tatemd.paperSize.v1', '');
    expect(loadPaperSize()).toBeNull();
  });

  it('getItem が throw してもクラッシュせず null を返す', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('読み込みエラー');
    });
    expect(() => loadPaperSize()).not.toThrow();
    expect(loadPaperSize()).toBeNull();
  });
});

describe('savePaperSize', () => {
  it('setItem が throw しても savePaperSize が throw しない', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('容量超過');
    });
    expect(() => savePaperSize('a5')).not.toThrow();
  });
});
