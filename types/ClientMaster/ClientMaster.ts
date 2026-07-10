export interface ClientPayload {
  COMPANYID?:    string | null;
  CLIENTNAME:    string;
  COSTID?:       string | null;
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
  USERID?:       number | null;

  // CLIENT LOGIN (SEPARATE FROM COMPANY/USERMASTER LOGIN)
  USERNAME?:     string | null;
  PWD?:          string | null;
  ROLEID?:       number | null;
}

export interface ClientRecord extends ClientPayload {
  CLIENTID:  number;
  UPDATED?:  string | null;
  UPTIME?:   string | null;
}

export type ClientRecord_Table = ClientRecord & Record<string, unknown>;
