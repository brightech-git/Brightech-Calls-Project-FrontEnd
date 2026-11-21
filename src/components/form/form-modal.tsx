'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { focusFirstField } from './enter-navigation';

export interface FormModalProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  /** While true, Esc, the backdrop and × do not close. */
  busy?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  /** Buttons row. Leave out when the children render their own footer. */
  footer?: ReactNode;
  /** Focus the first field when the modal opens. Default true. */
  autoFocus?: boolean;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/**
 * Modal for master forms, including the "Add new" forms opened from a combo box.
 * It stacks above another modal, focuses the first field, and gives focus
 * back to the field that opened it when it closes.
 */
export function FormModal({
  open,
  title,
  subtitle,
  onClose,
  busy,
  size = 'lg',
  children,
  footer,
  autoFocus = true,
}: FormModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(
      () => autoFocus && focusFirstField(panel.current),
    );
    return () => {
      cancelAnimationFrame(frame);
      const back = opener.current;
      requestAnimationFrame(() => back?.isConnected && back.focus());
    };
  }, [open, autoFocus]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm max-sm:p-2"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-workspace-dialog
        onKeyDown={(e) => {
          if (e.key !== 'Escape' || e.defaultPrevented) return;
          e.stopPropagation();
          if (!busy) onClose();
        }}
        className={cn(
          'flex max-h-[calc(100dvh-48px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg max-sm:max-h-[calc(100dvh-16px)] [&_form]:flex [&_form]:min-h-0 [&_form]:flex-1 [&_form]:flex-col',
          SIZES[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            tabIndex={-1}
            disabled={busy}
            data-dialog-close
            aria-label="Close"
            onClick={() => onClose()}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-white text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>
        {children}
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-white px-4 py-3 max-sm:px-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Scrolling body + sticky footer for a form inside FormModal. */
export function FormModalBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">{children}</div>;
}

export function FormModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 justify-end gap-2.5 border-t border-line bg-white px-4 py-3 max-sm:px-3">
      {children}
    </div>
  );
}
