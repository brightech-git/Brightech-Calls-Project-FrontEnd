// ─────────────────────────────────────────────
// services/ClientServerMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/ApiResponse";
import {
  ClientServerPayload,
  ClientServerRecord,
  PageResult,
} from "@/types/ClientServerMaster/ClientServerMaster";

export interface ClientServerFilters {
  clientId?: string;
  active?: string;
  page?: number;
  size?: number;
}

// CREATE
export const createClientServer = async (
  payload: ClientServerPayload
): Promise<ClientServerRecord> => {
  const response = await axiosInstance.post<ClientServerRecord>(
    "/clientserver",
    payload
  );
  return response.data;
};

// GET ALL (PAGINATED + FILTERS)
export const getAllClientServers = async (
  filters?: ClientServerFilters
): Promise<ApiResponse<PageResult<ClientServerRecord>>> => {
  const params = filters
    ? Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
      )
    : undefined;

  const response = await axiosInstance.get<ApiResponse<PageResult<ClientServerRecord>>>(
    "/clientserver",
    { params }
  );
  return response.data;
};

// GET BY ID
export const getClientServerById = async (id: string): Promise<ClientServerRecord> => {
  const response = await axiosInstance.get<ClientServerRecord>(`/clientserver/${id}`);
  return response.data;
};

// UPDATE
export const updateClientServer = async (
  id: string,
  payload: ClientServerPayload
): Promise<ClientServerRecord> => {
  const response = await axiosInstance.put<ClientServerRecord>(
    `/clientserver/${id}`,
    payload
  );
  return response.data;
};

// DELETE
export const deleteClientServer = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/clientserver/${id}`);
};
