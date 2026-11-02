'use client';
import { formatDate } from '@/utils/format/date';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Headphones, CheckCircle2, Clock3, CircleDot } from 'lucide-react';
import { ui } from '@/utils/ui';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useSession } from '@/hooks/Auth/useSession';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { getAllUsers } from '@/services/AuthService';
import {
  getDashboardCalls,
  DashboardCall,
  durationLabel,
} from '@/services/DashboardService';
import { describeCallStatus } from '@/utils/callStatus';
import CallStatusBadge from '@/components/CallStatusBadge';
import { CustomTable, TableColumn } from '@/components/CustomTable';

const columns: TableColumn<DashboardCall>[] = [
  {
    key: 'tktId',
    header: 'Ticket',
    sortable: true,
    render: (row) => <span className={ui('ticket-number')}>#{row.tktId ?? row.sno}</span>,
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
      <section className={ui('dashboard-welcome')}>
        <div>
          <div className={ui('ui-eyebrow')}>
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
        <div className={ui('dashboard-welcome-actions')}>
          <button
            className={ui('ui-button')}
            onClick={refresh}
            disabled={query.isFetching || users.isFetching}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {allowed('/ProjectManagement/TaskAssignment') && (
            <Link
              className={ui('ui-button primary')}
              href="/ProjectManagement/TaskAssignment"
            >
              Calls booking
            </Link>
          )}
        </div>
      </section>
      {query.isError && (
        <div
          className={ui('ui-error')}
          role="alert"
        >
          {query.error instanceof Error
            ? query.error.message
            : 'Calls could not be loaded.'}
          <button
            className={ui('ui-button')}
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      )}
      {isAdmin && (
        <section className="mb-7 space-y-4">
          <div className={ui('dashboard-section-heading')}>
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
                className={ui('ui-button')}
                href="/Master/UserMaster"
              >
                Manage employees
              </Link>
            )}
          </div>
          {users.isError && (
            <div
              className={ui('ui-error')}
              role="alert"
            >
              Employee accounts could not be loaded.
              <button
                className={ui('ui-button')}
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
      <section className={ui('dashboard-stats')}>
        {stats.map(({ label, value, Icon, tone }) => (
          <article
            className={ui('stat-card')}
            key={label}
          >
            <div className={ui('stat-top')}>
              <span>{label}</span>
              <span className={ui(`stat-icon ${tone}`)}>
                <Icon size={19} />
              </span>
            </div>
            <strong>
              {query.isPending || query.isError ? '—' : value.toLocaleString()}
            </strong>
          </article>
        ))}
      </section>
      <div className={ui('dashboard-layout')}>
        <section className={ui('dashboard-work')}>
          <div className={ui('dashboard-section-heading')}>
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
            <div className={ui('task-filters')}>
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
          />
        </section>
        <aside className={ui('dashboard-aside')}>
          <section className={ui('workload-card')}>
            <h2>Resolution overview</h2>
            <p>Across the selected calls.</p>
            <div className={ui('workload-value')}>
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
            <div className={ui('workload-breakdown')}>
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
          <section className={ui('shortcut-card')}>
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
      <div className={ui('dashboard-footer')}>
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
