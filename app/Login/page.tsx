"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, UserCircle, Building2 } from "lucide-react";
import {
  useLogin,
  useClientLogin,
  useRegister,
  useClientRegister,
} from "@/hooks/Auth/useAuth";

type UserType = "USER" | "CLIENT";
type Mode    = "LOGIN" | "REGISTER";

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }

.lp-root {
  min-height: 100vh;
  display: flex;
  font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
  background: #0d1b3e;
}

/* ── LEFT PANEL ── */
.lp-left {
  flex: 0 0 42%;
  background: linear-gradient(160deg, #03163d 0%, #091f50 55%, #0a2d6e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;
}
.lp-left::before {
  content: '';
  position: absolute;
  top: -120px; right: -120px;
  width: 360px; height: 360px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
}
.lp-left::after {
  content: '';
  position: absolute;
  bottom: -80px; left: -80px;
  width: 260px; height: 260px;
  border-radius: 50%;
  background: rgba(255,255,255,0.035);
}

.lp-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
  text-align: center;
}
.lp-brand-icon {
  width: 72px; height: 72px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  backdrop-filter: blur(8px);
}
.lp-brand-name {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.04em;
  line-height: 1;
}
.lp-brand-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: -8px;
}
.lp-brand-tagline {
  font-size: 15px;
  color: rgba(255,255,255,0.6);
  line-height: 1.65;
  max-width: 280px;
  margin-top: 4px;
}
.lp-dots {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.lp-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
}
.lp-dot.active { background: rgba(255,255,255,0.7); }

/* ── RIGHT PANEL ── */
.lp-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #f5f7ff;
  overflow-y: auto;
}

.lp-card {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 8px 40px rgba(13,27,62,0.12);
  overflow: hidden;
}

/* TYPE SELECTOR */
.lp-type-row {
  display: flex;
  padding: 16px 20px 0;
  gap: 8px;
}
.lp-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s;
}
.lp-type-btn:hover {
  border-color: #c7d2fe;
  color: #4f46e5;
  background: #f5f3ff;
}
.lp-type-btn.active {
  border-color: #03163d;
  background: #03163d;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(3,22,61,0.3);
}

/* MODE TABS */
.lp-mode-row {
  display: flex;
  margin: 16px 20px 0;
  border-bottom: 2px solid #f3f4f6;
}
.lp-mode-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  color: #9ca3af;
  position: relative;
  transition: color 0.15s;
}
.lp-mode-btn.active {
  color: #03163d;
}
.lp-mode-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 15%;
  right: 15%;
  height: 2px;
  background: #03163d;
  border-radius: 2px;
}

/* FORM BODY */
.lp-body {
  padding: 22px 24px 28px;
}

.lp-section-title {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  margin-bottom: 3px;
}
.lp-section-sub {
  font-size: 12.5px;
  color: #6b7280;
  margin-bottom: 20px;
}

