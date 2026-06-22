// @vitest-environment jsdom
import { initEditor } from './editor';

describe('initEditor', () => {
  it('input イベントで onInput がテキスト値とともに呼ばれる', () => {
    const textarea = document.createElement('textarea');
    const onInput = vi.fn();

    initEditor(textarea, onInput);

    textarea.value = 'あ';
    textarea.dispatchEvent(new Event('input'));

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith('あ');
  });

  it('複数回 input イベントが発火するたびに onInput が都度呼ばれる', () => {
    const textarea = document.createElement('textarea');
    const onInput = vi.fn();

    initEditor(textarea, onInput);

    textarea.value = '一';
    textarea.dispatchEvent(new Event('input'));

    textarea.value = '一二';
    textarea.dispatchEvent(new Event('input'));

    textarea.value = '一二三';
    textarea.dispatchEvent(new Event('input'));

    expect(onInput).toHaveBeenCalledTimes(3);
    expect(onInput).toHaveBeenNthCalledWith(1, '一');
    expect(onInput).toHaveBeenNthCalledWith(2, '一二');
    expect(onInput).toHaveBeenNthCalledWith(3, '一二三');
  });

  it('cleanup 関数を呼ぶと以後の input イベントで onInput が呼ばれない', () => {
    const textarea = document.createElement('textarea');
    const onInput = vi.fn();

    const cleanup = initEditor(textarea, onInput);

    // cleanup 前は正常に呼ばれる
    textarea.value = 'before';
    textarea.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalledTimes(1);

    // cleanup 後は呼ばれない
    cleanup();
    textarea.value = 'after';
    textarea.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalledTimes(1);
  });
});
