// ─────────────────────────────────────────────
// services/ProjectLinkService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  ProjectLinkPayload,
  ProjectLinkRecord,
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
  active?: boolean
): Promise<ProjectLinkRecord[]> => {
  const response = await axiosInstance.get<ApiResponse<ProjectLinkRecord[]>>(
    "/project-links",
    { params: active !== undefined ? { active } : undefined }
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
