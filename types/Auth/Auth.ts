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
  roleId?: number;
  staffName?: string;
  mobileNo?: string;
  address1?: string;
  address2?: string;
  address3?: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  roleId?: number;
  staffName?: string;
  mobileNo?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  active?: string;
}

export interface AuthResponse {
  userId: number;
  username: string;
  staffName: string | null;
  roleId: number;
  roleName: string;
  mobileNo: string | null;
  token: string;
  active: string;
  message: string;
}

export interface UserRecord {
  USERID: number;
  USERNAME: string;
  STAFFNAME: string | null;
  ROLEID: number;
  MOBILENO: string | null;
  ADDRESS1: string | null;
  ADDRESS2: string | null;
  ADDRESS3: string | null;
  ACTIVE: string;
  CREATEDAT: string | null;
  UPDATEDAT: string | null;
}

// ─────────────────────────────────────────────
// CLIENT LOGIN (SEPARATE FROM COMPANY/USERMASTER LOGIN)
// ─────────────────────────────────────────────

export interface ClientLoginPayload {
  username: string;
  password: string;
}

export interface ClientAuthResponse {
  clientId: number;
  clientName: string;
  username: string;
  roleId: number;
  roleName: string;
  token: string;
  active: string;
  message: string;
  type: "CLIENT";
}

// ─────────────────────────────────────────────
// CLIENT REGISTER
// ─────────────────────────────────────────────

export interface ClientRegisterPayload {
  clientName: string;
  username: string;
  password: string;
  mobile?: string;
  email?: string;
}

export interface ClientRegisterResponse {
  success: boolean;
  message: string;
  clientId?: number;
  clientName?: string;
  username?: string;
}
