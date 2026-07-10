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
  getAllCallStatus,
  getCallStatusByTicketId,
} from "@/services/CallStatusService";

import {
  CallStatusPayload,
} from "@/types/CallStatus/CallStatus";

const CALLSTATUS_KEY = ["callstatus-list"];

// GET ALL
export const useCallStatusList = () =>
  useQuery({
    queryKey: CALLSTATUS_KEY,
    queryFn: getAllCallStatus,
  });

// GET BY TICKET ID (booking + statuses)
export const useCallStatusByTicketId = (tktId: number | null) =>
  useQuery({
    queryKey: ["callstatus-ticket", tktId],
    queryFn: () => getCallStatusByTicketId(String(tktId)),
    enabled: !!tktId && tktId > 0,
  });

// CREATE
export const useCreateCallStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      image,
    }: {
      payload: CallStatusPayload;
      image?: File | null;
    }) => createCallStatus(payload, image),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: CALLSTATUS_KEY });
      qc.invalidateQueries({ queryKey: ["callstatus-ticket", variables.payload.tktId] });
      // Also refresh bookings since status auto-updates
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-bookings"] });
      qc.invalidateQueries({ queryKey: ["calls-booking-list"] });
    },
  });
};

// DELETE
export const useDeleteCallStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCallStatus(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CALLSTATUS_KEY });
    },
  });
};
