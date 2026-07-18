// ─────────────────────────────────────────────
// hooks/CallStatus/useCallStatus.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCallStatus,
  deleteCallStatus,
  getActiveBookingsWithLastStatus,
  getCallStatusHistory,
} from "@/services/CallStatusService";

import {
  CallStatusPayload,
} from "@/types/CallStatus/CallStatus";

const ACTIVE_BOOKINGS_KEY = ["callstatus-active-bookings"];

// ACTIVE (Y) BOOKINGS + LAST STATUS — Call Status list page
export const useActiveBookingsWithLastStatus = () =>
  useQuery({
    queryKey: ACTIVE_BOOKINGS_KEY,
    queryFn: getActiveBookingsWithLastStatus,
    select: (res) => res.data ?? [],
  });

// FULL TICKET DETAIL (booking summary + full status history) — used by
// both the Call Status detail page and the Task Assignment preview.
export const useCallStatusTicketDetail = (tktId?: number | null) =>
  useQuery({
    queryKey: ["callstatus-ticket-detail", tktId],
    queryFn: () => getCallStatusHistory(tktId as number),
    enabled: !!tktId,
    select: (res) => res.data,
  });

// STATUS HISTORY ONLY (used by the Task Assignment preview)
export const useCallStatusHistory = (tktId?: number | null) =>
  useQuery({
    queryKey: ["callstatus-history", tktId],
    queryFn: () => getCallStatusHistory(tktId as number),
    enabled: !!tktId,
    select: (res) => res.data?.statuses ?? [],
  });

// CREATE (supports multiple media files)
export const useCreateCallStatus = () => {

  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      media,
    }: {
      payload: CallStatusPayload;
      media?: File[];
    }) =>
      createCallStatus(payload, media),

    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ACTIVE_BOOKINGS_KEY });
      qc.invalidateQueries({
        queryKey: ["callstatus-ticket-detail", variables.payload.tktId],
      });
      qc.invalidateQueries({
        queryKey: ["callstatus-history", variables.payload.tktId],
      });
    },
  });
};

// DELETE
export const useDeleteCallStatus = () => {

  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteCallStatus(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACTIVE_BOOKINGS_KEY });
    },
  });
};
