// ─────────────────────────────────────────────
// services/ModuleMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  ModulePayload,
  ModuleRecord,
} from "@/types/ModuleMaster/ModuleMaster";

// CREATE
export const createModule = async (
  payload: ModulePayload
): Promise<ModuleRecord> => {
  const response = await axiosInstance.post<ModuleRecord>(
    "/module",
    payload
  );

  return response.data;
};

// GET ALL
export const getAllModules = async (): Promise<ModuleRecord[]> => {
  const response = await axiosInstance.get<ModuleRecord[]>(
    "/module"
  );

  return response.data;
};

// GET BY ID
export const getModuleById = async (
  id: string
): Promise<ModuleRecord> => {
  const response = await axiosInstance.get<ModuleRecord>(
    `/module/${id}`
  );

  return response.data;
};

// UPDATE
export const updateModule = async (
  id: string,
  payload: ModulePayload
): Promise<ModuleRecord> => {
  const response = await axiosInstance.put<ModuleRecord>(
    `/module/${id}`,
    payload
  );

  return response.data;
};

// DELETE
export const deleteModule = async (
  id: string
): Promise<void> => {
  await axiosInstance.delete(`/module/${id}`);
};