// ─────────────────────────────────────────────
// types/TaskAssignment/TaskAssignment.ts
// ─────────────────────────────────────────────
// Field names below are lowerCamelCase to match the backend's
// CallsBooking JSON payloads exactly (Jackson serializes Java field
// names as-is, and the backend now uses lowerCamelCase throughout).

export interface CallsBookingPayload {
  compId: number;
  clientId: number;
  projectId?: string | null;
  projectName?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  description?: string | null;
  remark?: string | null;
  /** Comma-separated UserMaster USERIDs, e.g. "1,2,3" */
  assignedUsers: string;
  status?: string | null;
  active?: string | null;
}

export interface CallsBookingMediaRecord {
  /** This row's own unique id (Media.sno) - use this to target one
   *  specific file (toggle/reorder it). */
  id?: number | null;
  /** Shared group id (MEDIAID) - the SAME value across every file
   *  uploaded for one booking, not a unique per-file id. */
  mediaId?: number | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
}

export interface CallsBookingMediaMeta {
  /** Set to an existing row's id (Media.sno) to edit that row's
   *  active/displayOrder in place. Leave null for a newly uploaded file -
   *  null entries are matched positionally, in order, to the files list. */
  id?: number | null;
  displayOrder: number;
  active: boolean;
}

export interface CallsBookingRecord extends CallsBookingPayload {
  sno: number;
  tktId?: number | null;
  tktDate?: string | null;
  companyName?: string | null;
  clientName?: string | null;
  /** userId -> username, resolved from assignedUsers */
  userMap?: Record<string, string> | null;
  /** Creator's login user id — set server-side from the auth token, not client-editable */
  userId?: string | null;
  cancel?: string | null;
  cancelBy?: string | null;
  cancelDate?: string | null;
  cancelUptime?: string | null;
  updated?: string | null;
  uptime?: string | null;
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
// Use getCallsBookingById(sno) to load the full CallsBookingRecord for
// edit / detail views.
export interface CallsBookingListItem {
  sno: number;
  tktId?: number | null;
  tktDate?: string | null;
  companyName?: string | null;
  clientName?: string | null;
  projectName?: string | null;
  moduleName?: string | null;
  /** Comma-joined usernames resolved server-side from assignedUsers */
  assignedUsers?: string | null;
  status?: string | null;
  active?: string | null;
  remark?:string;
  statusRemark?:string;
}

export type CallsBookingListItem_Table =
  CallsBookingListItem &
  Record<string, unknown>;
