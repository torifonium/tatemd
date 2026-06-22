/**
 * LocalStorage への原稿・用紙サイズの読み書き。
 * 将来 VSCode 等への差し替えを考慮した薄いインターフェース境界。
 * localStorage の無効化・容量超過・SecurityError 等で例外が発生しても
 * アプリを止めない（FR-005）。
 */

// 用紙サイズの型（後続タスクがここから import する）
export type PaperSize = 'a5' | 'b6';

// LocalStorage キー（バージョン付き・将来のスキーマ変更に備える）
const STORAGE_KEYS = {
  manuscript: 'tatemd.manuscript.v1',
  paperSize: 'tatemd.paperSize.v1',
} as const;

// PaperSize として有効な値のセット
const VALID_PAPER_SIZES: ReadonlySet<string> = new Set<PaperSize>(['a5', 'b6']);

// localStorage にアクセス可能かを確認する。
// プライベートモード等で localStorage 参照自体が例外を投げる場合もあるため
// typeof チェックと try/catch を併用する。
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

/**
 * 保存済みの原稿を読み込む。
 * 未保存・読み込み失敗時は null を返す。
 */
export function loadManuscript(): string | null {
  try {
    const storage = getStorage();
    if (storage === null) {
      return null;
    }
    return storage.getItem(STORAGE_KEYS.manuscript);
  } catch {
    return null;
  }
}

/**
 * 原稿を保存する。
 * 保存に失敗しても例外を投げない（黙って何もしない）。
 */
export function saveManuscript(text: string): void {
  try {
    const storage = getStorage();
    if (storage === null) {
      return;
    }
    storage.setItem(STORAGE_KEYS.manuscript, text);
  } catch {
    // 容量超過・SecurityError 等を握りつぶす
  }
}

/**
 * 保存済みの用紙サイズを読み込む。
 * 未保存・'a5'|'b6' 以外の値・読み込み失敗時は null を返す。
 */
export function loadPaperSize(): PaperSize | null {
  try {
    const storage = getStorage();
    if (storage === null) {
      return null;
    }
    const value = storage.getItem(STORAGE_KEYS.paperSize);
    if (value === null) {
      return null;
    }
    // 不正値バリデーション
    if (!VALID_PAPER_SIZES.has(value)) {
      return null;
    }
    return value as PaperSize;
  } catch {
    return null;
  }
}

/**
 * 用紙サイズを保存する。
 * 保存に失敗しても例外を投げない（黙って何もしない）。
 */
export function savePaperSize(size: PaperSize): void {
  try {
    const storage = getStorage();
    if (storage === null) {
      return;
    }
    storage.setItem(STORAGE_KEYS.paperSize, size);
  } catch {
    // 容量超過・SecurityError 等を握りつぶす
  }
}
