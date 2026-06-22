/**
 * textarea の input イベントを購読し、現在値をコールバックへ通知する薄い層。
 * デバウンスは持たない。呼び出し側（app.ts）がデバウンス済みコールバックを渡す。
 */

/**
 * textarea の input イベントを監視し、発火のたびに onInput(textarea.value) を呼ぶ。
 * 戻り値はリスナ解除関数（cleanup）。
 *
 * 契約: 1 つの textarea につき 1 回だけ呼ぶこと。再初期化（HMR 等）する場合は
 * 先に前回の cleanup を呼ぶ。重複呼び出しすると onInput が二重発火する。
 *
 * @param textarea 対象の textarea 要素
 * @param onInput  入力値を受け取るコールバック
 * @returns リスナを解除する cleanup 関数
 */
export function initEditor(
  textarea: HTMLTextAreaElement,
  onInput: (value: string) => void,
): () => void {
  const handler = (): void => {
    onInput(textarea.value);
  };

  textarea.addEventListener('input', handler);

  // cleanup: input リスナを解除する
  return (): void => {
    textarea.removeEventListener('input', handler);
  };
}
