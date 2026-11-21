'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { COLORS, FONT, RADIUS } from '@/src/theme';

// SHARED 404 / "NOT FOUND OR NOT ALLOWED" VIEW.
// Used both by app/not-found.tsx (genuine unmatched routes, Next.js
// convention) and app/404/page.tsx (explicit redirect target used by
// LayoutWrapper's role/menu access guard when a logged-in user tries to
// open a page their role isn't assigned).
export default function NotFoundView() {
  return (
    <>
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="mb-2 grid size-12 place-items-center rounded-lg bg-rose-50 text-rose-600">
          <ShieldAlert size={30} />
        </div>
        <div className="text-5xl tracking-tight">404</div>
        <div className="text-xl">Page Not Found</div>
        <div className="max-w-sm text-sm leading-7 text-muted">
          This page doesn&apos;t exist, or you don&apos;t have access to it with your
          current role.
        </div>
        <Link
          href="/Home"
          className={cn(buttonClass, buttonVariants.primary, 'mt-3')}
        >
          Back to Home
        </Link>
      </div>
    </>
  );
}
