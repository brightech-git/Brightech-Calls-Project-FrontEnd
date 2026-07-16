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
  /** Comma-separated Staff Master STAFFIDs, e.g. "1,2,3" */
  STAFFIDS: string;
  STATUS?: string | null;
  ACTIVE?: string | null;
}

export interface CallsBookingMediaRecord {
  id?: number;
  mediaUrl?: string | null;
  mediaType?: string | null;
  order?: number | null;
  active?: boolean | null;
}

export interface CallsBookingMediaMeta {
  mediaId?: number | null;
  displayOrder: number;
  active: boolean;
}

export interface CallsBookingRecord extends CallsBookingPayload {
  SNO: number;
  TKTID?: number | null;
  TKTDATE?: string | null;
  COMPANYNAME?: string | null;
  CLIENTNAME?: string | null;
  STAFFNAME?: string | null;
  /** Creator's login user id — set server-side from the auth token, not client-editable */
  USERID?: string | null;
  CANCEL?: string | null;
  CANCELBY?: string | null;
  CANCELDATE?: string | null;
  CANCELUPTIME?: string | null;
  UPDATED?: string | null;
  UPTIME?: string | null;
  media?: CallsBookingMediaRecord[] | null;
}

export interface UpdateStatusPayload {
  id: string;
  status: string;
  remark?: string;
}

export type CallsBookingRecord_Table =
  CallsBookingRecord &
  Record<string, unknown>;

// Thin shape returned by the paginated list endpoint (GET /callsbooking).
// Use getCallsBookingById(SNO) to load the full CallsBookingRecord for
// edit / detail views.
export interface CallsBookingListItem {
  SNO: number;
  TKTID?: number | null;
  TKTDATE?: string | null;
  COMPANYNAME?: string | null;
  CLIENTNAME?: string | null;
  PROJECTNAME?: string | null;
  MODULENAME?: string | null;
  STAFFNAME?: string | null;
  STATUS?: string | null;
  ACTIVE?: string | null;
}

export type CallsBookingListItem_Table =
  CallsBookingListItem &
  Record<string, unknown>;