import type { CallsBookingRecord } from '@/src/module/task-assignment/type/task-assignment.types';

export type DashboardRole = 'admin' | 'staff' | 'client';

export type StatusGroup = 'open' | 'progress' | 'complete' | 'cancelled' | 'other';

/** A booking enriched with its status history (see api/dashboard.api.ts). */
export type DashboardCall = CallsBookingRecord &
  Record<string, unknown> & {
    assignedNames?: string | null;
    completedBy: string;
    completedById: string | null;
    /** Booking time to the latest completion entry. */
    resolutionHours: number | null;
    /** Booking time to the first status entry anyone logged. */
    firstResponseHours: number | null;
    lastActivity: string | null;
    updateCount: number;
    /** Everyone who logged a status entry on this ticket. */
    updaters: { id: string; name: string }[];
    historyAvailable: boolean;
  };

export type DateRangeKey = '7d' | '30d' | '90d' | 'all';

export interface StaffPerformance extends Record<string, unknown> {
  id: string;
  name: string;
  active: boolean;
  assigned: number;
  open: number;
  progress: number;
  complete: number;
  /** Completed share of assigned calls, 0-100, null when nothing assigned. */
  completionRate: number | null;
  avgResolutionHours: number | null;
  fastestHours: number | null;
  slowestHours: number | null;
  avgFirstResponseHours: number | null;
  /** Status entries this person logged across all calls. */
  updatesLogged: number;
  /** Open or in-progress calls older than the overdue threshold. */
  overdue: number;
  lastActive: string | null;
}

export interface GroupSummary extends Record<string, unknown> {
  key: string;
  name: string;
  total: number;
  open: number;
  progress: number;
  complete: number;
  avgResolutionHours: number | null;
}

export interface DashboardTotals {
  total: number;
  open: number;
  progress: number;
  complete: number;
  cancelled: number;
  other: number;
  completionRate: number | null;
  avgResolutionHours: number | null;
  medianResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  overdue: number;
  timedCount: number;
}

export interface DayCount {
  date: string;
  booked: number;
  completed: number;
}
