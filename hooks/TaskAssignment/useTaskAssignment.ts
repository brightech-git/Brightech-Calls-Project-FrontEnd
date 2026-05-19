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
  CallsBookingPayload,
  UpdateStatusPayload,
} from "@/types/TaskAssignment/TaskAssignment";

const CALLS_BOOKING_KEY = [
  "calls-booking-list",
];

// GET ALL
export const useCallsBookingList = () =>
  useQuery({
    queryKey: CALLS_BOOKING_KEY,
    queryFn: getAllCallsBookings,
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
      mutationFn: (
        payload: CallsBookingPayload
      ) =>
        createCallsBooking(payload),

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