'use client';
import { useApiList } from '@/lib/query/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/client';
import type {
  ProjectLinkFilters,
  ProjectLinkPayload,
} from '@/types/ProjectLink/ProjectLink';
import {
  listProjectLinks,
  getProjectLink,
  createProjectLink,
  updateProjectLink,
  deleteProjectLink,
} from './service';
export const useProjectLinkList = (filters?: ProjectLinkFilters) =>
  useApiList([...queryKeys.projectLinks, filters ?? {}], (signal) =>
    listProjectLinks(filters, signal),
  );
export const useGetProjectLinkById = (id: string) =>
  useQuery({
    queryKey: ['project-link', id],
    queryFn: () => getProjectLink(id),
    enabled: !!id,
  });
export function useCreateProjectLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createProjectLink,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.projectLinks });
    },
  });
}
export function useUpdateProjectLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectLinkPayload }) =>
      updateProjectLink(id, payload),
    onSuccess: (_, { id }) => {
      void client.invalidateQueries({ queryKey: queryKeys.projectLinks });
      void client.invalidateQueries({ queryKey: ['project-link', id] });
    },
  });
}
export function useDeleteProjectLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectLink,
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: ['project-link', id] });
      void client.invalidateQueries({ queryKey: queryKeys.projectLinks });
    },
  });
}
