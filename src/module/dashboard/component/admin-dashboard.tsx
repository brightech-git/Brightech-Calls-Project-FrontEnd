'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { formatDate } from '@/src/utils/format/date';
import {
  dailyCounts,
  filterByRange,
  groupBy,
  oldestOpen,
  staffPerformance,
  totals,
} from '@/src/module/dashboard/hook/dashboard-metrics';
import { useDashboardUsers } from '@/src/module/dashboard/hook/use-dashboard';
import type {
  DashboardCall,
  DateRangeKey,
  StaffPerformance,
} from '@/src/module/dashboard/type/dashboard.types';
import {
  CallList,
  DailyChart,
  Empty,
  ErrorNotice,
  GroupBars,
  GroupTable,
  hours,
  Panel,
  percent,
  RangeFilter,
  StatusBreakdown,
  TotalsRow,
} from './dashboard-widgets';

type SortKey = keyof Pick<
  StaffPerformance,
  | 'name'
  | 'assigned'
  | 'open'
  | 'progress'
  | 'complete'
  | 'completionRate'
  | 'avgResolutionHours'
  | 'avgFirstResponseHours'
  | 'updatesLogged'
  | 'overdue'
>;

const STAFF_COLUMNS: {
  key: SortKey;
  label: string;
  render: (r: StaffPerformance) => string;
}[] = [
  { key: 'assigned', label: 'Assigned', render: (r) => String(r.assigned) },
  { key: 'open', label: 'Pending', render: (r) => String(r.open) },
  { key: 'progress', label: 'In processing', render: (r) => String(r.progress) },
  { key: 'complete', label: 'Completed', render: (r) => String(r.complete) },
  {
    key: 'completionRate',
    label: 'Completion',
    render: (r) => percent(r.completionRate),
  },
  {
    key: 'avgResolutionHours',
    label: 'Avg time to complete',
    render: (r) => hours(r.avgResolutionHours),
  },
  {
    key: 'avgFirstResponseHours',
    label: 'Avg first response',
    render: (r) => hours(r.avgFirstResponseHours),
  },
  {
    key: 'updatesLogged',
    label: 'Calls updated',
    render: (r) => String(r.updatesLogged),
  },
  { key: 'overdue', label: 'Overdue', render: (r) => String(r.overdue) },
];

const th =
  'border-b border-line bg-gray-50 px-3 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase';
const td =
  'border-t border-line px-3 py-row align-middle text-[13px] text-ink tabular-nums';

