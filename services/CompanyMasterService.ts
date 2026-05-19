// ─────────────────────────────────────────────
// services/CompanyMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import { CompanyPayload, CompanyRecord } from "@/types/CompanyMaster/CompanyMaster";

// CREATE
export const createCompany = async (payload: CompanyPayload): Promise<CompanyRecord> => {
  const response = await axiosInstance.post<CompanyRecord>("/company", payload);
  return response.data;
};

// GET ALL
export const getAllCompanies = async (): Promise<CompanyRecord[]> => {
  const response = await axiosInstance.get<CompanyRecord[]>("/company");
  return response.data;
};

// GET BY ID
export const getCompanyById = async (id: string): Promise<CompanyRecord> => {
  const response = await axiosInstance.get<CompanyRecord>(`/company/${id}`);
  return response.data;
};

// UPDATE
export const updateCompany = async (id: string, payload: CompanyPayload): Promise<CompanyRecord> => {
  const response = await axiosInstance.put<CompanyRecord>(`/company/${id}`, payload);
  return response.data;
};

// DELETE
export const deleteCompany = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/company/${id}`);
};
