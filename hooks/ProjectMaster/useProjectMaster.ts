// ─────────────────────────────────────────────
// hooks/ProjectMaster/useProjectMaster.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  updateProject,
} from "@/services/ProjectMasterService";

import {
  ProjectPayload,
    ProjectRecord,
} from "@/types/ProjectMaster/ProjectMaster";

const PROJECT_KEY = ["project-list"];

// GET ALL
export const useProjectList = () =>
  useQuery({
    queryKey: PROJECT_KEY,
    queryFn: getAllProjects,
  });

// GET BY ID
export const useGetProjectById = (id: string) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectPayload) =>
      createProject(payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_KEY,
      }),
  });
};

// UPDATE
export const useUpdateProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProjectPayload;
    }) => updateProject(id, payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_KEY,
      }),
  });
};

// DELETE
export const useDeleteProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_KEY,
      }),
  });
};