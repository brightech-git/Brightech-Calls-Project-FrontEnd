"use client";

import { ui } from "@/utils/ui";
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
  info: () => {}
});

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  bg: string;
  border: string;
  color: string;
  icon: React.ReactNode;
}> = {
  success: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    color: COLORS.success,
    icon: <CheckCircle size={16} />
  },
  error: {
    bg: "#fef2f2",
    border: "#fecaca",
    color: COLORS.error,
    icon: <XCircle size={16} />
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: COLORS.warning,
    icon: <AlertTriangle size={16} />
  },
  info: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    color: COLORS.info,
    icon: <Info size={16} />
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, {
      id,
      type,
      title,
      message
    }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);
  const success = useCallback((t: string, m?: string) => showToast("success", t, m), [showToast]);
  const error = useCallback((t: string, m?: string) => showToast("error", t, m), [showToast]);
  const warning = useCallback((t: string, m?: string) => showToast("warning", t, m), [showToast]);
  const info = useCallback((t: string, m?: string) => showToast("info", t, m), [showToast]);
  return <ToastContext.Provider value={{
    showToast,
    success,
    error,
    warning,
    info
  }}>
      {children}

      {/* ── Toast Container ── */}
      <div className={ui("[position:fixed] [bottom:20px] [right:20px] [display:flex] [flex-direction:column] [gap:8px] [z-index:9999] [font-family:var(--font-poppins),_'Poppins',_sans-serif]")}>
        {toasts.map(toast => {
        const cfg = TOAST_CONFIG[toast.type];
        return <div key={toast.id} style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`
        }} className={ui("[display:flex] [align-items:flex-start] [gap:10px] [border-radius:14px] [padding:10px_14px] [min-width:280px] [max-width:380px] [box-shadow:0_4px_16px_rgba(0,0,0,0.08)] [animation:toast-in_0.2s_ease]")}>
              {/* Icon */}
              <span style={{
            color: cfg.color
          }} className={ui("[flex-shrink:0] [margin-top:1px]")}>
                {cfg.icon}
              </span>

              {/* Text */}
              <div className={ui("[flex:1] [min-width:0]")}>
                <div className={ui("[font-size:13px] [font-weight:600] [color:var(--text-main)] [line-height:1.3]")}>
                  {toast.title}
                </div>
                {toast.message && <div className={ui("[font-size:12px] [color:#34445d] [margin-top:2px] [line-height:1.4]")}>
                    {toast.message}
                  </div>}
              </div>

              {/* Close */}
              <button onClick={() => remove(toast.id)} className={ui("[background:none] [border:none] [cursor:pointer] [color:var(--text-muted)] [padding:0] [flex-shrink:0] [display:flex] [align-items:center]")}>
                <X size={14} />
              </button>
            </div>;
      })}
      </div>

      
    </ToastContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext);
}
