'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface FloatingRect {
  top: number;
  left: number;
  width: number;
  above: boolean;
}

/** Keeps a portal list next to its input while it is open, flipping above near the bottom. */
export function useFloatingList(
  anchor: RefObject<HTMLElement | null>,
  open: boolean,
  minWidth = 220,
) {
  const [rect, setRect] = useState<FloatingRect | null>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const box = anchor.current?.getBoundingClientRect();
      if (!box) return;
      const above = box.bottom + 280 > window.innerHeight && box.top > 280;
      const width = Math.max(box.width, minWidth);
      setRect({
        top: above ? box.top - 4 : box.bottom + 4,
        left: Math.min(box.left, window.innerWidth - width - 8),
        width,
        above,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor, open, minWidth]);
  return open ? rect : null;
}

export const listClass =
  'fixed z-[1500] max-h-60 overflow-y-auto rounded-md border border-line bg-white py-1 text-[13px] text-ink shadow-lg';

export const optionClass =
  'flex cursor-pointer items-center gap-2 px-2.5 py-1.5 data-[active=true]:bg-brand-soft data-[active=true]:text-brand aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

let lastPointer = { x: -1, y: -1 };
/**
 * True only when the pointer itself moved. Arrow keys scroll the list under a
 * still mouse, and the browser then reports hover on whatever option slid under
 * it; without this check the highlight jumps to that option (often the last one).
 */
export function pointerMoved(event: { clientX: number; clientY: number }) {
  const moved = event.clientX !== lastPointer.x || event.clientY !== lastPointer.y;
  lastPointer = { x: event.clientX, y: event.clientY };
  return moved;
}
