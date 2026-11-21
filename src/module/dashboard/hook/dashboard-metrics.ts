// Pure dashboard calculations over enriched calls. No React here, so every
// number on the admin, staff and client dashboards comes from one place.
import { describeCallStatus } from '@/src/utils/callStatus';
import type { UserRecord } from '@/src/module/auth/type/auth.types';
import type {
  DashboardCall,
  DashboardTotals,
  DateRangeKey,
  DayCount,
  GroupSummary,
  StaffPerformance,
  StatusGroup,
} from '@/src/module/dashboard/type/dashboard.types';

/** Open or in-progress calls older than this count as overdue. */
export const OVERDUE_HOURS = 48;

export const RANGE_OPTIONS: { key: DateRangeKey; label: string; days: number | null }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
];

export const groupOf = (call: DashboardCall): StatusGroup => describeCallStatus(call.status).group;

const isActiveWork = (call: DashboardCall) => {
  const g = groupOf(call);
  return g === 'open' || g === 'progress';
};

export const bookedAt = (call: DashboardCall) => Date.parse(call.tktDate ?? '');

export function ageHours(call: DashboardCall, now = Date.now()) {
  const start = bookedAt(call);
  return Number.isFinite(start) ? Math.max(0, (now - start) / 3600000) : null;
}

export const isOverdue = (call: DashboardCall, now = Date.now()) =>
  isActiveWork(call) && (ageHours(call, now) ?? 0) > OVERDUE_HOURS;

export function assigneeIds(call: DashboardCall): string[] {
  const ids = (call.assignedUsers ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return ids.length ? ids : Object.keys(call.userMap ?? {});
}

export function assigneeNames(call: DashboardCall): string {
  return (
    Object.values(call.userMap ?? {}).join(', ') ||
    call.assignedNames ||
    (call.assignedUsers
      ? call.assignedUsers
          .split(',')
          .map((id) => `User #${id.trim()}`)
          .join(', ')
      : 'Unassigned')
  );
}

export function filterByRange(calls: DashboardCall[], range: DateRangeKey, now = Date.now()) {
  const days = RANGE_OPTIONS.find((r) => r.key === range)?.days;
  if (!days) return calls;
  const from = now - days * 86400000;
  return calls.filter((c) => {
    const t = bookedAt(c);
    return !Number.isFinite(t) || t >= from;
  });
}

const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

function median(values: number[]) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const resolutionTimes = (calls: DashboardCall[]) =>
  calls
    .filter((c) => groupOf(c) === 'complete' && c.resolutionHours !== null)
    .map((c) => c.resolutionHours!);

const firstResponseTimes = (calls: DashboardCall[]) =>
  calls.filter((c) => c.firstResponseHours !== null).map((c) => c.firstResponseHours!);

export function totals(calls: DashboardCall[], now = Date.now()): DashboardTotals {
  const count = (g: StatusGroup) => calls.filter((c) => groupOf(c) === g).length;
  const complete = count('complete');
  const cancelled = count('cancelled');
  const decided = calls.length - cancelled;
  const times = resolutionTimes(calls);
  return {
    total: calls.length,
    open: count('open'),
    progress: count('progress'),
    complete,
    cancelled,
    other: count('other'),
    completionRate: decided > 0 ? (complete / decided) * 100 : null,
    avgResolutionHours: avg(times),
    medianResolutionHours: median(times),
    avgFirstResponseHours: avg(firstResponseTimes(calls)),
    overdue: calls.filter((c) => isOverdue(c, now)).length,
    timedCount: times.length,
  };
}

/** Per-employee performance. Shared calls count for every assignee. */
export function staffPerformance(
  calls: DashboardCall[],
  users: UserRecord[],
  now = Date.now(),
): StaffPerformance[] {
  return users
    .filter((u) => u.ISCLIENT?.toUpperCase() !== 'Y' && String(u.USERID) !== '999')
    .map((u) => {
      const id = String(u.USERID);
      const mine = calls.filter((c) => assigneeIds(c).includes(id));
      const done = mine.filter((c) => groupOf(c) === 'complete');
      const times = resolutionTimes(mine);
      const activity = calls
        .filter((c) => c.updaters.some((x) => x.id === id) && c.lastActivity)
        .map((c) => Date.parse(c.lastActivity!))
        .filter(Number.isFinite);
      const cancelled = mine.filter((c) => groupOf(c) === 'cancelled').length;
      const decided = mine.length - cancelled;
      return {
        id,
        name: u.USERNAME,
        active: u.ACTIVE === 'Y',
        assigned: mine.length,
        open: mine.filter((c) => groupOf(c) === 'open').length,
        progress: mine.filter((c) => groupOf(c) === 'progress').length,
        complete: done.length,
        completionRate: decided > 0 ? (done.length / decided) * 100 : null,
        avgResolutionHours: avg(times),
        fastestHours: times.length ? Math.min(...times) : null,
        slowestHours: times.length ? Math.max(...times) : null,
        avgFirstResponseHours: avg(firstResponseTimes(mine)),
        updatesLogged: calls.reduce(
          (sum, c) => sum + (c.updaters.some((x) => x.id === id) ? 1 : 0),
          0,
        ),
        overdue: mine.filter((c) => isOverdue(c, now)).length,
        lastActive: activity.length ? new Date(Math.max(...activity)).toISOString() : null,
      };
    })
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name));
}

