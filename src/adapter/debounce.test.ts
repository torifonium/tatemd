import { debounce } from './debounce';

// フェイクタイマーを使ってデバウンスの発火タイミングを検証する
afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('ms 未満で複数回呼んでも fn は発火しない', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    // 99ms 経過時点ではまだ発火しない
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
  });

  it('最後の呼び出しから ms 経過で fn がちょうど1回発火する', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    // 100ms ちょうど経過で1回だけ発火する
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('連続呼び出しでタイマーがリセットされる（最後の呼び出し基準で発火）', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    // 最初の呼び出し
    debouncedFn();
    // 80ms 後に再度呼び出す（タイマーがリセットされる）
    vi.advanceTimersByTime(80);
    debouncedFn();

    // 最初の呼び出しから 100ms 経過しても、まだ発火しない
    vi.advanceTimersByTime(20);
    expect(fn).not.toHaveBeenCalled();

    // 2回目の呼び出しから 100ms 経過で発火する
    vi.advanceTimersByTime(80);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fn に渡る引数が最後の呼び出しの引数であること', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    // 複数回呼び出し、引数を変える
    debouncedFn('first', 1);
    debouncedFn('second', 2);
    debouncedFn('last', 3);

    vi.advanceTimersByTime(100);

    // 最後の呼び出しの引数が渡される
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('last', 3);
  });

  it('cancel() で未発火のタイマーをキャンセルできる', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn.cancel();

    // タイマーをキャンセルしたので 100ms 経過しても発火しない
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});
