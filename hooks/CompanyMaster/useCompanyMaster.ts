// ─────────────────────────────────────────────
// hooks/CompanyMaster/useCompanyMaster.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "@/services/CompanyMasterService";
import { CompanyPayload } from "@/types/CompanyMaster/CompanyMaster";

const COMPANY_KEY = ["company-list"];

// GET ALL
export const useCompanyList = () =>
  useQuery({ queryKey: COMPANY_KEY, queryFn: getAllCompanies ,select :(res)=> res?.data ?? [] });

// GET BY ID
export const useGetCompanyById = (id: string) =>
  useQuery({
    queryKey: ["company", id],
    queryFn: () => getCompanyById(id),
    enabled: !!id,
  });

// CREATE
export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompanyPayload) => createCompany(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPANY_KEY }),
  });
};

// UPDATE
export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompanyPayload }) =>
      updateCompany(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPANY_KEY }),
  });
};

// DELETE
export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPANY_KEY }),
  });
};
