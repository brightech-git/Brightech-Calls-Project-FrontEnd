/** Fields Enter can move to, in DOM order inside the form. */
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled]):not([readonly])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  'button:not([disabled]):not([tabindex="-1"])',
].join(",");

const isVisible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

/**
 * Moves focus from a field to the next one in its <form>, like Tab.
 * Returns false when the field is not inside a form or is the last one.
 */
export function focusNextField(from: HTMLElement): boolean {
  const form = from.closest("form");
  if (!form) return false;
  const fields = Array.from(form.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter(
    (el) => el.tabIndex !== -1 && isVisible(el),
  );
  const next = fields[fields.indexOf(from) + 1];
  if (!next) return false;
  next.focus();
  if (next instanceof HTMLInputElement) next.select?.();
  return true;
}