/* FORM FIELDS */
.lp-field { margin-bottom: 14px; }
.lp-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.lp-input-wrap { position: relative; }
.lp-input {
  width: 100%;
  height: 42px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #111827;
  font-size: 13.5px;
  font-family: inherit;
  padding: 0 40px 0 13px;
  outline: none;
  transition: all 0.15s;
}
.lp-input:focus {
  border-color: #03163d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(3,22,61,0.08);
}
.lp-input::placeholder { color: #c4c9d4; }
.lp-eye {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer; color: #9ca3af;
  display: flex; align-items: center; padding: 0;
}
.lp-eye:hover { color: #6b7280; }

.lp-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.lp-alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  margin-bottom: 16px;
  font-weight: 500;
  line-height: 1.45;
}
.lp-alert-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.lp-alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.lp-btn {
  width: 100%;
  height: 44px;
  background: #03163d;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 6px;
  letter-spacing: -0.01em;
}
.lp-btn:hover:not(:disabled) {
  background: #0a2463;
  transform: translateY(-1px);
  box-shadow: 0 5px 16px rgba(3,22,61,0.28);
}
.lp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.lp-switch {
  text-align: center;
  margin-top: 16px;
  font-size: 12.5px;
  color: #6b7280;
}
.lp-switch-link {
  color: #03163d;
  font-weight: 700;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.lp-switch-link:hover { color: #0a2463; }

@media (max-width: 700px) {
  .lp-root { flex-direction: column; }
  .lp-left { flex: none; padding: 36px 28px; min-height: 200px; }
  .lp-brand-name { font-size: 28px; }
  .lp-right { padding: 24px 16px; }
  .lp-grid-2 { grid-template-columns: 1fr; }
}
`;

export default function LoginPage() {
  const router   = useRouter();

  const [userType, setUserType] = useState<UserType>("USER");
  const [mode,     setMode]     = useState<Mode>("LOGIN");

  // form state — shared fields
  const [username,        setUsername]        = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [staffName,       setStaffName]       = useState("");
  const [clientName,      setClientName]      = useState("");
  const [mobile,          setMobile]          = useState("");
  const [email,           setEmail]           = useState("");

  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  const { mutate: login,          isPending: loginPending       } = useLogin();
  const { mutate: clientLogin,    isPending: clientLoginPending } = useClientLogin();
  const { mutate: register,       isPending: registerPending    } = useRegister();
  const { mutate: clientRegister, isPending: clientRegPending   } = useClientRegister();

  const isPending =
    loginPending || clientLoginPending || registerPending || clientRegPending;

  const resetForm = () => {
    setUsername(""); setPassword(""); setConfirmPassword("");
    setStaffName(""); setClientName(""); setMobile(""); setEmail("");
    setErrorMsg(""); setSuccessMsg("");
    setShowPw(false); setShowConfirm(false);
  };

  const switchType = (t: UserType) => { if (t !== userType) { setUserType(t); resetForm(); } };
  const switchMode = (m: Mode)     => { if (m !== mode)     { setMode(m);     resetForm(); } };

  // ── HANDLERS ─────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (!username.trim()) return setErrorMsg("Username is required.");
    if (!password)        return setErrorMsg("Password is required.");

    const onError = (err: any) =>
      setErrorMsg(err?.response?.data?.message || err?.message || "Invalid credentials.");

    if (userType === "USER") {
      login(
        { username: username.trim(), password },
        { onSuccess: () => router.push("/Home"), onError },
      );
    } else {
      clientLogin(
        { username: username.trim(), password },
        { onSuccess: () => router.push("/Home"), onError },
      );
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (!username.trim())  return setErrorMsg("Username is required.");
    if (username.trim().length < 3) return setErrorMsg("Username must be at least 3 characters.");
    if (!password)         return setErrorMsg("Password is required.");
    if (password.length < 5) return setErrorMsg("Password must be at least 5 characters.");
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");

    if (userType === "USER") {
      if (!staffName.trim()) return setErrorMsg("Full name is required.");
      register(
        {
          username: username.trim(),
          password,
          staffName: staffName.trim(),
          mobileNo: mobile.trim() || undefined,
          roleId: 3,
        },
        {
          onSuccess: () => {
            setSuccessMsg("Account created! You can now log in.");
            switchMode("LOGIN");
          },
          onError: (err: any) =>
            setErrorMsg(err?.response?.data?.message || err?.message || "Registration failed."),
        },
      );
    } else {
      if (!clientName.trim()) return setErrorMsg("Client / company name is required.");
      clientRegister(
        {
          clientName: clientName.trim(),
          username: username.trim(),
          password,
          mobile: mobile.trim() || undefined,
          email: email.trim() || undefined,
        },
        {
          onSuccess: () => {
            setSuccessMsg("Account created! You can now log in.");
            switchMode("LOGIN");
          },
          onError: (err: any) =>
            setErrorMsg(err?.response?.data?.message || err?.message || "Registration failed."),
        },
      );
    }
  };

  const handleSubmit = mode === "LOGIN" ? handleLogin : handleRegister;

  // ── TITLES ───────────────────────────────────
  const titles: Record<UserType, Record<Mode, { h: string; sub: string }>> = {
    USER: {
      LOGIN:    { h: "Welcome back",     sub: "Sign in to your staff account"         },
      REGISTER: { h: "Create account",   sub: "Register a new staff / admin account"  },
    },
    CLIENT: {
      LOGIN:    { h: "Client login",     sub: "Sign in to your client account"        },
      REGISTER: { h: "Register client",  sub: "Create a new client account"           },
    },
  };

  const { h, sub } = titles[userType][mode];

  const dotFor = (t: UserType) => (
    <span className={`lp-dot ${userType === t ? "active" : ""}`} />
  );

  return (
    <>
      <style>{CSS}</style>

      <div className="lp-root">
        {/* ── LEFT ── */}
        <div className="lp-left">
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <Zap size={32} strokeWidth={2.5} />
            </div>
            <div>
              <div className="lp-brand-name">Brightech</div>
              <div className="lp-brand-sub">Calls Management</div>
            </div>
            <div className="lp-brand-tagline">
              Streamline your call bookings, project tracking, and client management — all in one place.
            </div>
            <div className="lp-dots">
              {dotFor("USER")}
              {dotFor("CLIENT")}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lp-right">
          <div className="lp-card">

            {/* TYPE SELECTOR */}
            <div className="lp-type-row">
              <button
                type="button"
                className={`lp-type-btn ${userType === "USER" ? "active" : ""}`}
                onClick={() => switchType("USER")}
              >
                <UserCircle size={17} />
                User Account
              </button>
              <button
                type="button"
                className={`lp-type-btn ${userType === "CLIENT" ? "active" : ""}`}
                onClick={() => switchType("CLIENT")}
              >
                <Building2 size={17} />
                Client Account
              </button>
            </div>

            {/* MODE TABS */}
            <div className="lp-mode-row">
              <button
                type="button"
                className={`lp-mode-btn ${mode === "LOGIN" ? "active" : ""}`}
                onClick={() => switchMode("LOGIN")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`lp-mode-btn ${mode === "REGISTER" ? "active" : ""}`}
                onClick={() => switchMode("REGISTER")}
              >
                Register
              </button>
            </div>

            {/* FORM BODY */}
            <div className="lp-body">
              <div className="lp-section-title">{h}</div>
              <div className="lp-section-sub">{sub}</div>

              {errorMsg   && <div className="lp-alert lp-alert-error">{errorMsg}</div>}
              {successMsg && <div className="lp-alert lp-alert-success">{successMsg}</div>}

              <form onSubmit={handleSubmit} autoComplete="off">

                {/* CLIENT-ONLY: client name */}
                {mode === "REGISTER" && userType === "CLIENT" && (
                  <div className="lp-field">
                    <label className="lp-label">Client / Company Name *</label>
                    <div className="lp-input-wrap">
                      <input
                        className="lp-input"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value.toUpperCase())}
                        placeholder="e.g. ACME CORP"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* USER-ONLY: staff name */}
                {mode === "REGISTER" && userType === "USER" && (
                  <div className="lp-field">
                    <label className="lp-label">Full Name *</label>
                    <div className="lp-input-wrap">
                      <input
                        className="lp-input"
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value.toUpperCase())}
                        placeholder="e.g. JOHN DOE"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* USERNAME */}
                <div className="lp-field">
                  <label className="lp-label">Username *</label>
                  <div className="lp-input-wrap">
                    <input
                      className="lp-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toUpperCase())}
                      placeholder="Enter username"
                      autoFocus={mode === "LOGIN"}
                    />
                  </div>
                </div>

                {/* EXTRA REGISTER FIELDS */}
                {mode === "REGISTER" && (
                  <div className="lp-grid-2">
                    <div className="lp-field" style={{ marginBottom: 0 }}>
                      <label className="lp-label">Mobile</label>
                      <div className="lp-input-wrap">
                        <input
                          className="lp-input"
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="10-digit"
                        />
                      </div>
                    </div>

                    {userType === "CLIENT" && (
                      <div className="lp-field" style={{ marginBottom: 0 }}>
                        <label className="lp-label">Email</label>
                        <div className="lp-input-wrap">
                          <input
                            className="lp-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSWORD */}
                <div className="lp-field" style={{ marginTop: mode === "REGISTER" ? 14 : 0 }}>
                  <label className="lp-label">
                    Password *{mode === "REGISTER" ? " (min 5 chars)" : ""}
                  </label>
                  <div className="lp-input-wrap">
                    <input
                      className="lp-input"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                    <button type="button" className="lp-eye" onClick={() => setShowPw((p) => !p)}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                {mode === "REGISTER" && (
                  <div className="lp-field">
                    <label className="lp-label">Confirm Password *</label>
                    <div className="lp-input-wrap">
                      <input
                        className="lp-input"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        className="lp-eye"
                        onClick={() => setShowConfirm((p) => !p)}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" className="lp-btn" disabled={isPending}>
                  {isPending
                    ? (mode === "LOGIN" ? "Signing in..." : "Registering...")
                    : (mode === "LOGIN"
                        ? `Sign in as ${userType === "USER" ? "User" : "Client"}`
                        : `Create ${userType === "USER" ? "User" : "Client"} Account`)}
                </button>

                <div className="lp-switch">
                  {mode === "LOGIN" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button type="button" className="lp-switch-link" onClick={() => switchMode("REGISTER")}>
                        Register here
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" className="lp-switch-link" onClick={() => switchMode("LOGIN")}>
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
