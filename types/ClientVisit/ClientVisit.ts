// ─────────────────────────────────────────────
// types/ClientVisit/ClientVisit.ts
// ─────────────────────────────────────────────

export interface ClientVisitPayload {
  COMPANYNAME:    string;
  COMPANYID?:    string | null;
  // COSTID?:       string | null;
  ADDRESS1?:     string | null;
  ADDRESS2?:     string | null;
  ADDRESS3?:     string | null;
  REMARKS?:      string | null;
  AREACODE?:     string | null;
  PHONE?:        string | null;
  MOBILE?:       string | null;
  EMAIL?:        string | null;
  LOCALTAXNO?:   string | null;
  CSTNO?:        string | null;
  TINNO?:        string | null;
  PANNO?:        string | null;
  TDSNO?:        string | null;
  TANNO?:        string | null;
  GSTNO?:        string | null;
  DISPLAYORDER?: number | null;
  AUTOGENERATOR?: string | null;
  SHORTKEY?:     string | null;
  ACTIVE?:       string | null;
  STATEID?:      number | null;
}

export interface ClientVisitMediaRecord {
  id?:        number;
  mediaUrl?:  string | null;
  mediaType?: "IMAGE" | "VIDEO" | string | null;
  order?:     number | null;
  active?:    boolean | null;
}

// Matches the backend's MediaRequest — optional per-file metadata sent
// alongside the "media" parts. The backend already defaults displayOrder
// to the file's position and active to true when this is omitted.
export interface ClientVisitMediaMeta {
  mediaId?:      number | null;
  displayOrder?: number;
  active?:       boolean;
}

export interface ClientVisitRecord extends ClientVisitPayload {
  ID:       number;
  USERID?:  number | null;
  UPDATED?: string | null;
  UPTIME?:  string | null;
  media?:   ClientVisitMediaRecord[] | null;
}

export type ClientVisitRecord_Table = ClientVisitRecord & Record<string, unknown>;
