// ─────────────────────────────────────────────
// types/CompanyMaster/CompanyMaster.ts
// ─────────────────────────────────────────────

export interface CompanyPayload {
  COMPANYID?:    string | null;
  COMPANYNAME:   string;
  COSTID?:       string | null;
  ADDRESS1?:     string | null;
  ADDRESS2?:     string | null;
  ADDRESS3?:     string | null;
  ADDRESS4?:     string | null;
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
  AUTOGENERATOR?:string | null;
  SHORTKEY?:     string | null;
  ACTIVE?:       string | null;
  STATEID?:      number | null;
}

export interface CompanyRecord extends CompanyPayload {
  COMPID:    number;
  USERID?:   number | null;
  UPDATED?:  string | null;
  UPTIME?:   string | null;
}

export type CompanyRecord_Table = CompanyRecord & Record<string, unknown>;