function StaffTable({ rows }: { rows: StaffPerformance[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: 'assigned',
    dir: -1,
  });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        if (x === y) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return (x < y ? -1 : 1) * sort.dir;
      }),
    [rows, sort],
  );
  if (!rows.length) return <Empty>No staff accounts found.</Empty>;
  const header = (key: SortKey, label: string, right = true) => (
    <th
      className={cn(th, right ? 'text-right' : 'text-left')}
      aria-sort={
        sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={() =>
          setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))
        }
        className="inline-flex items-center gap-1 uppercase hover:text-brand"
      >
        {label}
        {sort.key === key &&
          (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {header('name', 'Staff', false)}
            {STAFF_COLUMNS.map((c) => header(c.key, c.label))}
            <th className={cn(th, 'text-right')}>Fastest / slowest</th>
            <th className={cn(th, 'text-right')}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="hover:bg-gray-50/60"
            >
              <td className={cn(td, 'whitespace-nowrap')}>
                <span className="font-semibold">{r.name}</span>
                {!r.active && (
                  <span className="ml-1.5 rounded bg-gray-100 px-1.5 text-[10px] font-semibold text-muted">
                    Inactive
                  </span>
                )}
              </td>
              {STAFF_COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    td,
                    'text-right whitespace-nowrap',
                    c.key === 'overdue' && r.overdue > 0 && 'font-semibold text-rose-700',
                  )}
                >
                  {c.render(r)}
                </td>
              ))}
              <td className={cn(td, 'text-right whitespace-nowrap text-muted')}>
                {r.fastestHours === null
                  ? '—'
                  : `${hours(r.fastestHours)} / ${hours(r.slowestHours)}`}
              </td>
              <td className={cn(td, 'text-right whitespace-nowrap text-muted')}>
                {r.lastActive ? formatDate(r.lastActive) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard({
  calls,
  loading,
  error,
  onRetry,
}: {
  calls: DashboardCall[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [company, setCompany] = useState('all');
  const users = useDashboardUsers(true);

  const companies = useMemo(() => groupBy(calls, (c) => c.companyName), [calls]);
  const scoped = useMemo(() => {
    const inRange = filterByRange(calls, range);
    return company === 'all'
      ? inRange
      : inRange.filter((c) => (c.companyName?.trim() || 'Not set') === company);
  }, [calls, range, company]);

  const t = useMemo(() => totals(scoped), [scoped]);
  const staff = useMemo(
    () => staffPerformance(scoped, users.data ?? []),
    [scoped, users.data],
  );
  const byCompany = useMemo(() => groupBy(scoped, (c) => c.companyName), [scoped]);
  const byClient = useMemo(() => groupBy(scoped, (c) => c.clientName), [scoped]);
  const byProject = useMemo(() => groupBy(scoped, (c) => c.projectName), [scoped]);
  const trend = useMemo(
    () => dailyCounts(scoped, range === '7d' ? 7 : range === '90d' ? 90 : 30),
    [scoped, range],
  );
  const unassigned = scoped.filter(
    (c) =>
      c.historyAvailable &&
      !(c.assignedUsers ?? '').trim() &&
      !Object.keys(c.userMap ?? {}).length &&
      !c.assignedNames,
  ).length;

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter
            value={range}
            onChange={setRange}
          />
          {/* <select
            aria-label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={cn(controlClass, 'w-auto min-w-44')}
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option
                key={c.key}
                value={c.key}
              >
                {c.name}
              </option>
            ))}
          </select> */}
        </div>
        <p className="text-xs text-muted">
          {loading
            ? 'Loading calls…'
            : `${scoped.length} calls · ${unassigned} unassigned`}
        </p>
      </div>

      {error && (
        <ErrorNotice
          message={error}
          onRetry={onRetry}
        />
      )}

      <TotalsRow
        t={t}
        loading={loading}
        first="Calls booked"
      />

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
        <Panel
          title="Calls booked per day"
          subtitle="Hover a day to see completions"
        >
          {loading ? <Empty>Loading…</Empty> : <DailyChart days={trend} />}
        </Panel>
        <Panel
          title="Status"
          subtitle={`Avg first response ${hours(t.avgFirstResponseHours)}`}
        >
          {loading ? <Empty>Loading…</Empty> : <StatusBreakdown t={t} />}
        </Panel>
      </div>

      <Panel
        title="Staff performance"
        subtitle="Shared calls count for every assignee. Times run from booking to the completion entry."
      >
        {users.isError ? (
          <ErrorNotice
            message="Staff accounts could not be loaded."
            onRetry={() => users.refetch()}
          />
        ) : loading || users.isPending ? (
          <Empty>Loading…</Empty>
        ) : (
          <StaffTable rows={staff} />
        )}
      </Panel>

      <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-1">
        <Panel title="Calls by company">
          {loading ? <Empty>Loading…</Empty> : <GroupBars rows={byCompany} />}
        </Panel>
        <Panel title="Calls by client">
          {loading ? <Empty>Loading…</Empty> : <GroupBars rows={byClient} />}
        </Panel>
        <Panel title="Calls by project">
          {loading ? <Empty>Loading…</Empty> : <GroupBars rows={byProject} />}
        </Panel>
      </div>

      <Panel
        title="Oldest unfinished calls"
        subtitle="Pending or in processing, longest waiting first"
      >
        <CallList
          calls={oldestOpen(scoped, 10)}
          mode="age"
          empty="Nothing waiting. All calls are finished."
        />
      </Panel>

      <Panel title="Company summary">
        <GroupTable
          rows={byCompany}
          label="Company"
        />
      </Panel>
    </div>
  );
}
