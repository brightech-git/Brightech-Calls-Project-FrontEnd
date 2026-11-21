'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useAccessibleMenu } from '@/src/module/auth/hook/use-accessible-menu';
import { useDashboardCalls, useDashboardRole } from '@/src/module/dashboard/hook/use-dashboard';
import AdminDashboard from './admin-dashboard';
import StaffDashboard from './staff-dashboard';
import ClientDashboard from './client-dashboard';

const COPY = {
  admin: {
    eyebrow: 'Administrator overview',
    text: 'How every staff member is performing, and where calls come from.',
  },
  staff: {
    eyebrow: 'Your work',
    text: 'Your assigned calls, what is waiting, and how fast you finish.',
  },
  client: {
    eyebrow: 'Your calls',
    text: 'Track what you have raised and how quickly it is resolved.',
  },
} as const;

/** Picks the dashboard for this login: user 999 is admin, client accounts get the client view. */
export default function DashboardPage() {
  usePageHeader({ title: 'Overview', subtitle: 'Calls and resolution overview' });
  const { role, username } = useDashboardRole();
  const calls = useDashboardCalls();
  const { isRouteAllowed } = useAccessibleMenu();
  const allowed = (path: string) => role === 'admin' || isRouteAllowed(path);

  const props = {
    calls: calls.data ?? [],
    loading: calls.isPending,
    error: calls.isError
      ? calls.error instanceof Error
        ? calls.error.message
        : 'Calls could not be loaded.'
      : null,
    onRetry: () => void calls.refetch(),
  };
  const unavailable = props.calls.filter((c) => !c.historyAvailable).length;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">
            {COPY[role].eyebrow}
          </p>
          <h1 className="text-lg font-semibold text-ink">
            {username ? `Welcome back, ${username}.` : 'Overview'}
          </h1>
          <p className="text-xs text-muted">{COPY[role].text}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={props.onRetry}
            disabled={calls.isFetching}
          >
            <RefreshCw
              size={14}
              className={cn(calls.isFetching && 'animate-spin')}
            />
            Refresh
          </button>
          {allowed('/ProjectManagement/TaskAssignment') && (
            <Link
              className={cn(buttonClass, buttonVariants.primary)}
              href="/ProjectManagement/TaskAssignment"
            >
              Calls booking
            </Link>
          )}
        </div>
      </div>

      {role === 'admin' && <AdminDashboard {...props} />}
      {role === 'staff' && <StaffDashboard {...props} />}
      {role === 'client' && <ClientDashboard {...props} />}

      {unavailable > 0 && (
        <p
          role="status"
          className="text-xs text-amber-700"
        >
          History could not be loaded for {unavailable} calls, so their timings are missing. Refresh
          to retry.
        </p>
      )}
    </div>
  );
}
