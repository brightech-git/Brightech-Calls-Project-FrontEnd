// ─────────────────────────────────────────────
// services/UserMasterService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

export interface UserOption {
  userId: number;
  username: string;
  staffName: string;
  roleId?: number;
}

// GET CLIENT USERS (roleId = 1)
export const getClientUsers = async (): Promise<UserOption[]> => {
  const response = await axiosInstance.get<UserOption[]>("/user/clients/1");
  return response.data;
};

// GET STAFF/ADMIN USERS (non-client)
export const getStaffAdminUsers = async (): Promise<UserOption[]> => {
  const response = await axiosInstance.get<UserOption[]>("/user/without-client/1");
  return response.data;
};
