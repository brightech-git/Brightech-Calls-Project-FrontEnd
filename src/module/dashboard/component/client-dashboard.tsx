'use client';

import { useMemo, useState } from 'react';
import {
  filterByRange,
  groupBy,
  oldestOpen,
  recentlyCompleted,
  totals,
} from '@/src/module/dashboard/hook/dashboard-metrics';
import type { DashboardCall, DateRangeKey } from '@/src/module/dashboard/type/dashboard.types';
import {
  CallList,
  Empty,
  ErrorNotice,
  GroupBars,
  hours,
  Panel,
  percent,
  RangeFilter,
  StatTile,
  StatusBreakdown,
} from './dashboard-widgets';

/** A client's view: what they booked, where it stands, and how fast it is resolved. */
export default function ClientDashboard({
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
  const [range, setRange] = useState<DateRangeKey>('90d');
  const scoped = useMemo(() => filterByRange(calls, range), [calls, range]);
  const t = useMemo(() => totals(scoped), [scoped]);
  const byProject = useMemo(() => groupBy(scoped, (c) => c.projectName), [scoped]);
  const byModule = useMemo(
    () => groupBy(scoped, (c) => [c.projectName, c.moduleName].filter(Boolean).join(' / ')),
    [scoped],
  );
  const v = (x: React.ReactNode) => (loading ? '—' : x);

  return (
    <div className="grid min-w-0 gap-3">
      <RangeFilter
        value={range}
        onChange={setRange}
      />
      {error && (
        <ErrorNotice
          message={error}
          onRetry={onRetry}
        />
      )}

      <div className="grid grid-cols-5 gap-2 max-xl:grid-cols-3 max-sm:grid-cols-2">
        <StatTile
          label="Calls raised"
          value={v(t.total)}
        />
        <StatTile
          label="Waiting"
          value={v(t.open)}
          hint="Not started yet"
        />
        <StatTile
          label="Being worked on"
          value={v(t.progress)}
        />
        <StatTile
          label="Resolved"
          value={v(t.complete)}
          hint={loading ? undefined : `${percent(t.completionRate)} of your calls`}
          tone="good"
        />
        <StatTile
          label="Typical resolution"
          value={v(hours(t.medianResolutionHours))}
          hint={loading ? undefined : `First response ${hours(t.avgFirstResponseHours)} on average`}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
        <Panel
          title="Your open calls"
          subtitle="Longest waiting first"
        >
          {loading ? (
            <Empty>Loading…</Empty>
          ) : (
            <CallList
              calls={oldestOpen(scoped, 12)}
              mode="age"
              showClient={false}
              empty="All your calls are resolved."
            />
          )}
        </Panel>
        <div className="grid content-start gap-3">
          <Panel title="Status">
            {loading ? <Empty>Loading…</Empty> : <StatusBreakdown t={t} />}
          </Panel>
          <Panel title="Calls by project">
            {loading ? (
              <Empty>Loading…</Empty>
            ) : (
              <GroupBars
                rows={byProject}
                limit={6}
              />
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
        <Panel
          title="Recently resolved"
          subtitle="Time from booking to resolution"
        >
          <CallList
            calls={recentlyCompleted(scoped, 10)}
            mode="resolution"
            showClient={false}
            empty="No resolved calls in this range."
          />
        </Panel>
        <Panel title="Calls by module">
          {loading ? (
            <Empty>Loading…</Empty>
          ) : (
            <GroupBars
              rows={byModule}
              limit={6}
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
