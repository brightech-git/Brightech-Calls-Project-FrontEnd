"use client";

import { ui } from "@/utils/ui";
import { Trash2 } from "lucide-react";
import { COLORS, FONT } from "@/utils/theme";
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
  title = "Confirm Delete",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null;
  return <>
      

      <div className={ui("cd-overlay")} onClick={() => {
      if (!isPending) onCancel();
    }}>
        <div className={ui("cd-box")} data-workspace-dialog role="alertdialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
          <div className={ui("cd-icon")}>
            <Trash2 size={20} className={ui("[color:#ef4444]!")} />
          </div>
          <div className={ui("cd-title")}>{title}</div>
          <div className={ui("cd-message")}>{message}</div>
          <div className={ui("cd-actions")}>
            <button className={ui("cd-btn-cancel")} data-dialog-close onClick={onCancel} disabled={isPending}>
              {cancelLabel}
            </button>
            <button className={ui("cd-btn-confirm")} onClick={onConfirm} disabled={isPending}>
              <Trash2 size={13} />
              {isPending ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>;
}
