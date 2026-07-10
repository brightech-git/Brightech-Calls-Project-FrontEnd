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

  // useEffect(() => {
  //   if (!checked || isLoginPage || menuLoading) return;
  //   if (!isRouteAllowed(pathname)) router.replace("/Home");
  // }, [checked, isLoginPage, menuLoading, pathname]);

  // if (!checked && !isLoginPage) return null;

  if (isLoginPage) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
