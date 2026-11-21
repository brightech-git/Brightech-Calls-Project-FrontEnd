'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { COLORS, FONT } from '@/utils/theme';
interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmDialog({
  open,
  title = 'Confirm Delete',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!isPending) onCancel();
        }}
      >
        <div
          className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg"
          data-workspace-dialog
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 grid size-11 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Trash2
              size={20}
              className="text-red-500"
            />
          </div>
          <div className="mb-2 text-lg tracking-tight">{title}</div>
          <div className="mb-3 text-sm leading-7 text-muted">{message}</div>
          <div className="flex justify-end gap-2.5">
            <button
              className={buttonClass}
              data-dialog-close
              onClick={onCancel}
              disabled={isPending}
            >
              {cancelLabel}
            </button>
            <button
              className={cn(buttonClass, buttonVariants.danger)}
              onClick={onConfirm}
              disabled={isPending}
            >
              <Trash2 size={13} />
              {isPending ? 'Deleting...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