/** Totals per company, client, project, etc. Largest first. */
export function groupBy(
  calls: DashboardCall[],
  pick: (c: DashboardCall) => string | null | undefined,
): GroupSummary[] {
  const map = new Map<string, DashboardCall[]>();
  calls.forEach((c) => {
    const name = pick(c)?.trim() || 'Not set';
    map.set(name, [...(map.get(name) ?? []), c]);
  });
  return Array.from(map, ([name, list]) => ({
    key: name,
    name,
    total: list.length,
    open: list.filter((c) => groupOf(c) === 'open').length,
    progress: list.filter((c) => groupOf(c) === 'progress').length,
    complete: list.filter((c) => groupOf(c) === 'complete').length,
    avgResolutionHours: avg(resolutionTimes(list)),
  })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Calls booked and completed per day, for the last `days` days. */
export function dailyCounts(calls: DashboardCall[], days: number, now = Date.now()): DayCount[] {
  const out: DayCount[] = [];
  const index = new Map<string, DayCount>();
  for (let i = days - 1; i >= 0; i--) {
    const row = { date: dayKey(now - i * 86400000), booked: 0, completed: 0 };
    out.push(row);
    index.set(row.date, row);
  }
  calls.forEach((c) => {
    const start = bookedAt(c);
    if (!Number.isFinite(start)) return;
    const booked = index.get(dayKey(start));
    if (booked) booked.booked++;
    if (groupOf(c) === 'complete' && c.resolutionHours !== null) {
      const done = index.get(dayKey(start + c.resolutionHours * 3600000));
      if (done) done.completed++;
    }
  });
  return out;
}

/** Oldest unfinished calls first. */
export const oldestOpen = (calls: DashboardCall[], limit = 8, now = Date.now()) =>
  calls
    .filter(isActiveWork)
    .sort((a, b) => (ageHours(b, now) ?? 0) - (ageHours(a, now) ?? 0))
    .slice(0, limit);

/** Most recently completed calls first. */
export const recentlyCompleted = (calls: DashboardCall[], limit = 8) =>
  calls
    .filter((c) => groupOf(c) === 'complete')
    .sort(
      (a, b) =>
        (Date.parse(b.lastActivity ?? '') || bookedAt(b) || 0) -
        (Date.parse(a.lastActivity ?? '') || bookedAt(a) || 0),
    )
    .slice(0, limit);
