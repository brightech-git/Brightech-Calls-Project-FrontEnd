// ─────────────────────────────────────────────
// hooks/ModuleMaster/useModuleMaster.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
} from "@/services/ModuleMasterService";

import {
  ModulePayload,
} from "@/types/ModuleMaster/ModuleMaster";

const MODULE_KEY = ["module-list"];

// GET ALL
export const useModuleList = () =>
  useQuery({
    queryKey: MODULE_KEY,
    queryFn: getAllModules,
  });

// GET BY ID
export const useGetModuleById = (id: string) =>
  useQuery({
    queryKey: ["module", id],
    queryFn: () => getModuleById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateModule = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModulePayload) =>
      createModule(payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: MODULE_KEY,
      }),
  });
};

// UPDATE
export const useUpdateModule = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ModulePayload;
    }) =>
      updateModule(id, payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: MODULE_KEY,
      }),
  });
};

// DELETE
export const useDeleteModule = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteModule(id),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: MODULE_KEY,
      }),
  });
};