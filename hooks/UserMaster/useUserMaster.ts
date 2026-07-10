// ─────────────────────────────────────────────
// hooks/UserMaster/useUserMaster.ts
// ─────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";
import { getClientUsers, getStaffAdminUsers } from "@/services/UserMasterService";

// Client users (roleId = 1)
export const useClientUsers = () =>
  useQuery({
    queryKey: ["client-users"],
    queryFn: getClientUsers,
  });

// Staff/Admin users (non-client)
export const useStaffAdminUsers = () =>
  useQuery({
    queryKey: ["staff-admin-users"],
    queryFn: getStaffAdminUsers,
  });
