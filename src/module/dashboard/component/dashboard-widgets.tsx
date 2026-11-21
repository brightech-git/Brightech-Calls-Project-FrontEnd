'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { cardClass } from '@/lib/styles';
import CallStatusBadge from '@/src/components/CallStatusBadge';
import { CALL_STATUS_STYLE } from '@/src/utils/callStatus';
import { formatDate } from '@/src/utils/format/date';
import { durationLabel } from '@/src/module/dashboard/api/dashboard.api';
import {
  ageHours,
  assigneeNames,
  RANGE_OPTIONS,
} from '@/src/module/dashboard/hook/dashboard-metrics';
import type {
  DashboardCall,
  DashboardTotals,
  DateRangeKey,
  DayCount,
  GroupSummary,
} from '@/src/module/dashboard/type/dashboard.types';

export const hours = (h: number | null) => (h === null ? '—' : durationLabel(h));
export const percent = (p: number | null) => (p === null ? '—' : `${Math.round(p)}%`);
const historyHref = (call: DashboardCall) =>
  call.tktId != null ? `/ProjectManagement/CallStatus?tktId=${call.tktId}` : undefined;

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(cardClass, 'flex min-w-0 flex-col', className)}>
      <header className="flex items-start justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-8 text-center text-xs text-muted">{children}</p>;
}

export function StatTile({
  label,
  value,
  hint,
  tone,
  status,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'warn' | 'good';
  /** Colours the tile like the call status: open = red, progress = yellow, complete = green. */
  status?: 'open' | 'progress' | 'complete';
}) {
  return (
    <article
      className={cn(cardClass, 'relative grid gap-0.5 overflow-hidden px-3 py-2.5')}
    >
      {status && (
        <span
          aria-hidden
          className={cn('absolute inset-y-0 left-0 w-1', CALL_STATUS_STYLE[status].solid)}
        />
      )}
      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
        {status && (
          <span
            aria-hidden
            className={cn('size-2 rounded-full', CALL_STATUS_STYLE[status].solid)}
          />
        )}
        {label}
      </span>
      <strong
        className={cn(
          'text-xl leading-tight font-bold tabular-nums text-ink',
          tone === 'warn' && 'text-rose-700',
          tone === 'good' && 'text-emerald-700',
          status && CALL_STATUS_STYLE[status].text,
        )}
      >
        {value}
      </strong>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </article>
  );
}

export function TotalsRow({
  t,
  loading,
  first,
}: {
  t: DashboardTotals;
  loading: boolean;
  first: string;
}) {
  const v = (x: React.ReactNode) => (loading ? '—' : x);
  return (
    <div className="grid grid-cols-6 gap-2 max-xl:grid-cols-3 max-sm:grid-cols-2">
      <StatTile
        label={first}
        value={v(t.total)}
      />
      <StatTile
        label="Pending"
        status="open"
        value={v(t.open)}
        hint="Waiting for a first step"
      />
      <StatTile
        label="In processing"
        status="progress"
        value={v(t.progress)}
      />
      <StatTile
        label="Completed"
        status="complete"
        value={v(t.complete)}
        hint={loading ? undefined : `${percent(t.completionRate)} of non-cancelled`}
        tone="good"
      />
      <StatTile
        label="Avg resolution"
        value={v(hours(t.avgResolutionHours))}
        hint={loading ? undefined : `Median ${hours(t.medianResolutionHours)}`}
      />
      <StatTile
        label="Overdue"
        value={v(t.overdue)}
        hint="Unfinished for over 2 days"
        tone={t.overdue > 0 ? 'warn' : undefined}
      />
    </div>
  );
}

