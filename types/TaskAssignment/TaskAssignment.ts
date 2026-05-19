// ─────────────────────────────────────────────
// types/CallsBooking/CallsBooking.ts
// ─────────────────────────────────────────────

export interface CallsBookingPayload {
  TKTID: number;

  TKTDATE?: string | null;

  COMPID: number;

  PROJECTID?: string | null;
  PROJECTNAME?: string | null;

  MODULEID?: string | null;
  MODULENAME?: string | null;

  DESCRIPTION?: string | null;
  REMARK?: string | null;

  STAFFID: string;

  STATUS?: string | null;

  USERID: string;

  ACTIVE?: string | null;

  CANCEL?: string | null;
  CANCELBY?: string | null;

  CANCELDATE?: string | null;
  CANCELUPTIME?: string | null;
}

export interface CallsBookingRecord
  extends CallsBookingPayload {

  SNO: number;

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