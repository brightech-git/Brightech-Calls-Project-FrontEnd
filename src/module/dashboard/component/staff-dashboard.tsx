'use client';

import { useMemo, useState } from 'react';
import {
  filterByRange,
  groupBy,
  oldestOpen,
  recentlyCompleted,
  totals,
} from '@/src/module/dashboard/hook/dashboard-metrics';
import type {
  DashboardCall,
  DateRangeKey,
} from '@/src/module/dashboard/type/dashboard.types';
import {
  CallList,
  Empty,
  ErrorNotice,
  GroupBars,
  hours,
  Panel,
  RangeFilter,
  StatusBreakdown,
  TotalsRow,
} from './dashboard-widgets';

/** A staff member's own queue: what to do next and how fast they finish. */
export default function StaffDashboard({
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
  const [range, setRange] = useState<DateRangeKey>('all');
  const scoped = useMemo(() => filterByRange(calls, range), [calls, range]);
  const t = useMemo(() => totals(scoped), [scoped]);
  const byClient = useMemo(() => groupBy(scoped, (c) => c.clientName), [scoped]);

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RangeFilter
          value={range}
          onChange={setRange}
        />
        <p className="text-xs text-muted">
          Avg first response {hours(t.avgFirstResponseHours)} · fastest completion{' '}
          {hours(
            scoped
              .filter((c) => c.resolutionHours !== null)
              .reduce<number | null>(
                (m, c) =>
                  m === null ? c.resolutionHours : Math.min(m, c.resolutionHours!),
                null,
              ),
          )}
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
        first="Assigned to you"
      />

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
        <Panel
          title="Your queue"
          subtitle="Pending and in processing, longest waiting first"
        >
          {loading ? (
            <Empty>Loading…</Empty>
          ) : (
            <CallList
              calls={oldestOpen(scoped, 12)}
              mode="age"
              showAssignee={false}
              empty="Nothing waiting. Your queue is clear."
            />
          )}
        </Panel>
        <div className="grid content-start gap-3">
          <Panel title="Status">
            {loading ? <Empty>Loading…</Empty> : <StatusBreakdown t={t} />}
          </Panel>
          <Panel title="Your calls by client">
            {loading ? (
              <Empty>Loading…</Empty>
            ) : (
              <GroupBars
                rows={byClient}
                limit={6}
              />
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Recently completed"
        subtitle="How long each one took from booking"
      >
        <CallList
          calls={recentlyCompleted(scoped, 10)}
          mode="resolution"
          showAssignee={false}
          empty="No completed calls in this range."
        />
      </Panel>
    </div>
  );
}
