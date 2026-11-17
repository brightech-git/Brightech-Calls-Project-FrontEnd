'use client';
import { cn } from '@/lib/utils';
import { buttonClass, buttonVariants, statusTones, type StatusTone } from '@/lib/styles';
import { formatDate } from '@/utils/format/date';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Headphones, CheckCircle2, Clock3, CircleDot } from 'lucide-react';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useSession } from '@/src/module/auth/hook/use-session';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { getAllUsers } from '@/src/module/auth/api/auth.api';
import {
  getDashboardCalls,
  DashboardCall,
  durationLabel,
} from '@/src/module/dashboard/api/dashboard.api';
import { describeCallStatus } from '@/utils/callStatus';
import CallStatusBadge from '@/components/CallStatusBadge';
import { CustomTable, TableColumn } from '@/components/CustomTable';

const columns: TableColumn<DashboardCall>[] = [
  {
    key: 'tktId',
    header: 'Ticket',
    sortable: true,
    render: (row) => <span className="text-brand">#{row.tktId ?? row.sno}</span>,
  },
  {
    key: 'tktDate',
    header: 'Booked',
    sortable: true,
    render: (row) =>
      row.tktDate && Number.isFinite(Date.parse(row.tktDate))
        ? formatDate(row.tktDate)
        : 'Not recorded',
  },
  { key: 'clientName', header: 'Client', sortable: true },
  { key: 'projectName', header: 'Project', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <CallStatusBadge value={row.status} />,
  },
  {
    key: 'assignedUsers',
    header: 'Assigned to',
    render: (row) =>
      Object.values(row.userMap ?? {}).join(', ') ||
      row.assignedNames ||
      (row.assignedUsers
        ? row.assignedUsers
            .split(',')
            .map((id) => `User #${id.trim()}`)
            .join(', ')
        : row.historyAvailable
          ? 'Unassigned'
          : 'Unavailable'),
  },
  {
    key: 'completedBy',
    header: 'Completed by',
    render: (row) =>
      describeCallStatus(row.status).group === 'complete' ? row.completedBy : '—',
  },
  {
    key: 'resolutionHours',
    header: 'Resolution time',
    render: (row) =>
      describeCallStatus(row.status).group === 'complete'
        ? durationLabel(row.resolutionHours)
        : '—',
  },
];
type Employee = Record<string, unknown> & {
  id: string;
  name: string;
  active: string;
  total: number;
  open: number;
  progress: number;
  complete: number;
  resolvedBy: number;
};
const employeeColumns: TableColumn<Employee>[] = [
  { key: 'name', header: 'Employee', sortable: true },
  { key: 'active', header: 'Account', sortable: true },
  { key: 'total', header: 'Assigned', sortable: true },
  { key: 'open', header: 'Open', sortable: true },
  { key: 'progress', header: 'Processing', sortable: true },
  { key: 'complete', header: 'Completed assignments', sortable: true },
  { key: 'resolvedBy', header: 'Recorded completions', sortable: true },
];

