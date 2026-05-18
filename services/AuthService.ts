// ─────────────────────────────────────────────
// services/auth/authService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import {
  LoginPayload,
  RegisterPayload,
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
  const response = await axiosInstance.get<UserRecord[]>("/user");
  return response.data;
};
