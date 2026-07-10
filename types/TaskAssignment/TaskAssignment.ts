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
  STAFFIDS?: string | null;       // comma-separated userIds
  STATUS?: string | null;
  ACTIVE?: string | null;
}

export interface CallsBookingRecord {
  SNO: number;
  TKTID?: number | null;
  TKTDATE?: string | null;
  COMPID: number;
  COMPANYNAME?: string | null;
  CLIENTID: number;
  CLIENTNAME?: string | null;
  PROJECTID?: string | null;
  PROJECTNAME?: string | null;
  MODULEID?: string | null;
  MODULENAME?: string | null;
  DESCRIPTION?: string | null;
  REMARK?: string | null;
  STAFFIDS?: string | null;
  STAFFMAP?: Record<string, string> | null;
  MEDIAID?: number | null;
  CANCEL?: string | null;
  CANCELBY?: string | null;
  CANCELDATE?: string | null;
  CANCELUPTIME?: string | null;
  CREATEDAT?: string | null;
  UPDATEDAT?: string | null;
  STATUS?: string | null;
  USERID?: string | null;
  ACTIVE?: string | null;
  media?: CallsBookingMediaItem[];
}

export interface CallsBookingMediaItem {
  mediaId: number;
  mediaUrl: string;
  mediaType: string;
  displayOrder: number;
  active: boolean;
}

export interface UpdateStatusPayload {
  id: string;
  status: string;
  remark?: string;
}

export type CallsBookingRecord_Table =
  CallsBookingRecord &
  Record<string, unknown>;
