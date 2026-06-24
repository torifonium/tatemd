/**
 * ローカル画像を縦書き原稿に埋め込むアダプタ。
 *
 * 方針（[[docs/superpowers/specs/2026-06-24-web-image-embed-design.md]]）:
 *   - 完全クライアントサイド（アップロードなし・外部送信なし）。画像は data URL で埋め込む。
 *   - 挿入時に canvas で長辺を縮小し WebP 再圧縮 → localStorage（約5MB）保存失敗を防ぐ。
 *   - textarea のカーソル位置に `![alt](data:...)` を挿入し、`input` イベントを発火して
 *     既存のデバウンス描画/保存（editor.ts → app.ts）を再利用する。
 */

/** 縮小の既定値: 長辺の上限(px)と再圧縮品質。 */
const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.85;

export interface DownscaleOptions {
  maxEdge?: number;
  quality?: number;
}

/** alt テキストを記法が壊れない形に正規化（角括弧除去・空白畳み）。 */
function sanitizeAlt(alt: string): string {
  return alt.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
}

/** alt と url からインライン画像記法を作る（純粋関数）。 */
export function imageMarkdown(alt: string, url: string): string {
  return `![${sanitizeAlt(alt)}](${url})`;
}

/** alt と参照ラベルから参照スタイルの画像記法を作る（本文用・短い）。 */
export function imageRefMarkdown(alt: string, label: string): string {
  return `![${sanitizeAlt(alt)}][${label}]`;
}

/** 既存テキストを走査し、未使用の `tatemd-img<N>` ラベルを返す（純粋関数）。 */
export function nextImageLabel(value: string): string {
  const re = /\[tatemd-img(\d+)\]:/g;
  let max = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    max = Math.max(max, Number(m[1]));
  }
  return `tatemd-img${max + 1}`;
}

/**
 * 参照スタイルで画像を挿入する（純粋関数）。
 * - 本文のカーソル位置には短い `![alt][label]` を挿入（エディタを base64 で埋めない）。
 * - 巨大な `[label]: <data URL>` 定義は文書の最後尾にまとめて追記する。
 * @returns 置換後テキストと、本文挿入直後のキャレット位置（最後尾の定義より手前）
 */
export function insertImageReference(
  value: string,
  start: number,
  end: number,
  alt: string,
  url: string,
): { value: string; cursor: number } {
  const label = nextImageLabel(value);
  const spliced = spliceText(value, start, end, imageRefMarkdown(alt, label));
  // 末尾の余分な空白を畳んでから、定義を最後尾へ（本文のキャレット位置は不変）
  const body = spliced.value.replace(/\s+$/, '');
  const def = `[${label}]: ${url}`;
  return { value: `${body}\n\n${def}\n`, cursor: spliced.cursor };
}

/**
 * value の [start,end) を insert で置換し、画像が独立行になるよう前後に改行を補う（純粋関数）。
 * @returns 置換後の文字列と、挿入直後のキャレット位置
 */
export function spliceText(
  value: string,
  start: number,
  end: number,
  insert: string,
): { value: string; cursor: number } {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const trail = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
  const block = lead + insert + trail;
  return { value: before + block + after, cursor: before.length + block.length };
}

/**
 * 画像ファイルを「長辺 maxEdge に縮小 → WebP(不可なら JPEG) 再圧縮」した data URL にする。
 * canvas を使うため DOM 環境専用（jsdom 不可・実機で確認）。
 */
export function fileToDataUrl(file: File, opts: DownscaleOptions = {}): Promise<string> {
  const maxEdge = opts.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight) || 1);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas 2D コンテキストを取得できませんでした'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      // WebP 優先（透過保持）。非対応なら白背景で JPEG にフォールバック。
      const webp = canvas.toDataURL('image/webp', quality);
      if (webp.startsWith('data:image/webp')) {
        resolve(webp);
        return;
      }
      const flat = document.createElement('canvas');
      flat.width = w;
      flat.height = h;
      const fctx = flat.getContext('2d');
      if (!fctx) {
        reject(new Error('canvas 2D コンテキストを取得できませんでした'));
        return;
      }
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, w, h);
      fctx.drawImage(img, 0, 0, w, h);
      resolve(flat.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = objectUrl;
  });
}

/** 画像ファイルを縮小し、alt（ファイル名）と data URL を返す。 */
export async function fileToImage(
  file: File,
  opts?: DownscaleOptions,
): Promise<{ alt: string; url: string }> {
  const url = await fileToDataUrl(file, opts);
  const alt = file.name.replace(/\.[^./\\]+$/, '');
  return { alt, url };
}

export interface ImageInput {
  /** ファイル群を縮小して textarea のカーソル位置に順次挿入する（ボタン/ドロップ/ペースト共通）。 */
  insertFiles: (files: Iterable<File> | null | undefined) => Promise<void>;
  /** リスナを解除する。 */
  dispose: () => void;
}

/**
 * textarea にドラッグ&ドロップ / ペーストでの画像挿入を結線する。
 * 戻り値の insertFiles はヘッダの「画像」ボタン（ファイル選択）からも使える。
 */
export function initImageInput(
  textarea: HTMLTextAreaElement,
  opts?: DownscaleOptions,
): ImageInput {
  const insertFiles = async (files: Iterable<File> | null | undefined): Promise<void> => {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    for (const file of images) {
      try {
        const { alt, url } = await fileToImage(file, opts);
        const { value, cursor } = insertImageReference(
          textarea.value,
          textarea.selectionStart,
          textarea.selectionEnd,
          alt,
          url,
        );
        textarea.value = value;
        textarea.selectionStart = cursor;
        textarea.selectionEnd = cursor;
        // 既存のデバウンス描画/保存（input リスナ）を再利用
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (err) {
        // 1 枚失敗しても他は続行（握りつぶさずログ）
        console.error('TATEmd: 画像の挿入に失敗しました', err);
      }
    }
  };

  const onDrop = (e: DragEvent): void => {
    const files = e.dataTransfer?.files;
    if (!files || !Array.from(files).some((f) => f.type.startsWith('image/'))) return;
    e.preventDefault();
    void insertFiles(files);
  };

  const onDragOver = (e: DragEvent): void => {
    // 画像ファイルのドラッグ時のみドロップを受け付ける
    if (Array.from(e.dataTransfer?.items ?? []).some((i) => i.kind === 'file')) {
      e.preventDefault();
    }
  };

  const onPaste = (e: ClipboardEvent): void => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = Array.from(items)
      .filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
      .map((i) => i.getAsFile())
      .filter((f): f is File => f != null);
    if (files.length === 0) return;
    e.preventDefault();
    void insertFiles(files);
  };

  textarea.addEventListener('drop', onDrop);
  textarea.addEventListener('dragover', onDragOver);
  textarea.addEventListener('paste', onPaste);

  return {
    insertFiles,
    dispose: () => {
      textarea.removeEventListener('drop', onDrop);
      textarea.removeEventListener('dragover', onDragOver);
      textarea.removeEventListener('paste', onPaste);
    },
  };
}
