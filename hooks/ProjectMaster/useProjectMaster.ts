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
  getMyProjects,
  getProjectById,
  getProjectStaff,
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

// GET ALL (ROLE-BASED)
export const useMyProjectList = () =>
  useQuery({
    queryKey: ["my-project-list"],
    queryFn: getMyProjects,
  });

// GET BY ID
export const useGetProjectById = (id: string) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });

// GET PROJECT STAFF
export const useProjectStaff = (projectId: number | null) =>
  useQuery({
    queryKey: ["project-staff", projectId],
    queryFn: () => getProjectStaff(projectId!),
    enabled: !!projectId && projectId > 0,
  });

// CREATE
export const useCreateProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectPayload) =>
      createProject(payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEY });
      qc.invalidateQueries({ queryKey: ["my-project-list"] });
    },
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

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEY });
      qc.invalidateQueries({ queryKey: ["my-project-list"] });
    },
  });
};

// DELETE
export const useDeleteProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEY });
      qc.invalidateQueries({ queryKey: ["my-project-list"] });
    },
  });
};
