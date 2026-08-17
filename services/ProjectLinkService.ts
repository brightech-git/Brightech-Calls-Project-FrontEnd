// ─────────────────────────────────────────────
// services/ProjectLinkService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  ProjectLinkPayload,
  ProjectLinkRecord,
  ProjectLinkFilters,
} from "@/types/ProjectLink/ProjectLink";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// CREATE
export const createProjectLink = async (
  payload: ProjectLinkPayload
): Promise<ProjectLinkRecord> => {
  const response = await axiosInstance.post<ApiResponse<ProjectLinkRecord>>(
    "/project-links",
    payload
  );

  return response.data.data;
};

// GET ALL
export const getAllProjectLinks = async (
  filters?: ProjectLinkFilters
): Promise<ProjectLinkRecord[]> => {
  const response = await axiosInstance.get<ApiResponse<ProjectLinkRecord[]>>(
    "/project-links",
    {
      params: {
        active: filters?.active,
        clientId: filters?.clientId,
        projectTypeId: filters?.projectTypeId,
        deviceType: filters?.deviceType,
      },
    }
  );

  return response.data.data;
};

// GET BY ID
export const getProjectLinkById = async (
  id: string
): Promise<ProjectLinkRecord> => {
  const response = await axiosInstance.get<ApiResponse<ProjectLinkRecord>>(
    `/project-links/${id}`
  );

  return response.data.data;
};

// UPDATE
export const updateProjectLink = async (
  id: string,
  payload: ProjectLinkPayload
): Promise<ProjectLinkRecord> => {
  const response = await axiosInstance.put<ApiResponse<ProjectLinkRecord>>(
    `/project-links/${id}`,
    payload
  );

  return response.data.data;
};

// DELETE
export const deleteProjectLink = async (
  id: string
): Promise<ProjectLinkRecord> => {
  const response = await axiosInstance.delete<ApiResponse<ProjectLinkRecord>>(
    `/project-links/${id}`
  );

  return response.data.data;
};
