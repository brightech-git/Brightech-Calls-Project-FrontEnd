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
  CallsBookingMediaMeta,
  CallsBookingPayload,
  UpdateStatusPayload,
} from "@/types/TaskAssignment/TaskAssignment";
import { PageParams } from "@/types/common/Pagination";

const CALLS_BOOKING_KEY = [
  "calls-booking-list",
];

// GET ALL (paginated — defaults to a large page so existing
// client-side table pagination keeps working unchanged)
export const useCallsBookingList = (
  params?: PageParams
) =>
  useQuery({
    queryKey: [
      ...CALLS_BOOKING_KEY,
      params?.page ?? 0,
      params?.size ?? 100,
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
  staffId: string
) =>
  useQuery({
    queryKey: ["my-tasks", staffId],
    queryFn: () =>
      getMyTasks(staffId),
    enabled: !!staffId,
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
      }: {
        id: string;
        payload: CallsBookingPayload;
      }) =>
        updateCallsBooking(
          id,
          payload
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