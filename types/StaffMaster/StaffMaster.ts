export interface StaffPayload {
  SNO?: number;
  STAFFID?: string;
  USERID?: string | null;
  STAFFNAME: string | null;
  MOBILENO: string | null;
  ROLE: string | null;
  ADDRESS1?: string | null;
  ADDRESS2?: string | null;
  ADDRESS3?: string | null;
  DOJ?: string | null;
  ACTIVE: "Y" | "N";
}

export interface StaffRecord extends StaffPayload {
  SNO: number;
  STAFFID: string;
  UPDATED?: string | null;
  UPTIME?: string | null;
}

export type StaffRecord_Table = StaffRecord & Record<string, unknown>;
