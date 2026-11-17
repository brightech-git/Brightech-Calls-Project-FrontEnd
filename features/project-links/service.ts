import { axiosInstance } from '@/api/axiosInstance';
import { unwrapResponse } from '@/lib/api/errors';
import type { ApiResponse } from '@/types/ApiResponse';
import type {
  ProjectLinkFilters,
  ProjectLinkPayload,
  ProjectLinkRecord,
} from '@/types/ProjectLink/ProjectLink';
export async function listProjectLinks(
  filters?: ProjectLinkFilters,
  signal?: AbortSignal,
) {
  return unwrapResponse(
    (
      await axiosInstance.get<ApiResponse<ProjectLinkRecord[]>>('/project-links', {
        params: filters,
        signal,
      })
    ).data,
  );
}
export async function getProjectLink(id: string) {
  return unwrapResponse(
    (await axiosInstance.get<ApiResponse<ProjectLinkRecord>>(`/project-links/${id}`))
      .data,
  );
}
export async function createProjectLink(payload: ProjectLinkPayload) {
  return unwrapResponse(
    (await axiosInstance.post<ApiResponse<ProjectLinkRecord>>('/project-links', payload))
      .data,
  );
}
export async function updateProjectLink(id: string, payload: ProjectLinkPayload) {
  return unwrapResponse(
    (
      await axiosInstance.put<ApiResponse<ProjectLinkRecord>>(
        `/project-links/${id}`,
        payload,
      )
    ).data,
  );
}
export async function deleteProjectLink(id: string) {
  return unwrapResponse(
    (await axiosInstance.delete<ApiResponse<ProjectLinkRecord>>(`/project-links/${id}`))
      .data,
  );
}
