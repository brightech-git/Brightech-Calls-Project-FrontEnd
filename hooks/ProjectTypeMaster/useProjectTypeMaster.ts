// ─────────────────────────────────────────────
// hooks/ProjectTypeMaster/useProjectTypeMaster.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProjectType,
  getAllProjectTypes,
  getProjectTypeById,
  updateProjectType,
  deleteProjectType,
} from "@/services/ProjectTypeMasterService";

import {
  ProjectTypePayload,
} from "@/types/ProjectTypeMaster/ProjectTypeMaster";

const PROJECT_TYPE_KEY = ["project-type-list"];

// GET ALL
export const useProjectTypeList = (active?: boolean) =>
  useQuery({
    queryKey: [...PROJECT_TYPE_KEY, active ?? "all"],
    queryFn: () => getAllProjectTypes(active),
  });

// GET BY ID
export const useGetProjectTypeById = (id: string) =>
  useQuery({
    queryKey: ["project-type", id],
    queryFn: () => getProjectTypeById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateProjectType = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectTypePayload) =>
      createProjectType(payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_TYPE_KEY,
      }),
  });
};

// UPDATE
export const useUpdateProjectType = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProjectTypePayload;
    }) =>
      updateProjectType(id, payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_TYPE_KEY,
      }),
  });
};

// DELETE
export const useDeleteProjectType = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteProjectType(id),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_TYPE_KEY,
      }),
  });
};
