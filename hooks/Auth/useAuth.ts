// ─────────────────────────────────────────────
// hooks/auth/useAuth.ts
// ─────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  loginUser,
  registerUser,
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
} from "@/types/Auth/Auth";
import { ApiResponse } from "@/types/ApiResponse";

// LOGIN HOOK
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
      localStorage.setItem("calls_token",       data.token ?? "");
      localStorage.setItem("userId",      String(data.userId ?? ""));
      localStorage.setItem("staffId",     String(data.staffId ?? ""));
      localStorage.setItem("username",    data.username ?? "");
      localStorage.setItem("staffName",   data.staffName ?? "");
      localStorage.setItem("role",        data.role ?? "");
      localStorage.setItem("mobileNo",    data.mobileNo ?? "");
      localStorage.setItem("active",      data.active ?? "");
      localStorage.setItem("user",        JSON.stringify(data));
      if (data.menuIds) {
        localStorage.setItem("menuIds", JSON.stringify(data.menuIds));
      } else {
        localStorage.removeItem("menuIds");
      }

      queryClient.invalidateQueries({ queryKey: ["auth-login"] });
    },

    onError: (error) => {
      console.log("Login Error:", error);
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

      localStorage.setItem("calls_token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      queryClient.invalidateQueries({
        queryKey: ["auth-register"],
      });
    },

    onError: (error) => {
      console.log("Register Error:", error);
    },
  });
};

// GET ALL USERS HOOK
export const useGetAllUsers = () => {
  return useQuery<ApiResponse<UserRecord[]>, Error, UserRecord[]>({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
    select: (res) => res?.data ?? []
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