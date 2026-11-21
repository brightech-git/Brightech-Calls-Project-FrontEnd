'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { COLORS, FONT, RADIUS } from '@/utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}
interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  {
    bg: string;
    border: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: COLORS.successBg,
    border: 'var(--success-border)',
    color: COLORS.success,
    icon: <CheckCircle size={16} />,
  },
  error: {
    bg: COLORS.errorBg,
    border: 'var(--error-border)',
    color: COLORS.error,
    icon: <XCircle size={16} />,
  },
  warning: {
    bg: COLORS.warningBg,
    border: 'var(--warning-border)',
    color: COLORS.warning,
    icon: <AlertTriangle size={16} />,
  },
  info: {
    bg: COLORS.infoBg,
    border: 'var(--info-border)',
    color: COLORS.info,
    icon: <Info size={16} />,
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++counter.current;
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
        },
      ]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );
  const success = useCallback(
    (t: string, m?: string) => showToast('success', t, m),
    [showToast],
  );
  const error = useCallback(
    (t: string, m?: string) => showToast('error', t, m),
    [showToast],
  );
  const warning = useCallback(
    (t: string, m?: string) => showToast('warning', t, m),
    [showToast],
  );
  const info = useCallback(
    (t: string, m?: string) => showToast('info', t, m),
    [showToast],
  );
  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* ── Toast Container ── */}
      <div
        className="fixed right-4 bottom-4 z-[9999] grid max-w-[min(360px,calc(100vw-24px))] gap-2 max-sm:right-3 max-sm:bottom-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const cfg = TOAST_CONFIG[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
              className="flex max-w-90 min-w-64 animate-toast-in items-start gap-2 rounded-lg px-3 py-2 shadow-md"
            >
              {/* Icon */}
              <span
                style={{
                  color: cfg.color,
                }}
                className="mt-px shrink-0"
              >
                {cfg.icon}
              </span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] leading-snug font-semibold text-ink"
                >
                  {toast.title}
                </div>
                {toast.message && (
                  <div
                    className="mt-0.5 text-xs leading-snug text-ink"
                  >
                    {toast.message}
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => remove(toast.id)}
                className="flex shrink-0 cursor-pointer items-center text-muted hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext);
}
