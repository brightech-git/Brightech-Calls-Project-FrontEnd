"use client";

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
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      <style>{`
        .cd-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          animation: cd-fade-in 0.15s ease;
        }
        @keyframes cd-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .cd-box {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          padding: 28px 28px 22px;
          width: 100%;
          max-width: 380px;
          animation: cd-slide-up 0.18s ease;
        }
        @keyframes cd-slide-up {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .cd-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: #fee2e2;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .cd-title {
          font-size: 15px; font-weight: 700; color: ${COLORS.textPrimary};
          margin-bottom: 6px;
          font-family: ${FONT.family};
        }
        .cd-message {
          font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.5;
          font-family: ${FONT.family};
          margin-bottom: 22px;
        }
        .cd-actions {
          display: flex; gap: 10px; justify-content: flex-end;
        }
        .cd-btn-cancel {
          height: 36px; padding: 0 16px; border-radius: 8px;
          border: 1px solid #d1d5db; background: #ffffff;
          color: ${COLORS.textSecondary}; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .cd-btn-cancel:hover { background: #f3f4f6; }

        .cd-btn-confirm {
          height: 36px; padding: 0 16px; border-radius: 8px;
          border: none; background: #ef4444;
          color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background 0.15s;
        }
        .cd-btn-confirm:hover { background: #dc2626; }
        .cd-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="cd-overlay" onClick={onCancel}>
        <div className="cd-box" onClick={(e) => e.stopPropagation()}>
          <div className="cd-icon">
            <Trash2 size={20} color="#ef4444" />
          </div>
          <div className="cd-title">{title}</div>
          <div className="cd-message">{message}</div>
          <div className="cd-actions">
            <button className="cd-btn-cancel" onClick={onCancel} disabled={isPending}>
              {cancelLabel}
            </button>
            <button className="cd-btn-confirm" onClick={onConfirm} disabled={isPending}>
              <Trash2 size={13} />
              {isPending ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
