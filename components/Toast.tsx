"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  success:   () => {},
  error:     () => {},
  warning:   () => {},
  info:      () => {},
});

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: COLORS.success,  icon: <CheckCircle  size={16} /> },
  error:   { bg: "#fef2f2", border: "#fecaca", color: COLORS.error,    icon: <XCircle      size={16} /> },
  warning: { bg: "#fffbeb", border: "#fde68a", color: COLORS.warning,  icon: <AlertTriangle size={16} /> },
  info:    { bg: "#eff6ff", border: "#bfdbfe", color: COLORS.info,     icon: <Info          size={16} /> },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((t: string, m?: string) => showToast("success", t, m), [showToast]);
  const error   = useCallback((t: string, m?: string) => showToast("error",   t, m), [showToast]);
  const warning = useCallback((t: string, m?: string) => showToast("warning", t, m), [showToast]);
  const info    = useCallback((t: string, m?: string) => showToast("info",    t, m), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* ── Toast Container ── */}
      <div style={{
        position: "fixed", bottom: 20, right: 20,
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 9999, fontFamily: FONT.family,
      }}>
        {toasts.map((toast) => {
          const cfg = TOAST_CONFIG[toast.type];
          return (
            <div key={toast.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: RADIUS.lg,
              padding: "10px 14px",
              minWidth: 280, maxWidth: 380,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              animation: "toast-in 0.2s ease",
            }}>
              {/* Icon */}
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon}
              </span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.3 }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.4 }}>
                    {toast.message}
                  </div>
                )}
              </div>

              {/* Close */}
              <button onClick={() => remove(toast.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.textMuted, padding: 0, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext);
}
