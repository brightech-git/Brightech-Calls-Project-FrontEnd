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

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      queryClient.invalidateQueries({
        queryKey: ["auth-login"],
      });
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

      localStorage.setItem("token", data.token);
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
  return useQuery<UserRecord[]>({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
  });
};

// GET USER BY ID HOOK
export const useGetUserById = (id: number) => {
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
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
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
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
};