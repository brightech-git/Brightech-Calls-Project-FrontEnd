// ─────────────────────────────────────────────
// types/ProjectLink/ProjectLink.ts
// ─────────────────────────────────────────────

export interface ProjectLinkPayload {
  clientId: number ;
  projectTypeId: number;
  url?: string | null;
  userName?: string | null;
  password?: string | null;
  status?: string | null;
  type?: string | null;
  active?: boolean;
}

export interface ProjectLinkRecord {
  linkId: number;
 clientId: number;
  CLIENTNAME?: string | null;
  projectTypeId: number;
   projectTypeName?: string | null 
  url?: string ;
  userName?: string | null;
  password?: string | null;
  status?: string | null;
  type?: string | null;
  active?: boolean;
}

export type ProjectLinkRecord_Table = ProjectLinkRecord & Record<string, unknown>;
