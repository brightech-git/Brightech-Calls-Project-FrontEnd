"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/Auth/useAuth";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { Eye, EyeOff, Bolt } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login(
      { username, password },
      {
        onSuccess: () => {
          localStorage.setItem("isLoggedIn", "true");
          router.push("/Home");
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Invalid username or password."
          );
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      if (!form) return;
      const inputs = Array.from(form.querySelectorAll<HTMLElement>("input:not([disabled])"));
      const idx = inputs.indexOf(e.target as HTMLElement);
      if (idx >= 0 && idx < inputs.length - 1) inputs[idx + 1].focus();
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${COLORS.contentBg};
          font-family: ${FONT.family};
        }
        .login-card {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          box-shadow: 0 4px 24px ${COLORS.cardShadow};
          width: 100%;
          max-width: 360px;
          padding: 32px 28px 28px;
        }
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .login-logo-icon {
          width: 36px; height: 36px;
          border-radius: ${RADIUS.md};
          background: ${COLORS.sidebarLogoIconBg};
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.sidebarLogoIconColor};
        }
        .login-logo-text {
          font-size: 16px; font-weight: 700;
          color: ${COLORS.textPrimary}; letter-spacing: -0.02em;
        }
        .login-logo-sub {
          font-size: 10px; color: ${COLORS.textMuted};
          font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .login-field { display: flex; flex-direction: column; gap: 5px; width: 100%; }
        .login-label {
          font-size: 11px; font-weight: 700;
          color: ${COLORS.textSecondary};
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%; height: 36px;
          background: ${COLORS.inputBg};
          border: 1px solid ${COLORS.inputBorder};
          border-radius: ${RADIUS.md};
          color: ${COLORS.inputText};
          font-size: 13px; font-family: inherit;
          padding: 0 36px 0 10px;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: ${COLORS.inputPlaceholder}; }
        .login-input:focus {
          border-color: ${COLORS.inputBorderFocus};
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15);
        }
        .login-eye {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: ${COLORS.textMuted}; display: flex; align-items: center;
          padding: 0;
        }
        .login-error {
          font-size: 12px; color: ${COLORS.error};
          width: 100%; margin-top: -4px;
        }
        .login-btn {
          width: 100%; height: 38px;
          background: ${COLORS.btnPrimaryBg};
          color: ${COLORS.btnPrimaryText};
          border: none; border-radius: ${RADIUS.md};
          font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: background 0.15s;
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) { background: ${COLORS.btnPrimaryHover}; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon"><Bolt size={18} /></div>
            <div>
              <div className="login-logo-text">Brightech</div>
              <div className="login-logo-sub">Calls Management</div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div className="login-field">
                <label className="login-label">Username</label>
                <div className="login-input-wrap">
                  <input
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Enter username"
                    onKeyDown={handleKeyDown}
                    tabIndex={1}
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    className="login-input"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    tabIndex={2}
                  />
                  <button type="button" className="login-eye" tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-btn" disabled={isPending} tabIndex={3}>
                {isPending ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
