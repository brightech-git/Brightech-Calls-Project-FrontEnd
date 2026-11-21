'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/src/module/auth/hook/use-session';
import { getAllUsers } from '@/src/module/auth/api/auth.api';
import { getDashboardCalls } from '@/src/module/dashboard/api/dashboard.api';
import type { DashboardRole } from '@/src/module/dashboard/type/dashboard.types';

/** Which dashboard this login gets: user 999 is the administrator. */
export function useDashboardRole() {
  const { userId = '', username = '', isClient = '', clientId = '' } = useSession();
  const role: DashboardRole =
    userId === '999' ? 'admin' : isClient.toUpperCase() === 'Y' ? 'client' : 'staff';
  return { role, userId, username, clientId };
}

/** Calls in this login's scope, enriched with their status history. */
export function useDashboardCalls() {
  const { role, userId, clientId } = useDashboardRole();
  return useQuery({
    queryKey: ['dashboard-calls', userId, role, clientId],
    queryFn: () => getDashboardCalls(userId, role === 'admin', role === 'client', clientId),
    enabled: !!userId,
    staleTime: 60000,
  });
}

/** Every user account; only the admin dashboard needs it. */
export function useDashboardUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => getAllUsers({}),
    select: (res) => res.data ?? [],
    enabled,
    staleTime: 60000,
  });
}
