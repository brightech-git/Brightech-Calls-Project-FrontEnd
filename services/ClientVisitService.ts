// ─────────────────────────────────────────────
// services/ClientVisitService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import {
  ClientVisitMediaMeta,
  ClientVisitPayload,
  ClientVisitRecord,
} from "@/types/ClientVisit/ClientVisit";
import { ApiResponse } from "@/types/ApiResponse";

const buildFormData = (
  payload: ClientVisitPayload,
  media?: File[] | null,
  mediaMeta?: ClientVisitMediaMeta[] | null
): FormData => {
  const formData = new FormData();

  formData.append("client", JSON.stringify(payload));

  (media ?? []).forEach((file) => formData.append("media", file));

  if (mediaMeta && mediaMeta.length) {
    formData.append("mediaMeta", JSON.stringify(mediaMeta));
  }

  return formData;
};

// CREATE (with optional media)
export const createClientVisit = async (
  payload: ClientVisitPayload,
  media?: File[] | null,
  mediaMeta?: ClientVisitMediaMeta[] | null
): Promise<ClientVisitRecord> => {
  const response = await axiosInstance.post<ClientVisitRecord>(
    "/clientvisit",
    buildFormData(payload, media, mediaMeta),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export interface ClientVisitFilters {
  active?: string;
  mobile?: string;
  area?: string;
  city?: string;
  client?: string;
  search?: string;
}

// GET ALL
export const getAllClientVisits = async (
  filters?: ClientVisitFilters
): Promise<ApiResponse<ClientVisitRecord[]>> => {
    const params = filters
      ? Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
        )
      : undefined;
    const response = await axiosInstance.get<ApiResponse<ClientVisitRecord[]>>("/clientvisit", { params });
    return response.data;
};

// GET BY ID
export const getClientVisitById = async (id: string): Promise<ClientVisitRecord> => {
  const response = await axiosInstance.get<ClientVisitRecord>(`/clientvisit/${id}`);
  return response.data;
};

// UPDATE (with optional new media)
export const updateClientVisit = async (
  id: string,
  payload: ClientVisitPayload,
  media?: File[] | null,
  mediaMeta?: ClientVisitMediaMeta[] | null
): Promise<ClientVisitRecord> => {
  const response = await axiosInstance.put<ClientVisitRecord>(
    `/clientvisit/${id}`,
    buildFormData(payload, media, mediaMeta),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

// DELETE
export const deleteClientVisit = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/clientvisit/${id}`);
};

// DELETE a single media item off an existing visit
export const deleteClientVisitMedia = async (mediaId: number): Promise<void> => {
  await axiosInstance.delete(`/clientvisit/media/${mediaId}`);
};
