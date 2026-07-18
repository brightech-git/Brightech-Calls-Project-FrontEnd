"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";

// SHARED 404 / "NOT FOUND OR NOT ALLOWED" VIEW.
// Used both by app/not-found.tsx (genuine unmatched routes, Next.js
// convention) and app/404/page.tsx (explicit redirect target used by
// LayoutWrapper's role/menu access guard when a logged-in user tries to
// open a page their role isn't assigned).
export default function NotFoundView() {
  return (
    <>
      <style>{`
        .nf-wrap {
          min-height: 70vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          gap: 14px; padding: 24px;
        }
        .nf-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: ${COLORS.errorBg}; color: ${COLORS.error};
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 6px;
        }
        .nf-code {
          font-size: 42px; font-weight: 800; color: ${COLORS.textPrimary};
          font-family: ${FONT.family}; letter-spacing: -0.02em; line-height: 1;
        }
        .nf-title {
          font-size: 16px; font-weight: 700; color: ${COLORS.textPrimary};
          font-family: ${FONT.family};
        }
        .nf-sub {
          font-size: 13px; color: ${COLORS.textMuted};
          font-family: ${FONT.family}; max-width: 360px;
        }
        .nf-btn {
          margin-top: 10px; padding: 9px 20px; border-radius: ${RADIUS.md};
          background: ${COLORS.secondary}; color: #fff; text-decoration: none;
          font-size: 13px; font-weight: 600; font-family: ${FONT.family};
          transition: background 0.15s;
        }
        .nf-btn:hover { background: ${COLORS.secondaryHover}; }
      `}</style>

      <div className="nf-wrap">
        <div className="nf-icon"><ShieldAlert size={30} /></div>
        <div className="nf-code">404</div>
        <div className="nf-title">Page Not Found</div>
        <div className="nf-sub">
          This page doesn&apos;t exist, or you don&apos;t have access to it with your
          current role.
        </div>
        <Link href="/Home" className="nf-btn">Back to Home</Link>
      </div>
    </>
  );
}
