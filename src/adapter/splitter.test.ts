// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { initSplitter } from './splitter';

describe('initSplitter', () => {
  let container: HTMLElement;
  let divider: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    divider = document.createElement('div');
    container.appendChild(divider);
    document.body.appendChild(container);
  });

  it('initial 指定でエディタ幅 CSS 変数を設定する', () => {
    initSplitter(container, divider, { initial: 300 });
    expect(container.style.getPropertyValue('--editor-w')).toBe('300px');
  });

  it('initial 未指定なら CSS 変数を設定しない', () => {
    initSplitter(container, divider, {});
    expect(container.style.getPropertyValue('--editor-w')).toBe('');
  });

  it('cleanup 関数を返し、呼んでも例外を投げない', () => {
    const cleanup = initSplitter(container, divider, { initial: 200 });
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});
