// ─────────────────────────────────────────────
// services/RoleTranService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

export interface RoleTranRecord {
  SNO: number;
  ROLEID: number;
  ROLENAME: string;
  MODULEID: number;
  MODULENAME: string;
  SUBMODULEID: number;
  SUBMODULENAME: string;
  CONTENTID: number;
  CONTENTNAME: string;
  ACTIVE: boolean;
}

// GET BY ROLEID + ACTIVE
export const getRoleTranByRoleId = async (roleId: number): Promise<RoleTranRecord[]> => {
  const response = await axiosInstance.get<RoleTranRecord[]>(`/roletran/role/${roleId}/active`);
  return response.data;
};

// GET ALL
export const getAllRoleTran = async (): Promise<RoleTranRecord[]> => {
  const response = await axiosInstance.get<RoleTranRecord[]>("/roletran");
  return response.data;
};
