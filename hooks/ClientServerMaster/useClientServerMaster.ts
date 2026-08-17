// ─────────────────────────────────────────────
// hooks/ClientServerMaster/useClientServerMaster.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClientServerFilters,
  createClientServer,
  deleteClientServer,
  getAllClientServers,
  getClientServerById,
  updateClientServer,
} from "@/services/ClientServerMasterService";
import { ClientServerPayload } from "@/types/ClientServerMaster/ClientServerMaster";

const CLIENT_SERVER_KEY = ["client-server-list"];

// GET ALL
export const useClientServerList = (filters?: ClientServerFilters) =>
  useQuery({
    queryKey: [...CLIENT_SERVER_KEY, filters ?? {}],
    queryFn: () => getAllClientServers(filters),
    select: (res) => res.data,
  });

// GET BY ID
export const useGetClientServerById = (id: string) =>
  useQuery({
    queryKey: ["client-server", id],
    queryFn: () => getClientServerById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateClientServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientServerPayload) => createClientServer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_SERVER_KEY }),
  });
};

// UPDATE
export const useUpdateClientServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientServerPayload }) =>
      updateClientServer(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_SERVER_KEY }),
  });
};

// DELETE
export const useDeleteClientServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClientServer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_SERVER_KEY }),
  });
};
