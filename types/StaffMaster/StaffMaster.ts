export interface StaffPayload {
  STAFFNAME: string | null;
  MOBILENO: string | null;
  ROLE: string | null;
  ADDRESS1: string;
  ADDRESS2: string;
  ADDRESS3: string;
  DOJ: string | null;
  ACTIVE: "Y" | "N";
  USERID?: string;
}

export interface StaffRecord extends StaffPayload {
  SNO: number;
  STAFFID: string;
  UPDATED?: string;
  UPTIME?: string;
}

export type StaffRecord_Table = StaffRecord & Record<string, unknown>;
