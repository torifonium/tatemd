// エディタ／プレビューの境界（スプリッター）をドラッグで動かす薄い層。
// container（.app-main）の CSS 変数 --editor-w を更新して左カラム幅を変える。
// DOM 参照は adapter の責務。core は関与しない。

export interface SplitterOptions {
  /** 各ペインの最小幅(px)。これ未満には縮まない。 */
  min?: number;
  /** 初期のエディタ幅(px)。null/未指定なら CSS 既定（1fr）のまま。 */
  initial?: number | null;
  /** ドラッグ確定時にエディタ幅(px)を通知（永続化に使う）。 */
  onChange?: (editorWidthPx: number) => void;
}

/**
 * スプリッターを初期化する。
 *
 * @param container 2ペインの grid コンテナ（`.app-main`）
 * @param divider   ドラッグ対象の境界要素（`.pane-divider`）
 * @param options   最小幅・初期幅・確定コールバック
 * @returns イベントを解除する cleanup 関数
 */
export function initSplitter(
  container: HTMLElement,
  divider: HTMLElement,
  options: SplitterOptions = {},
): () => void {
  const min = options.min ?? 160;

  // 初期幅を反映
  if (options.initial != null && Number.isFinite(options.initial)) {
    container.style.setProperty('--editor-w', `${options.initial}px`);
  }

  let dragging = false;

  // container 幅と境界太さから、エディタ幅を min〜(全幅-min-境界) にクランプ
  const clampWidth = (x: number): number => {
    const rect = container.getBoundingClientRect();
    const dividerW = divider.getBoundingClientRect().width || 6;
    const max = rect.width - min - dividerW;
    return Math.max(min, Math.min(x, max));
  };

  const applyWidth = (x: number): void => {
    container.style.setProperty('--editor-w', `${clampWidth(x)}px`);
  };

  const currentWidth = (): number => {
    const raw = getComputedStyle(container).getPropertyValue('--editor-w');
    const n = parseFloat(raw);
    if (Number.isFinite(n)) return n;
    // 未設定（1fr）の場合は実測でエディタ実幅を返す
    return divider.getBoundingClientRect().left - container.getBoundingClientRect().left;
  };

  const onPointerDown = (e: PointerEvent): void => {
    dragging = true;
    divider.classList.add('is-dragging');
    divider.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    applyWidth(e.clientX - rect.left);
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove('is-dragging');
    if (divider.hasPointerCapture(e.pointerId)) divider.releasePointerCapture(e.pointerId);
    options.onChange?.(currentWidth());
  };

  // キーボード操作（アクセシビリティ）: 左右矢印で 16px ずつ
  const onKeyDown = (e: KeyboardEvent): void => {
    const step = 16;
    if (e.key === 'ArrowLeft') {
      applyWidth(currentWidth() - step);
      options.onChange?.(currentWidth());
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      applyWidth(currentWidth() + step);
      options.onChange?.(currentWidth());
      e.preventDefault();
    }
  };

  divider.addEventListener('pointerdown', onPointerDown);
  divider.addEventListener('pointermove', onPointerMove);
  divider.addEventListener('pointerup', onPointerUp);
  divider.addEventListener('keydown', onKeyDown);

  return (): void => {
    divider.removeEventListener('pointerdown', onPointerDown);
    divider.removeEventListener('pointermove', onPointerMove);
    divider.removeEventListener('pointerup', onPointerUp);
    divider.removeEventListener('keydown', onKeyDown);
  };
}
