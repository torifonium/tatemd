/**
 * 汎用デバウンス。
 * 連続呼び出し中は最後の呼び出しから ms 経過後に fn を1回だけ実行する。
 * 引数は最後の呼び出し時のものが渡される。
 */

// キャンセル機能付きデバウンス関数の型
export type DebouncedFn<A extends unknown[]> = {
  (...args: A): void;
  cancel(): void;
};

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): DebouncedFn<A> {
  // ReturnType<typeof setTimeout> を使い、Node/ブラウザ双方の型に依存しない
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A): void => {
    // 前のタイマーをリセットして最後の呼び出し基準でカウントし直す
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };

  // 未発火のタイマーを明示的にキャンセルするメソッド
  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}