export function RangeFilter({
  value,
  onChange,
}: {
  value: DateRangeKey;
  onChange: (v: DateRangeKey) => void;
}) {
  return (
    <div
      className="flex gap-1 rounded-md border border-line bg-white p-0.5"
      role="group"
      aria-label="Date range"
    >
      {RANGE_OPTIONS.map((r) => (
        <button
          key={r.key}
          type="button"
          aria-pressed={value === r.key}
          onClick={() => onChange(r.key)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-muted hover:text-ink',
            value === r.key && 'bg-brand text-brand-soft hover:text-brand',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ─── Charts ─────────────────────────────────────────────────────────────────

const STATUS_SEGMENTS = [
  { key: 'open', label: 'Pending', className: CALL_STATUS_STYLE.open.solid },
  {
    key: 'progress',
    label: 'In processing',
    className: CALL_STATUS_STYLE.progress.solid,
  },
  { key: 'complete', label: 'Completed', className: CALL_STATUS_STYLE.complete.solid },
  { key: 'cancelled', label: 'Cancelled', className: CALL_STATUS_STYLE.cancelled.solid },
  { key: 'other', label: 'Other', className: 'bg-gray-300' },
] as const;

/** One segmented bar of status shares, with a labelled legend. */
export function StatusBreakdown({ t }: { t: DashboardTotals }) {
  const parts = STATUS_SEGMENTS.map((s) => ({ ...s, value: t[s.key] })).filter(
    (s) => s.value > 0,
  );
  if (!t.total) return <Empty>No calls in this range.</Empty>;
  return (
    <div className="grid gap-3 p-3">
      <div
        className="flex h-3 gap-0.5 overflow-hidden rounded"
        role="img"
        aria-label="Calls by status"
      >
        {parts.map((s) => (
          <span
            key={s.key}
            title={`${s.label}: ${s.value}`}
            className={cn('h-full first:rounded-l last:rounded-r', s.className)}
            style={{ width: `${(s.value / t.total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {STATUS_SEGMENTS.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 text-ink"
          >
            <i className={cn('size-2.5 shrink-0 rounded-sm', s.className)} />
            {s.label}
            <span className="ml-auto font-semibold tabular-nums">{t[s.key]}</span>
            <span className="w-9 text-right text-muted tabular-nums">
              {Math.round((t[s.key] / t.total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Calls booked per day (single series) with a hover readout. */
export function DailyChart({ days }: { days: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.booked));
  const active = hover !== null ? days[hover] : null;
  const label = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    });
  const total = days.reduce((s, d) => s + d.booked, 0);
  return (
    <div className="grid gap-2 p-3">
      <div className="flex h-5 items-center justify-between text-xs">
        <span className="text-muted">
          {active ? label(active.date) : `${days.length} days`}
        </span>
        <span className="text-ink">
          <strong className="tabular-nums">{active ? active.booked : total}</strong>{' '}
          booked
          {active && (
            <>
              {' · '}
              <strong className="tabular-nums">{active.completed}</strong> completed
            </>
          )}
        </span>
      </div>
      <div
        className="flex h-32 items-end gap-0.5 border-b border-line"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Calls booked per day, ${total} in total`}
      >
        {days.map((d, i) => (
          <div
            key={d.date}
            className="flex h-full min-w-0 flex-1 items-end"
            onMouseEnter={() => setHover(i)}
          >
            <span
              className={cn(
                'w-full rounded-t-[3px] bg-brand transition-opacity',
                hover !== null && hover !== i && 'opacity-40',
              )}
              style={{ height: d.booked ? `${Math.max(3, (d.booked / max) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted">
        <span>{label(days[0].date)}</span>
        <span>{label(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}

/** Horizontal bars for the largest groups (companies, clients, projects). */
export function GroupBars({
  rows,
  limit = 8,
  unit = 'calls',
}: {
  rows: GroupSummary[];
  limit?: number;
  unit?: string;
}) {
  if (!rows.length) return <Empty>No calls in this range.</Empty>;
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit);
  const max = Math.max(1, ...shown.map((r) => r.total));
  return (
    <ul className="grid gap-2 p-3">
      {shown.map((r) => (
        <li
          key={r.key}
          className="grid gap-1"
          title={`${r.name}: ${r.total} ${unit}`}
        >
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-ink">{r.name}</span>
            <span className="shrink-0 text-muted tabular-nums">
              <strong className="text-ink">{r.total}</strong> · {r.complete} done · avg{' '}
              {hours(r.avgResolutionHours)}
            </span>
          </div>
          <div className="h-2 rounded bg-gray-100">
            <div
              className="h-full rounded bg-brand"
              style={{ width: `${(r.total / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {rest.length > 0 && (
        <li className="text-[11px] text-muted">
          + {rest.length} more ({rest.reduce((s, r) => s + r.total, 0)} {unit})
        </li>
      )}
    </ul>
  );
}

// ─── Lists ──────────────────────────────────────────────────────────────────

const th =
  'border-b border-line bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase';
const td = 'border-t border-line px-3 py-row align-middle text-[13px] text-ink';

export function CallList({
  calls,
  mode,
  showAssignee = true,
  showClient = true,
  empty,
}: {
  calls: DashboardCall[];
  mode: 'age' | 'resolution';
  showAssignee?: boolean;
  showClient?: boolean;
  empty: string;
}) {
  if (!calls.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Ticket</th>
            {showClient && <th className={th}>Client</th>}
            <th className={th}>Project</th>
            {showAssignee && <th className={th}>Assigned to</th>}
            <th className={th}>Status</th>
            <th className={cn(th, 'text-right')}>
              {mode === 'age' ? 'Waiting' : 'Took'}
            </th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c) => {
            const href = historyHref(c);
            const waited = ageHours(c);
            return (
              <tr
                key={c.sno}
                className="hover:bg-gray-50/60"
              >
                <td className={cn(td, 'whitespace-nowrap')}>
                  {href ? (
                    <Link
                      href={href}
                      className="font-semibold text-brand hover:underline"
                    >
                      #{c.tktId ?? c.sno}
                    </Link>
                  ) : (
                    `#${c.sno}`
                  )}
                  <span className="block text-[11px] text-muted">
                    {c.tktDate ? formatDate(c.tktDate) : '—'}
                  </span>
                </td>
                {showClient && <td className={td}>{c.clientName || '—'}</td>}
                <td className={td}>
                  {c.projectName || '—'}
                  {c.moduleName && (
                    <span className="block text-[11px] text-muted">{c.moduleName}</span>
                  )}
                </td>
                {showAssignee && <td className={td}>{assigneeNames(c)}</td>}
                <td className={td}>
                  <CallStatusBadge value={c.status} />
                </td>
                <td
                  className={cn(
                    td,
                    'text-right whitespace-nowrap tabular-nums',
                    mode === 'age' && (waited ?? 0) > 48 && 'font-semibold text-rose-700',
                  )}
                >
                  {mode === 'age' ? hours(waited) : hours(c.resolutionHours)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function GroupTable({ rows, label }: { rows: GroupSummary[]; label: string }) {
  if (!rows.length) return <Empty>No calls in this range.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>{label}</th>
            <th className={cn(th, 'text-right')}>Calls</th>
            <th className={cn(th, 'text-right')}>Pending</th>
            <th className={cn(th, 'text-right')}>In processing</th>
            <th className={cn(th, 'text-right')}>Completed</th>
            <th className={cn(th, 'text-right')}>Avg resolution</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className="hover:bg-gray-50/60"
            >
              <td className={cn(td, 'font-semibold')}>{r.name}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.total}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.open}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.progress}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{r.complete}</td>
              <td className={cn(td, 'text-right tabular-nums')}>
                {hours(r.avgResolutionHours)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
    >
      {message}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold hover:underline"
      >
        Retry
      </button>
    </div>
  );
}
