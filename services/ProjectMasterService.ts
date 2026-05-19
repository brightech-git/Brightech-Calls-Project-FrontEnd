// ─────────────────────────────────────────────
// services/ProjectMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import {
  ProjectPayload,
  ProjectRecord,
} from "@/types/ProjectMaster/ProjectMaster";

// CREATE
export const createProject = async (
  payload: ProjectPayload
): Promise<ProjectRecord> => {
  const response = await axiosInstance.post<ProjectRecord>(
    "/project",
    payload
  );

  return response.data;
};

// GET ALL
export const getAllProjects = async (): Promise<ProjectRecord[]> => {
  const response = await axiosInstance.get<ProjectRecord[]>("/project");

  return response.data;
};

// GET BY ID
export const getProjectById = async (
  id: string
): Promise<ProjectRecord> => {
  const response = await axiosInstance.get<ProjectRecord>(
    `/project/${id}`
  );

  return response.data;
};

// UPDATE
export const updateProject = async (
  id: string,
  payload: ProjectPayload
): Promise<ProjectRecord> => {
  const response = await axiosInstance.put<ProjectRecord>(
    `/project/${id}`,
    payload
  );

  return response.data;
};

// DELETE
export const deleteProject = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/project/${id}`);
};