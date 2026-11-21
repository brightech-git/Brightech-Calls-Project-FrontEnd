// ─────────────────────────────────────────────
// types/ClientServerMaster/ClientServerMaster.ts
// ─────────────────────────────────────────────

export interface ClientServerPayload {
  clientId: number;
  serverName: string;
  ipAddress: string;
  password?: string | null;
  active?: string | null;
}

export interface ClientServerRecord {
  sno: number;
  clientId: number;
  clientName?: string | null;
  serverName: string;
  ipAddress: string;
  password?: string | null;
  active?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  modifiedAt?: string | null;
  modifiedBy?: string | null;
}

export type ClientServerRecord_Table = ClientServerRecord & Record<string, unknown>;

// SHAPE OF SPRING'S Page<T> AS RETURNED BY THE PAGINATED GetAll ENDPOINT
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
