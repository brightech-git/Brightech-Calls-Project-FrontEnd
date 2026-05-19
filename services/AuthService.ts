// ─────────────────────────────────────────────
// services/auth/authService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import {
  LoginPayload,
  RegisterPayload,
  UpdateUserPayload,
  AuthResponse,
  UserRecord,
} from "@/types/Auth/Auth";

// LOGIN
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", payload);
    return response.data;
  } catch (err) {
    console.error("Login Error:", err);
    throw err;
  }
};

// REGISTER
export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/register", payload);
    return response.data;
  } catch (err) {
    console.error("Register Error:", err);
    throw err;
  }
};

// GET ALL USERS
export const getAllUsers = async (): Promise<UserRecord[]> => {
  const response = await axiosInstance.get<UserRecord[]>("/auth/users");
  return response.data;
};

// GET USER BY ID
export const getUserById = async (id: string): Promise<UserRecord> => {
  const response = await axiosInstance.get<UserRecord>(`/auth/users/${id}`);
  return response.data;
};

// UPDATE USER
export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<UserRecord> => {
  const response = await axiosInstance.put<UserRecord>(`/auth/users/${id}`, payload);
  return response.data;
};

// DELETE USER
export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/auth/users/${id}`);
};
