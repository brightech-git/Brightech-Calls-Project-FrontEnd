"use client";
import { useEffect } from 'react';
// Custom record dialogs share keyboard focus and Escape behavior.
export function useDialogFocus() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    let returnFocus: HTMLElement | null = null;
    const update = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[data-workspace-dialog]');
      const next = dialogs.item(dialogs.length - 1);
      if (next === current) return;
      if (!next && current) returnFocus?.focus();
      if (next) {
        if (!current) returnFocus = document.activeElement as HTMLElement;
        next.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button')?.focus();
      }
      current = next;
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!current) return;
      if (event.key === 'Escape') { current.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click(); event.preventDefault(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')).filter(item => item.getClientRects().length > 0);
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', keyboard); update();
    return () => { observer.disconnect(); document.removeEventListener('keydown', keyboard); };
  }, []);
}
