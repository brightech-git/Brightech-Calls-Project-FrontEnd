// ─────────────────────────────────────────────
// services/ModuleMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/ApiResponse";

import {
  ModulePayload,
  ModuleRecord,
} from "@/types/ModuleMaster/ModuleMaster";

const baseUrl = "/project/module"

// CREATE
export const createModule = async (
  payload: ModulePayload
): Promise<ModuleRecord> => {
  const response = await axiosInstance.post<ModuleRecord>(
    `${baseUrl}`,
    payload
  );

  return response.data;
};

// GET ALL
export const getAllModules = async (): Promise<ApiResponse<ModuleRecord[]>> => {
  const response = await axiosInstance.get<ApiResponse<ModuleRecord[]>>(
    `${baseUrl}`
  );

  return response.data;
};

// GET BY ID
export const getModuleById = async (
  id: string
): Promise<ModuleRecord> => {
  const response = await axiosInstance.get<ModuleRecord>(
    `${baseUrl}/${id}`
  );

  return response.data;
};

// UPDATE
export const updateModule = async (
  id: string,
  payload: ModulePayload
): Promise<ModuleRecord> => {
  const response = await axiosInstance.put<ModuleRecord>(
    `${baseUrl}/${id}`,
    payload
  );

  return response.data;
};

// DELETE
export const deleteModule = async (
  id: string
): Promise<void> => {
  await axiosInstance.delete(`${baseUrl}/${id}`);
};