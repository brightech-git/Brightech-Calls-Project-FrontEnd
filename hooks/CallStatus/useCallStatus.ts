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
  getCallStatusById,
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
    select :(res) =>res.data
  });

// GET BY TICKET ID
export const useGetCallStatusById = (id: string) =>
  useQuery({
    queryKey: ["callstatus", id],
    queryFn: () => getCallStatusById(id),
    enabled: !!id,
    
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
    }) =>
      createCallStatus(payload, image),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: CALLSTATUS_KEY,
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
      qc.invalidateQueries({
        queryKey: CALLSTATUS_KEY,
      });
    },
  });
};