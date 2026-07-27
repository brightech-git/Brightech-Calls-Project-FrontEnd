// ─────────────────────────────────────────────
// hooks/ApiHooks/ClientVisit/useClientVisit.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClientVisitFilters,
  createClientVisit,
  deleteClientVisit,
  getAllClientVisits,
  getClientVisitById,
  updateClientVisit,
} from "@/services/ClientVisitService";
import { ClientVisitMediaMeta, ClientVisitPayload } from "@/types/ClientVisit/ClientVisit";

const CLIENT_VISIT_KEY = ["client-visit-list"];

// GET ALL
export const useClientVisitList = (filters?: ClientVisitFilters) =>
  useQuery({ queryKey: [...CLIENT_VISIT_KEY, filters ?? {}],
     queryFn: () => getAllClientVisits(filters) ,
    select : (res) =>res.data });

// GET BY ID
export const useGetClientVisitById = (id: string) =>
  useQuery({
    queryKey: ["client-visit", id],
    queryFn: () => getClientVisitById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateClientVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      media,
      mediaMeta,
    }: {
      payload: ClientVisitPayload;
      media?: File[] | null;
      mediaMeta?: ClientVisitMediaMeta[] | null;
    }) => createClientVisit(payload, media, mediaMeta),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_VISIT_KEY }),
  });
};

// UPDATE
export const useUpdateClientVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      media,
      mediaMeta,
    }: {
      id: string;
      payload: ClientVisitPayload;
      media?: File[] | null;
      mediaMeta?: ClientVisitMediaMeta[] | null;
    }) => updateClientVisit(id, payload, media, mediaMeta),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_VISIT_KEY }),
  });
};

// DELETE
export const useDeleteClientVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClientVisit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_VISIT_KEY }),
  });
};
