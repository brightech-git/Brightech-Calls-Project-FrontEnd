import { invalidateCallQueries } from '@/lib/query/invalidate';
// ─────────────────────────────────────────────
// hooks/CallsBooking/useCallsBooking.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCallsBooking,
  getCallsBookingsForTable,
  getCallsBookingById,
  updateCallsBooking,
  deleteCallsBooking,
  getMyTasks,
  getCallsByStatus,
  updateCallsBookingStatus,
} from '@/services/TaskAssignmentService';

import {
  CallsBookingListParams,
  CallsBookingMediaMeta,
  CallsBookingPayload,
  UpdateStatusPayload,
} from '@/types/TaskAssignment/TaskAssignment';

const CALLS_BOOKING_KEY = ['calls-booking-list'];

// GET ALL: collect server pages of at most 200 rows for the local table.
// fromDate/toDate (yyyy-MM-dd) are optional and included in the query key
// so switching the date filter (or the "As On" single-day filter, which
// callers pass as fromDate === toDate) refetches instead of reusing a
// stale cached page.
export const useCallsBookingList = (params?: CallsBookingListParams) => {
  const {
    page = 0,
    size = 200,
    fromDate = '',
    toDate = '',
    asOn = false,
    asOnDate = '',
    clientId = '',
    userId = '',
    status = '',
    projectId = '',
    moduleId = '',
  } = params ?? {};

  return useQuery({
    queryKey: [
      ...CALLS_BOOKING_KEY,
      {
        page,
        size,
        fromDate: asOn ? '' : fromDate,
        toDate: asOn ? '' : toDate,
        asOn,
        asOnDate: asOn ? asOnDate : '',
        clientId,
        userId,
        status,
        projectId,
        moduleId,
      },
    ],

    queryFn: ({ signal }) =>
      getCallsBookingsForTable(
        {
          page,
          size,
          fromDate,
          toDate,
          asOn,
          asOnDate,
          clientId,
          userId,
          status,
          projectId,
          moduleId,
        },
        signal,
      ),

    placeholderData: (previousData) => previousData,
  });
};

// GET BY ID
export const useGetCallsBookingById = (id: string) =>
  useQuery({
    queryKey: ['calls-booking', id],
    queryFn: () => getCallsBookingById(id),
    enabled: !!id,
  });

// GET MY TASKS
export const useMyTasks = (userId: string) =>
  useQuery({
    queryKey: ['my-tasks', userId],
    queryFn: () => getMyTasks(userId),
    enabled: !!userId,
  });

// GET BY STATUS
export const useCallsByStatus = (status: string) =>
  useQuery({
    queryKey: ['calls-status', status],
    queryFn: () => getCallsByStatus(status),
    enabled: !!status,
  });

// CREATE
export const useCreateCallsBooking = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      media,
      mediaMeta,
    }: {
      payload: CallsBookingPayload;
      media?: File[] | null;
      mediaMeta?: CallsBookingMediaMeta[] | null;
    }) => createCallsBooking(payload, media, mediaMeta),

    onSuccess: () => {
      invalidateCallQueries(qc);
    },
  });
};

// UPDATE
export const useUpdateCallsBooking = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      media,
      mediaMeta,
    }: {
      id: string;
      payload: CallsBookingPayload;
      media?: File[] | null;
      mediaMeta?: CallsBookingMediaMeta[] | null;
    }) => updateCallsBooking(id, payload, media, mediaMeta),

    onSuccess: () => {
      invalidateCallQueries(qc);
    },
  });
};

// UPDATE STATUS
export const useUpdateCallsBookingStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, remark }: UpdateStatusPayload) =>
      updateCallsBookingStatus(id, status, remark),

    onSuccess: () => {
      invalidateCallQueries(qc);
    },
  });
};

// DELETE
export const useDeleteCallsBooking = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCallsBooking(id),

    onSuccess: () => {
      invalidateCallQueries(qc);
    },
  });
};
