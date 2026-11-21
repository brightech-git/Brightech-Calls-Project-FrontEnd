import {
  getAllCallsBookings,
  getMyTasks,
} from '@/src/module/task-assignment/api/task-assignment.api';
import { getCallStatusHistory } from '@/src/module/call-status/api/call-status.api';
import { CallsBookingRecord } from '@/src/module/task-assignment/type/task-assignment.types';
import { CallStatusRecord } from '@/src/module/call-status/type/call-status.types';
import { describeCallStatus } from '@/src/utils/callStatus';
import type { DashboardCall } from '@/src/module/dashboard/type/dashboard.types';

export type { DashboardCall };

export function durationLabel(hours: number | null) {
  if (hours === null) return 'Not recorded';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hr`;
  return `${(hours / 24).toFixed(1)} days`;
}

export function enrichCall(
  booking: CallsBookingRecord,
  history: CallStatusRecord[],
  historyAvailable: boolean,
): DashboardCall {
  // SNO breaks timestamp ties; invalid/missing timestamps never produce a duration.
  const sorted = [...history].sort(
    (a, b) =>
      (Date.parse(b.UPDATED ?? '') || 0) - (Date.parse(a.UPDATED ?? '') || 0) || b.sno - a.sno,
  );
  const latest = sorted[0];
  const status = latest?.STATUS?.trim() ? latest.STATUS : booking.status;
  const complete = describeCallStatus(status).group === 'complete';
  const completion =
    complete && latest && describeCallStatus(latest.STATUS).group === 'complete'
      ? latest
      : undefined;
  const start = Date.parse(booking.tktDate ?? '');
  const end = Date.parse(completion?.UPDATED ?? '');
  // Oldest status entry = first response; newest = last activity.
  const times = history
    .map((h) => Date.parse(h.UPDATED ?? ''))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  const firstResponse = times.find((t) => !Number.isFinite(start) || t >= start);
  return {
    ...booking,
    status,
    historyAvailable,
    updateCount: history.length,
    updaters: Array.from(
      new Map(
        history
          .filter((h) => h.userId != null)
          .map((h) => [String(h.userId), h.userName || `User #${h.userId}`]),
      ),
    ).map(([id, name]) => ({ id, name })),
    firstResponseHours:
      firstResponse !== undefined && Number.isFinite(start)
        ? (firstResponse - start) / 3600000
        : null,
    lastActivity: times.length ? new Date(times[times.length - 1]).toISOString() : null,
    completedById: completion?.userId != null ? String(completion.userId) : null,
    completedBy:
      completion?.userName ||
      (completion?.userId != null ? `User #${completion.userId}` : 'Not recorded'),
    resolutionHours:
      complete && Number.isFinite(start) && Number.isFinite(end) && end >= start
        ? (end - start) / 3600000
        : null,
  };
}

export async function getDashboardCalls(
  userId: string,
  isAdmin: boolean,
  isClient: boolean,
  clientId: string,
) {
  if (isClient && !clientId)
    throw new Error('This client account has no client ID. Please contact your administrator.');
  let bookings: CallsBookingRecord[];
  if (!isAdmin && !isClient) {
    bookings = (await getMyTasks(userId)).filter((call) =>
      call.assignedUsers
        .split(',')
        .map((id) => id.trim())
        .includes(userId),
    );
  } else {
    // Read every page so totals never represent only the first 100 bookings.
    const summaries = [];
    for (let page = 0; ; page++) {
      const result = await getAllCallsBookings({
        page,
        size: 100,
        asOn: false,
        ...(isClient ? { clientId } : {}),
      });
      summaries.push(...result.content);
      if (result.last || page + 1 >= result.totalPages) break;
    }
    // Ticket history includes the full booking, including raw assignee IDs.
    bookings = summaries.map((call) => ({
      ...call,
      compId: 0,
      clientId: Number(clientId),
      assignedNames: call.assignedUsers,
      assignedUsers: '',
    }));
  }
  const calls: DashboardCall[] = [];
  // Bound concurrency; a failed history request keeps the booking visible.
  for (let offset = 0; offset < bookings.length; offset += 6) {
    const batch = await Promise.all(
      bookings.slice(offset, offset + 6).map(async (booking) => {
        if (booking.tktId == null) return enrichCall(booking, [], false);
        try {
          const response = await getCallStatusHistory(booking.tktId);
          const full = response.data.callBooking as CallsBookingRecord | null | undefined;
          if (isClient && full && Number(full.clientId) !== Number(clientId)) return null;
          return enrichCall(
            full ? { ...booking, ...full } : booking,
            response.data.statuses ?? [],
            true,
          );
        } catch {
          return enrichCall(booking, [], false);
        }
      }),
    );
    calls.push(...batch.filter((call): call is DashboardCall => call !== null));
  }
  return calls;
}
