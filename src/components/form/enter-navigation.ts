'use client';

import { useEffect } from 'react';

// Enter moves focus to the next field, like Tab, on every form in the app.
// On the last field it submits: the container's [data-enter-submit] button is
// clicked, otherwise a <form> is submitted.
//
// Scope: fields inside a <form>, a [data-enter-nav] container or a dialog.
// Opt out with data-enter-nav="off" on a field or a container. Fields that handle
// Enter themselves (event.preventDefault()) are left alone, as are textareas,
// open dropdowns and table cells (unless the row opts in with data-enter-nav).

export const FIELD_SELECTOR = [
  'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file])',
  'select',
  'textarea',
  '[contenteditable=true]',
  '[role=combobox]',
  'button[data-enter-field]',
].join(',');

const CONTAINER_SELECTOR =
  'form, [data-enter-nav]:not([data-enter-nav=off]), [role=dialog]';

const TEXT_TYPES = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];

const isVisible = (el: HTMLElement) =>
  !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

/** A radio group counts as one stop: its checked radio, or the first one. */
function isRadioStop(el: HTMLElement, all: HTMLElement[]) {
  if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true;
  const group = all.filter(
    (x) => x instanceof HTMLInputElement && x.type === 'radio' && x.name === el.name,
  ) as HTMLInputElement[];
  const checked = group.find((x) => x.checked);
  return checked ? checked === el : group[0] === el;
}

export function fieldsIn(container: HTMLElement) {
  const all = Array.from(container.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter(
    (el) =>
      !(el as HTMLInputElement).disabled &&
      !(el as HTMLInputElement).readOnly &&
      el.tabIndex !== -1 &&
      !el.closest('[data-enter-nav=off]') &&
      !el.closest('.react-datepicker-popper') &&
      isVisible(el),
  );
  return all.filter((el) => isRadioStop(el, all));
}

/** Focuses the first field of a container (used when a form modal opens). */
export function focusFirstField(container: HTMLElement | null) {
  if (!container) return;
  const first = fieldsIn(container)[0];
  first?.focus();
  if (first instanceof HTMLInputElement && TEXT_TYPES.includes(first.type))
    first.select();
}

/**
 * Moves focus from a field to the next one in its form / [data-enter-nav] container,
 * or submits on the last field. Returns false when the field is not in a container.
 * Widgets that handle Enter themselves (combo boxes, date pickers) call this directly.
 */
export function moveToNextField(target: HTMLElement): boolean {
  const container = target.closest<HTMLElement>(CONTAINER_SELECTOR);
  if (!container) return false;
  const fields = fieldsIn(container);
  let index = fields.indexOf(target);
  if (index === -1 && target instanceof HTMLInputElement && target.type === 'radio') {
    index = fields.findIndex(
      (f) =>
        f instanceof HTMLInputElement && f.type === 'radio' && f.name === target.name,
    );
  }
  if (index === -1) return false;

  const next = fields[index + 1];
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement && TEXT_TYPES.includes(next.type)) next.select();
    return true;
  }

  const form =
    target.closest('form') ?? (container instanceof HTMLFormElement ? container : null);
  const submit =
    container.querySelector<HTMLButtonElement>('[data-enter-submit]') ??
    form?.querySelector<HTMLButtonElement>('button[type=submit]');
  if (submit && !submit.disabled) submit.click();
  else form?.requestSubmit();
  return true;
}

/** Turns on Enter-to-next-field for the whole app. Mount once, near the root. */
export function useGlobalEnterNavigation() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== 'Enter' ||
        e.defaultPrevented ||
        e.shiftKey ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.isComposing
      )
        return;
      const target = e.target as HTMLElement | null;
      if (!target || !target.matches?.(FIELD_SELECTOR)) return;
      if (target.tagName === 'TEXTAREA' || target.closest('[data-enter-nav=off]')) return;
      const table = target.closest('table');
      const optIn = target.closest('[data-enter-nav]');
      if (table && !(optIn && table.contains(optIn))) return;
      if (target.getAttribute('aria-expanded') === 'true') return;

      if (moveToNextField(target)) e.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** Component form of useGlobalEnterNavigation, for the providers tree. */
export function EnterNavigation() {
  useGlobalEnterNavigation();
  return null;
}
