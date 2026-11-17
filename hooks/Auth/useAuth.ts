// ─────────────────────────────────────────────
// hooks/auth/useAuth.ts
// ─────────────────────────────────────────────

import { saveSession } from '@/lib/auth/session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  loginUser,
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '@/services/AuthService';

import {
  LoginPayload,
  RegisterPayload,
  UpdateUserPayload,
  AuthResponse,
  UserRecord,
} from '@/types/Auth/Auth';
import { ApiResponse } from '@/types/ApiResponse';

// LOGIN HOOK
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => {
      return loginUser(payload);
    },

    onSuccess: (data: ApiResponse<AuthResponse>) => {
      const session = data.data;
      saveSession({
        isLoggedIn: 'true',
        calls_token: session.token ?? '',
        userId: String(session.userId ?? ''),
        staffId: String(session.staffId ?? ''),
        username: session.username ?? '',
        staffName: session.staffName ?? '',
        role: session.roleName ?? session.role ?? '',
        mobileNo: session.mobileNo ?? '',
        active: session.active ?? '',
        isClient: session.isClient ?? 'N',
        clientId: String(session.clientId ?? ''),
        menuIds: session.menuIds ? JSON.stringify(session.menuIds) : null,
        user: JSON.stringify({ ...data, data: { ...session, token: undefined } }),
      });

      queryClient.clear();
      window.dispatchEvent(new Event('calls-session-change'));
    },

    onError: (error) => {
      console.log('Login Error:', error);
    },
  });
};

// REGISTER HOOK
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => {
      return registerUser(payload);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['all-users'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-employees'] });
      queryClient.invalidateQueries({
        queryKey: ['auth-register'],
      });
    },

    onError: (error) => {
      console.log('Register Error:', error);
    },
  });
};

// GET ALL USERS HOOK
export const useGetAllUsers = () => {
  return useQuery<ApiResponse<UserRecord[]>, Error, UserRecord[]>({
    queryKey: ['all-users'],
    queryFn: getAllUsers,
    select: (res) => res?.data ?? [],
  });
};

// GET USER BY ID HOOK
export const useGetUserById = (id: string) => {
  return useQuery<UserRecord>({
    queryKey: ['user', id],
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
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};

// DELETE USER HOOK
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
};
