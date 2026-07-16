// ─────────────────────────────────────────────
// types/auth/authTypes.ts
// ─────────────────────────────────────────────

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface UpdateUserPayload {
  username: string;
  password: string;
  active: string;
}

export interface AuthResponse {
  userId: number;
  staffId: number | null;
  username: string;
  staffName: string | null;
  role: string;
  mobileNo: string | null;
  token: string;
  active: string;
  message: string;
  /** Ids of the sidebar menu entries (config/menu/menuConfig.ts `id` field) this user may see. Absent/undefined until the backend sends it — treated as "show everything". */
  menuIds?: string[];
}

export interface UserRecord {
  USERID: string;
  USERNAME: string;
  ACTIVE: string;
  PWD: string;
  AUTHPWD: string | null;
  UPDATED: string | null;
  UPTIME: string | null;
}