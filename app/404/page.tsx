"use client";

import NotFoundView from "@/components/NotFoundView";

// Explicit redirect target used by LayoutWrapper's role/menu access guard:
// when a logged-in user tries to open a page their assigned role doesn't
// have in menuIds, they're router.replace()'d here (client-side navigation,
// unlike app/not-found.tsx which only fires for genuinely unmatched routes).
export default function NotFoundRedirectPage() {
  return <NotFoundView />;
}
