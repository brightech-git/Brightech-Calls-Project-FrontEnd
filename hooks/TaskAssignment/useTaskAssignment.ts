// ─────────────────────────────────────────────
// hooks/CallsBooking/useCallsBooking.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCallsBooking,
  getAllCallsBookings,
  getCallsBookingById,
  updateCallsBooking,
  deleteCallsBooking,
  getMyTasks,
  getCallsByStatus,
  updateCallsBookingStatus,
} from "@/services/TaskAssignmentService";

import {
  CallsBookingListParams,
  CallsBookingMediaMeta,
  CallsBookingPayload,
  UpdateStatusPayload,
} from "@/types/TaskAssignment/TaskAssignment";

const CALLS_BOOKING_KEY = [
  "calls-booking-list",
];

// GET ALL (paginated — defaults to a large page so existing
// client-side table pagination keeps working unchanged)
// fromDate/toDate (yyyy-MM-dd) are optional and included in the query key
// so switching the date filter (or the "As On" single-day filter, which
// callers pass as fromDate === toDate) refetches instead of reusing a
// stale cached page.
export const useCallsBookingList = (
  params?: CallsBookingListParams
) =>
  useQuery({
    queryKey: [
      ...CALLS_BOOKING_KEY,
      params?.page ?? 0,
      params?.size ?? 100,
      params?.fromDate ?? null,
      params?.toDate ?? null,
    ],
    queryFn: () =>
      getAllCallsBookings(params),
  });

// GET BY ID
export const useGetCallsBookingById = (
  id: string
) =>
  useQuery({
    queryKey: ["calls-booking", id],
    queryFn: () =>
      getCallsBookingById(id),
    enabled: !!id,
  });

// GET MY TASKS
export const useMyTasks = (
  userId: string
) =>
  useQuery({
    queryKey: ["my-tasks", userId],
    queryFn: () =>
      getMyTasks(userId),
    enabled: !!userId,
  });

// GET BY STATUS
export const useCallsByStatus = (
  status: string
) =>
  useQuery({
    queryKey: ["calls-status", status],
    queryFn: () =>
      getCallsByStatus(status),
    enabled: !!status,
  });

// CREATE
export const useCreateCallsBooking =
  () => {

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
      }) =>
        createCallsBooking(payload, media, mediaMeta),

      onSuccess: () =>
        qc.invalidateQueries({
          queryKey:
            CALLS_BOOKING_KEY,
        }),
    });
  };

// UPDATE
export const useUpdateCallsBooking =
  () => {

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
      }) =>
        updateCallsBooking(
          id,
          payload,
          media,
          mediaMeta
        ),

      onSuccess: () =>
        qc.invalidateQueries({
          queryKey:
            CALLS_BOOKING_KEY,
        }),
    });
  };

// UPDATE STATUS
export const useUpdateCallsBookingStatus =
  () => {

    const qc = useQueryClient();

    return useMutation({
      mutationFn: ({
        id,
        status,
        remark,
      }: UpdateStatusPayload) =>
        updateCallsBookingStatus(
          id,
          status,
          remark
        ),

      onSuccess: () =>
        qc.invalidateQueries({
          queryKey:
            CALLS_BOOKING_KEY,
        }),
    });
  };

// DELETE
export const useDeleteCallsBooking =
  () => {

    const qc = useQueryClient();

    return useMutation({
      mutationFn: (id: string) =>
        deleteCallsBooking(id),

      onSuccess: () =>
        qc.invalidateQueries({
          queryKey:
            CALLS_BOOKING_KEY,
        }),
    });
  };