export default function DashboardPage() {
  usePageHeader({ title: 'Overview', subtitle: 'Calls and resolution overview' });
  const {
    userId = '',
    username = '',
    isClient: clientFlag,
    clientId = '',
  } = useSession();
  const isAdmin = userId === '999';
  const isClient = !isAdmin && clientFlag?.toUpperCase() === 'Y';
  const { isRouteAllowed } = useAccessibleMenu();
  const allowed = (path: string) => isAdmin || isRouteAllowed(path);
  const [filter, setFilter] = useState('all');
  const [employee, setEmployee] = useState('all');
  const query = useQuery({
    queryKey: ['dashboard-calls', userId, isAdmin, isClient, clientId],
    queryFn: () => getDashboardCalls(userId, isAdmin, isClient, clientId),
    enabled: !!userId,
    staleTime: 60000,
  });
  const users = useQuery({
    queryKey: ['dashboard-employees', userId],
    queryFn: getAllUsers,
    enabled: isAdmin,
    staleTime: 60000,
  });
  const calls = query.data ?? [];
  const group = (call: DashboardCall) => describeCallStatus(call.status).group;
  const assigned = (call: DashboardCall, id: string) =>
    call.assignedUsers
      .split(',')
      .map((value) => value.trim())
      .includes(id);
  const roster: Employee[] = (users.data?.data ?? [])
    .filter(
      (user) => user.ISCLIENT?.toUpperCase() !== 'Y' && String(user.USERID) !== '999',
    )
    .map((user) => {
      const id = String(user.USERID);
      const tasks = calls.filter((call) => assigned(call, id));
      return {
        id,
        name: user.USERNAME,
        active: user.ACTIVE === 'Y' ? 'Active' : 'Inactive',
        total: tasks.length,
        open: tasks.filter((call) => group(call) === 'open').length,
        progress: tasks.filter((call) => group(call) === 'progress').length,
        complete: tasks.filter((call) => group(call) === 'complete').length,
        resolvedBy: calls.filter(
          (call) => group(call) === 'complete' && call.completedById === id,
        ).length,
      };
    })
    .sort((a, b) => b.open + b.progress - a.open - a.progress);
  const scoped =
    employee === 'all' || !isAdmin
      ? calls
      : calls.filter((call) => assigned(call, employee));
  const completed = scoped.filter((call) => group(call) === 'complete');
  const progress = scoped.filter((call) => group(call) === 'progress').length;
  const open = scoped.filter((call) => group(call) === 'open').length;
  const timed = completed.filter((call) => call.resolutionHours !== null);
  const average = timed.length
    ? timed.reduce((sum, call) => sum + call.resolutionHours!, 0) / timed.length
    : null;
  const unavailable = calls.filter((call) => !call.historyAvailable).length;
  const filtered = scoped.filter((call) => filter === 'all' || group(call) === filter);
  const refresh = () => {
    void query.refetch();
    if (isAdmin) void users.refetch();
  };
  const stats = [
    {
      label: isAdmin
        ? 'All calls booked'
        : isClient
          ? 'Your calls booked'
          : 'Assigned calls',
      value: scoped.length,
      Icon: Headphones,
      tone: 'blue',
    },
    { label: 'Open / pending', value: open, Icon: CircleDot, tone: 'amber' },
    { label: 'Processing', value: progress, Icon: Clock3, tone: 'violet' },
    {
      label: 'Resolved / completed',
      value: completed.length,
      Icon: CheckCircle2,
      tone: 'green',
    },
  ];
  return (
    <>
      <section className="mb-2 flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-line bg-linear-to-r from-white to-brand-soft p-2 [&_h1]:my-2 [&_h1]:text-xl [&_h1]:leading-tight [&_h1]:tracking-tight [&_p]:text-sm [&_p]:text-muted max-lg:flex-col max-lg:items-start max-sm:p-2 [&_h1]:max-sm:text-xl">
        <div>
          <div className="text-[10px] tracking-widest text-muted uppercase">
            {isAdmin
              ? 'ADMINISTRATOR OVERVIEW'
              : isClient
                ? 'CLIENT OVERVIEW'
                : 'YOUR WORK OVERVIEW'}
          </div>
          <h1>{username ? `Welcome back, ${username}.` : 'Calls, in focus.'}</h1>
          <p>
            {isAdmin
              ? 'Monitor employee workloads and every booked call.'
              : isClient
                ? 'Track your bookings, progress and completed calls.'
                : 'Track your assigned calls and resolutions.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button
            className={buttonClass}
            onClick={refresh}
            disabled={query.isFetching || users.isFetching}
          >
            <RefreshCw size={16} />
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
      </section>
      {query.isError && (
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-sm text-rose-800"
          role="alert"
        >
          {query.error instanceof Error
            ? query.error.message
            : 'Calls could not be loaded.'}
          <button
            className={buttonClass}
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      )}
      {isAdmin && (
        <section className="mb-4 space-y-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:tracking-tight [&_p]:text-xs [&_p]:text-muted">
            <div>
              <h2>Employee management</h2>
              <p>
                {users.isPending || users.isError
                  ? 'Employee totals unavailable'
                  : `${roster.length} employee accounts · ${roster.filter((user) => user.active === 'Active').length} active · ${roster.filter((user) => user.total === 0).length} without assignments`}{' '}
                ·{' '}
                {query.isPending || query.isError
                  ? 'Call totals unavailable'
                  : `${calls.filter((call) => !call.assignedUsers.trim() && call.historyAvailable).length} unassigned calls`}
              </p>
            </div>
            {allowed('/Master/UserMaster') && (
              <Link
                className={buttonClass}
                href="/Master/UserMaster"
              >
                Manage employees
              </Link>
            )}
          </div>
          {users.isError && (
            <div
              className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-sm text-rose-800"
              role="alert"
            >
              Employee accounts could not be loaded.
              <button
                className={buttonClass}
                onClick={() => users.refetch()}
              >
                Retry
              </button>
            </div>
          )}
          <CustomTable
            title="Employee workload"
            columns={employeeColumns}
            data={query.isError ? [] : roster}
            rowKey="id"
            isLoading={users.isPending || query.isPending}
            emptyMessage={
              users.isError || query.isError
                ? 'Employee workloads are unavailable.'
                : 'No employee accounts found.'
            }
            
          />
          <p className="text-xs text-muted">
            Employees are non-client user accounts, including inactive accounts. Shared
            calls count for each assignee; recorded completions identify the user who
            logged the latest completion.
          </p>
        </section>
      )}
      <section className="mb-2 grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:gap-3">
        {stats.map(({ label, value, Icon, tone }) => (
          <article
            className="rounded-lg border border-line bg-white p-2 max-sm:p-2 [&>strong]:block [&>strong]:text-xl [&>strong]:leading-none [&>p]:text-xs [&>p]:text-muted"
            key={label}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{label}</span>
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', statusTones[tone as StatusTone])}>
                <Icon size={19} />
              </span>
            </div>
            <strong>
              {query.isPending || query.isError ? '—' : value.toLocaleString()}
            </strong>
          </article>
        ))}
      </section>
      <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-3 max-xl:grid-cols-1">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:tracking-tight [&_p]:text-xs [&_p]:text-muted">
            <div>
              <h2>
                {isClient
                  ? 'Your booked calls'
                  : isAdmin
                    ? 'All booked calls'
                    : 'Your assigned calls'}
              </h2>
              <p>All dates and activity states. Search by ticket, client or project.</p>
            </div>
            {isAdmin && (
              <label>
                Employee{' '}
                <select
                  className="rounded-lg border border-line p-2"
                  value={employee}
                  onChange={(event) => setEmployee(event.target.value)}
                >
                  <option value="all">All employees</option>
                  {roster.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1 [&>button]:whitespace-nowrap [&>button]:rounded-md [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:text-muted [&>button[aria-pressed=true]]:bg-brand-soft [&>button[aria-pressed=true]]:text-brand">
              {[
                ['all', 'All'],
                ['open', 'Open'],
                ['progress', 'Processing'],
                ['complete', 'Completed'],
                ['cancelled', 'Cancelled'],
                ['other', 'Other'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <CustomTable
            title="Calls"
            columns={columns}
            data={filtered}
            rowKey="sno"
            isLoading={query.isPending}
            emptyMessage={
              query.isError
                ? 'Calls are unavailable. Please retry.'
                : 'No calls match this view.'
            }
            extraActions={
              allowed('/ProjectManagement/CallStatus')
                ? [
                    {
                      label: 'View call history',
                      onClick: (row) => {
                        if (row.tktId != null)
                          window.location.assign(
                            `/ProjectManagement/CallStatus?tktId=${row.tktId}`,
                          );
                      },
                    },
                  ]
                : []
            }
            onRowClick={(row) => {
              if (row.tktId != null)
                window.location.assign(
                  `/ProjectManagement/CallStatus?tktId=${row.tktId}`,
                );
            }}
          />
        </section>
        <aside className="grid gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
          <section className="rounded-lg border border-line bg-white p-4 [&>h2]:text-lg [&>p]:mt-1 [&>p]:text-xs [&>p]:text-muted [&>progress]:block [&>progress]:h-2 [&>progress]:w-full [&>progress]:overflow-hidden [&>progress]:rounded [&>progress]:accent-brand [&>progress::-webkit-progress-bar]:bg-slate-100 [&>progress::-webkit-progress-value]:rounded [&>progress::-webkit-progress-value]:bg-brand">
            <h2>Resolution overview</h2>
            <p>Across the selected calls.</p>
            <div className="mt-3 mb-2 flex items-baseline gap-1 text-brand [&>strong]:text-4xl [&>strong]:tracking-tight [&>span]:text-lg [&>span]:text-muted">
              <strong>
                {query.isPending || query.isError
                  ? '—'
                  : scoped.length
                    ? Math.round((completed.length / scoped.length) * 100)
                    : 0}
              </strong>
              <span>% completed</span>
            </div>
            <progress
              aria-label="Call completion"
              value={completed.length}
              max={scoped.length || 1}
            />
            <div className="mt-5 grid gap-3 border-t border-line pt-5 [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&>div]:text-xs [&>div]:text-muted [&_strong]:ml-auto [&_strong]:text-slate-600 [&_i]:size-1.5 [&_i]:rounded-full [&_i]:bg-amber-400 [&>div:nth-child(2)_i]:bg-blue-400 [&>div:nth-child(3)_i]:bg-emerald-400">
              <div>
                Average resolution
                <strong>
                  {query.isPending || query.isError ? '—' : durationLabel(average)}
                </strong>
              </div>
            </div>
            <p>
              Booking to latest completion, based on {timed.length} calls with valid
              timestamps. Cancelled and other statuses remain in the total.
            </p>
          </section>
          <section className="rounded-lg border border-line bg-white p-4 [&>h2]:text-lg [&>p]:mt-1 [&>p]:text-xs [&>p]:text-muted [&>a]:flex [&>a]:items-center [&>a]:justify-between [&>a]:border-b [&>a]:border-slate-100 [&>a]:py-3 [&>a]:text-sm [&>a]:text-muted [&>a:last-child]:border-0 [&>a:hover]:text-brand">
            <h2>Quick access</h2>
            {[
              { href: '/ProjectManagement/TaskAssignment', label: 'Calls booking' },
              { href: '/ProjectManagement/CallStatus', label: 'Call history' },
            ]
              .filter((item) => allowed(item.href))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
          </section>
        </aside>
      </div>
      {unavailable > 0 && (
        <p
          role="status"
          className="mt-4 text-sm text-amber-700"
        >
          History is unavailable for {unavailable} calls. Their booking status is shown;
          completion details may be missing. Refresh to retry.
        </p>
      )}
      <div className="mt-3 flex justify-between gap-3 text-xs text-muted max-sm:flex-col [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2">
        <span>
          Live data ·{' '}
          {isAdmin
            ? 'All clients and employees'
            : isClient
              ? 'Your client account'
              : 'Your assignments'}
        </span>
        <span>Brightech · Calls workspace</span>
      </div>
    </>
  );
}
