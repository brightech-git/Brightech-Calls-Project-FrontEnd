"use client";

import { ui } from "@/utils/ui";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { useSession } from '@/hooks/Auth/useSession';
export default function LayoutWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    loggedIn
  } = useSession();
  const {
    isRouteAllowed
  } = useAccessibleMenu();
  const loginPage = pathname === '/Login' || pathname === '/login';
  const allowed = isRouteAllowed(pathname);
  useEffect(() => {
    if (!loginPage && loggedIn === false) router.replace('/Login');else if (!loginPage && loggedIn && !allowed && pathname !== '/404') router.replace('/404');
  }, [loginPage, loggedIn, allowed, pathname, router]);
  if (loginPage) return children;
  if (!loggedIn || !allowed) return <div className={ui("session-loading")} role="status">Opening your workspace…</div>;
  return <AppShell>{children}</AppShell>;
}
