// ─────────────────────────────────────────────
// types/CallsBooking/CallsBooking.ts
// ─────────────────────────────────────────────

export interface CallsBookingPayload {
  COMPID: number;
  CLIENTID: number;
  PROJECTID?: string | null;
  PROJECTNAME?: string | null;
  MODULEID?: string | null;
  MODULENAME?: string | null;
  DESCRIPTION?: string | null;
  REMARK?: string | null;
  STAFFID: string;
  STATUS?: string | null;
  ACTIVE?: string | null;
}

export interface CallsBookingRecord extends CallsBookingPayload {
  SNO: number;
  TKTID?: number | null;
  TKTDATE?: string | null;
  COMPANYNAME?: string | null;
  CLIENTNAME?: string | null;
  STAFFNAME?: string | null;
  USERID?: string | null;
  CANCEL?: string | null;
  CANCELBY?: string | null;
  CANCELDATE?: string | null;
  CANCELUPTIME?: string | null;
  UPDATED?: string | null;
  UPTIME?: string | null;
}

export interface UpdateStatusPayload {
  id: string;
  status: string;
  remark?: string;
}

export type CallsBookingRecord_Table =
  CallsBookingRecord &
  Record<string, unknown>;