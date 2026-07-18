"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAccessibleMenu } from "@/hooks/ApiHooks/Menu/useAccessibleMenu";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const { loading: menuLoading, isRouteAllowed } = useAccessibleMenu();

  const isLoginPage = pathname === "/Login" || pathname === "/login";
  const isNotFoundPage = pathname === "/404";

  useEffect(() => {
    if (!isLoginPage) {
      const loggedIn = localStorage.getItem("isLoggedIn");
      if (!loggedIn) {
        router.replace("/Login");
        return;
      }
    }
    setChecked(true);
  }, [pathname]);

  // ROLE/MENU ACCESS GUARD - a logged-in user may only open pages that are
  // in their assigned menuIds (see useAccessibleMenu / AuthResponse.menuIds).
  // Anything else (typed URL, stale bookmark, etc.) bounces to the 404 page
  // instead of silently rendering the page or falling back to Home.
  useEffect(() => {
    if (!checked || isLoginPage || isNotFoundPage || menuLoading) return;
    if (!isRouteAllowed(pathname)) router.replace("/404");
  }, [checked, isLoginPage, isNotFoundPage, menuLoading, pathname]);

  if (isLoginPage) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
