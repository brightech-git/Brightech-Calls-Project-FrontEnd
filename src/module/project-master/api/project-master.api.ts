// ─────────────────────────────────────────────
// services/ProjectMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from '@/lib/api/axios-instance';
import { ApiResponse } from '@/lib/api/api-response';
import { ProjectPayload, ProjectRecord } from '@/src/module/project-master/type/project-master.types';

// CREATE
export const createProject = async (payload: ProjectPayload): Promise<ProjectRecord> => {
  const response = await axiosInstance.post<ProjectRecord>('/project', payload);

  return response.data;
};

// GET ALL
export const getAllProjects = async (): Promise<ApiResponse<ProjectRecord[]>> => {
  const response = await axiosInstance.get<ApiResponse<ProjectRecord[]>>('/project');

  return response.data;
};

// GET BY ID
export const getProjectById = async (id: string): Promise<ProjectRecord> => {
  const response = await axiosInstance.get<ProjectRecord>(`/project/${id}`);

  return response.data;
};

// UPDATE
export const updateProject = async (
  id: string,
  payload: ProjectPayload,
): Promise<ProjectRecord> => {
  const response = await axiosInstance.put<ProjectRecord>(`/project/${id}`, payload);

  return response.data;
};

// DELETE
export const deleteProject = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/project/${id}`);
};
