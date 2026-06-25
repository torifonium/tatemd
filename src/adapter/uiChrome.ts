/**
 * UI クローム（ヘルプモーダル・初回ヒント帯）の結線。
 * いずれも完全クライアントサイド。初回ヒントは localStorage で「初回だけ」表示する。
 */

const ONBOARDED_KEY = 'tatemd:onboarded';

function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false; // localStorage 不可な環境では毎回出すより、出さない方が安全側…ではないが
  }
}

function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* 容量超過等は無視（ヒントが再表示されるだけ） */
  }
}

/** ヘルプモーダルを ? ボタン・閉じる・背景クリック・Escape で開閉する。 */
function initHelp(): void {
  const openBtn = document.querySelector<HTMLButtonElement>('.help-btn');
  const overlay = document.querySelector<HTMLElement>('.help-overlay');
  const closeBtn = overlay?.querySelector<HTMLButtonElement>('.help-close');
  if (!openBtn || !overlay) return;

  const open = (): void => {
    overlay.hidden = false;
    overlay.classList.add('is-open');
    closeBtn?.focus();
  };
  const close = (): void => {
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  // 背景（カード外）クリックで閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  // Escape で閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
}

/** 初回訪問時のみヒント帯を表示し、「わかった」で次回から出さない。 */
function initOnboarding(): void {
  const band = document.querySelector<HTMLElement>('.hint-band');
  const dismiss = band?.querySelector<HTMLButtonElement>('.hint-close');
  if (!band) return;

  if (isOnboarded()) return;

  band.hidden = false;
  band.classList.add('is-open');

  const hide = (): void => {
    band.classList.remove('is-open');
    band.hidden = true;
    markOnboarded();
  };
  dismiss?.addEventListener('click', hide);
}

/** ヘルプと初回ヒントを初期化する。 */
export function initUiChrome(): void {
  initHelp();
  initOnboarding();
}
