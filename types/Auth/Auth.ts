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
  roleId: string;
  active: string;
  /** Y/N — defaults to "N" on the backend if omitted. */
  isClient?: string;
  /** Required when isClient is "Y". */
  clientId?: number | null;
}

export interface UpdateUserPayload {
  username: string;
  roleId: string;
  active: string;
  /** Y/N. Required together with clientId when set to "Y". */
  isClient?: string;
  clientId?: number | null;
  /** Both required together to change the password; omit to leave it unchanged. */
  oldPassword?: string;
  newPassword?: string;
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
  /** Y/N — whether this account is a Client account. */
  isClient?: string | null;
  /** The CLIENTLIST record this account maps to when isClient is "Y". */
  clientId?: number | null;
}

export interface UserRecord {
  USERID: string;
  USERNAME: string;
  ACTIVE: string;
  PWD: string;
  ROLENAME :string
  ISCLIENT?: string | null;
  CLIENTID?: number | null;
  UPDATED: string | null;
  UPTIME: string | null;
}