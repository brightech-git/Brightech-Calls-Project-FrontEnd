"use client";

import { ui } from "@/utils/ui";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";

// SHARED 404 / "NOT FOUND OR NOT ALLOWED" VIEW.
// Used both by app/not-found.tsx (genuine unmatched routes, Next.js
// convention) and app/404/page.tsx (explicit redirect target used by
// LayoutWrapper's role/menu access guard when a logged-in user tries to
// open a page their role isn't assigned).
export default function NotFoundView() {
  return <>
      

      <div className={ui("nf-wrap")}>
        <div className={ui("nf-icon")}><ShieldAlert size={30} /></div>
        <div className={ui("nf-code")}>404</div>
        <div className={ui("nf-title")}>Page Not Found</div>
        <div className={ui("nf-sub")}>
          This page doesn&apos;t exist, or you don&apos;t have access to it with your
          current role.
        </div>
        <Link href="/Home" className={ui("nf-btn")}>Back to Home</Link>
      </div>
    </>;
}
