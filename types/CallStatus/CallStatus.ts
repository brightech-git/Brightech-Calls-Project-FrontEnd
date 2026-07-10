// ─────────────────────────────────────────────
// types/CallStatus/CallStatus.ts
// ─────────────────────────────────────────────

export interface CallStatusPayload {
  tktId: number;
  staffId?: number | null;
  remark?: string | null;
  STATUS?: string | null;
}

export interface CallStatusRecord {
  sno: number;
  tktId: number;
  staffId?: number | null;
  staffName?: string | null;
  remark?: string | null;
  STATUS?: string | null;
  mediaId?: number | null;
  IMAGE?: string | null;
  userId?: number | null;
  userName?: string | null;
  CREATEDBY?: number | null;
  UPDATEDBY?: number | null;
  CREATEDAT?: string | null;
  UPDATEDAT?: string | null;
  mediaDetail?: {
    mediaId: number;
    mediaUrl: string;
    mediaType: string;
    displayOrder: number;
    active: boolean;
  } | null;
}

export interface CallStatusTicketResponse {
  callBooking?: any;
  statuses: CallStatusRecord[];
}

export type CallStatusRecord_Table =
  CallStatusRecord & Record<string, unknown>;
