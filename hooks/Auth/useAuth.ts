// ─────────────────────────────────────────────
// hooks/auth/useAuth.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  loginUser,
  loginClient,
  registerUser,
  registerClient,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "@/services/AuthService";

import {
  LoginPayload,
  RegisterPayload,
  UpdateUserPayload,
  AuthResponse,
  UserRecord,
  ClientLoginPayload,
  ClientAuthResponse,
  ClientRegisterPayload,
  ClientRegisterResponse,
} from "@/types/Auth/Auth";

// LOGIN HOOK (COMPANY - ADMIN/STAFF)
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => {
      console.log("Hook received login payload:", payload);
      return loginUser(payload);
    },

    onSuccess: (data: AuthResponse) => {
      console.log("Login Success:", data);

      localStorage.setItem("isLoggedIn",  "true");
      localStorage.setItem("sessionType", "COMPANY");
      localStorage.setItem("calls_token", data.token ?? "");
      localStorage.setItem("userId",      String(data.userId ?? ""));
      localStorage.setItem("username",    data.username ?? "");
      localStorage.setItem("staffName",   data.staffName ?? "");
      localStorage.setItem("roleId",      String(data.roleId ?? ""));
      localStorage.setItem("roleName",    data.roleName ?? "");
      localStorage.setItem("mobileNo",    data.mobileNo ?? "");
      localStorage.setItem("active",      data.active ?? "");
      localStorage.setItem("user",        JSON.stringify({ ...data, sessionType: "COMPANY" }));

      queryClient.invalidateQueries({ queryKey: ["auth-login"] });
    },

    onError: (error) => {
      console.log("Login Error:", error);
    },
  });
};

// CLIENT LOGIN HOOK (SEPARATE SESSION - VIA CLIENTMAST)
export const useClientLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientLoginPayload) => {
      console.log("Hook received client login payload:", payload);
      return loginClient(payload);
    },

    onSuccess: (data: ClientAuthResponse) => {
      console.log("Client Login Success:", data);

      // REUSES THE SAME STORAGE KEYS AS COMPANY LOGIN SO EXISTING
      // PLUMBING (axios interceptor, Sidebar, etc.) KEEPS WORKING,
      // BUT TAGS THE SESSION AS "CLIENT" SO IT CAN BE TREATED DIFFERENTLY.
      localStorage.setItem("isLoggedIn",  "true");
      localStorage.setItem("sessionType", "CLIENT");
      localStorage.setItem("calls_token", data.token ?? "");
      localStorage.setItem("userId",      String(data.clientId ?? ""));
      localStorage.setItem("username",    data.username ?? "");
      localStorage.setItem("staffName",   data.clientName ?? "");
      localStorage.setItem("roleId",      String(data.roleId ?? ""));
      localStorage.setItem("roleName",    "CLIENT");
      localStorage.setItem("mobileNo",    "");
      localStorage.setItem("active",      data.active ?? "");
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: data.clientId,
          username: data.username,
          staffName: data.clientName,
          roleId: data.roleId,
          roleName: "CLIENT",
          token: data.token,
          active: data.active,
          sessionType: "CLIENT",
        })
      );

      queryClient.invalidateQueries({ queryKey: ["auth-login"] });
    },

    onError: (error) => {
      console.log("Client Login Error:", error);
    },
  });
};

// REGISTER HOOK
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => {
      console.log("Hook received register payload:", payload);
      return registerUser(payload);
    },

    onSuccess: (data: AuthResponse) => {
      console.log("Register Success:", data);

      // Don't overwrite login session — registration is admin creating a user
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },

    onError: (error) => {
      console.log("Register Error:", error);
    },
  });
};

// GET ALL USERS HOOK
export const useGetAllUsers = () => {
  return useQuery<UserRecord[]>({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
  });
};

// GET USER BY ID HOOK
export const useGetUserById = (id: string) => {
  return useQuery<UserRecord>({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

// UPDATE USER HOOK
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
};

// DELETE USER HOOK
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
};

// CLIENT REGISTER HOOK
export const useClientRegister = () => {
  return useMutation({
    mutationFn: (payload: ClientRegisterPayload) => registerClient(payload),
    onSuccess: (data: ClientRegisterResponse) => {
      console.log("Client Register Success:", data);
    },
    onError: (error) => {
      console.log("Client Register Error:", error);
    },
  });
};