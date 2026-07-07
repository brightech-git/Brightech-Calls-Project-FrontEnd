// ─────────────────────────────────────────────
// services/ProjectTypeMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  ProjectTypePayload,
  ProjectTypeRecord,
} from "@/types/ProjectTypeMaster/ProjectTypeMaster";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// CREATE
export const createProjectType = async (
  payload: ProjectTypePayload
): Promise<ProjectTypeRecord> => {
  const response = await axiosInstance.post<ApiResponse<ProjectTypeRecord>>(
    "/projecttype",
    payload
  );

  return response.data.data;
};

// GET ALL
export const getAllProjectTypes = async (
  active?: boolean
): Promise<ProjectTypeRecord[]> => {
  const response = await axiosInstance.get<ApiResponse<ProjectTypeRecord[]>>(
    "/projecttype",
    { params: active !== undefined ? { active } : undefined }
  );
  console.log(response,'response')

  return response.data.data;
};

// GET BY ID
export const getProjectTypeById = async (
  id: string
): Promise<ProjectTypeRecord> => {
  const response = await axiosInstance.get<ApiResponse<ProjectTypeRecord>>(
    `/projecttype/${id}`
  );

  return response.data.data;
};

// UPDATE
export const updateProjectType = async (
  id: string,
  payload: ProjectTypePayload
): Promise<ProjectTypeRecord> => {
  const response = await axiosInstance.put<ApiResponse<ProjectTypeRecord>>(
    `/projecttype/${id}`,
    payload
  );

  return response.data.data;
};

// DELETE
export const deleteProjectType = async (
  id: string
): Promise<ProjectTypeRecord> => {
  const response = await axiosInstance.delete<ApiResponse<ProjectTypeRecord>>(
    `/projecttype/${id}`
  );

  return response.data.data;
};
