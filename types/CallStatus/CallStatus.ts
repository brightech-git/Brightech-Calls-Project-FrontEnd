// ─────────────────────────────────────────────
// types/CallStatus/CallStatus.ts
// ─────────────────────────────────────────────

export interface CallStatusPayload {
  TKTID: number;
  TKTDATE?: string | null;

  COMPID: number;

  PROJECTID?: string | null;
  PROJECTNAME?: string | null;

  MODULEID?: string | null;
  MODULENAME?: string | null;

  DESCRIPTION?: string | null;
  REMARK?: string | null;

  STAFFID?: string | null;

  STATUS?: string | null;

  USERID: number;

  ACTIVE?: string | null;

  CANCEL?: string | null;
  CANCELBY?: string | null;
  CANCELDATE?: string | null;
  CANCELUPTIME?: string | null;
}

export interface CallStatusRecord extends CallStatusPayload {
  SNO: number;

  IMAGE?: string | null;

  UPDATED?: string | null;
  UPTIME?: string | null;
}

export type CallStatusRecord_Table =
  CallStatusRecord & Record<string, unknown>;