// ─────────────────────────────────────────────
// types/CallStatus/CallStatus.ts
// ─────────────────────────────────────────────
// Field casing below matches the backend exactly: CALLSTATUS.tktId/remark
// are lowerCamel, but STATUS/IMAGE/UPDATED are still ALL CAPS Java field
// names (Jackson serializes them as-is because both leading letters are
// uppercase, so no bean decapitalization happens).

export interface CallStatusMedia {
  id?: number | null;
  mediaId?: number | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
}

// Payload sent when creating a new Call Status entry ("Add Status").
// tktId/STATUS are required; userId is set server-side from the auth token.
export interface CallStatusPayload {
  tktId: number;
  STATUS: string;
  remark?: string | null;
}

export interface CallStatusRecord {
  sno: number;
  tktId: number;
  userId?: number | null;
  userName?: string | null;
  remark?: string | null;
  STATUS?: string | null;
  mediaId?: number | null;
  IMAGE?: string | null;
  UPDATED?: string | null;
  media?: CallStatusMedia[] | null;
}

// One row on the Call Status list page — active bookings only, with the
// most recent CallStatus entry's status attached as "Last Status".
export interface CallStatusListItem {
  sno: number;
  tktId: number;
  clientName?: string | null;
  projectName?: string | null;
  moduleName?: string | null;
  lastStatus?: string | null;
}

export type CallStatusListItem_Table =
  CallStatusListItem & Record<string, unknown>;

// The booking summary embedded alongside the status history for one ticket.
export interface CallStatusBookingSummary {
  sno: number;
  tktId?: number | null;
  clientName?: string | null;
  projectName?: string | null;
  moduleName?: string | null;
  remark?: string | null;
  status?: string | null;
  active?: string | null;
}

export interface CallStatusTicketDetail {
  callBooking?: CallStatusBookingSummary | null;
  statuses: CallStatusRecord[];
}
