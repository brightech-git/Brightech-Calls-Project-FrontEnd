// ─────────────────────────────────────────────
// hooks/ProjectLink/useProjectLink.ts
// ─────────────────────────────────────────────

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProjectLink,
  getAllProjectLinks,
  getProjectLinkById,
  updateProjectLink,
  deleteProjectLink,
} from "@/services/ProjectLinkService";

import {
  ProjectLinkPayload,
} from "@/types/ProjectLink/ProjectLink";

const PROJECT_LINK_KEY = ["project-link-list"];

// GET ALL
export const useProjectLinkList = (active?: boolean) =>
  useQuery({
    queryKey: [...PROJECT_LINK_KEY, active ?? "all"],
    queryFn: () => getAllProjectLinks(active),
  });

// GET BY ID
export const useGetProjectLinkById = (id: string) =>
  useQuery({
    queryKey: ["project-link", id],
    queryFn: () => getProjectLinkById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateProjectLink = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectLinkPayload) =>
      createProjectLink(payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_LINK_KEY,
      }),
  });
};

// UPDATE
export const useUpdateProjectLink = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProjectLinkPayload;
    }) =>
      updateProjectLink(id, payload),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_LINK_KEY,
      }),
  });
};

// DELETE
export const useDeleteProjectLink = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteProjectLink(id),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: PROJECT_LINK_KEY,
      }),
  });
};
