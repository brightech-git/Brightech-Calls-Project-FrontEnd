// ─────────────────────────────────────────────
// types/ProjectLink/ProjectLink.ts
// ─────────────────────────────────────────────

export interface ProjectLinkPayload {
  client: { CLIENTID: number };
  projectType: { projectTypeId: number };
  url?: string | null;
  userName?: string | null;
  password?: string | null;
  status?: string | null;
  type?: string | null;
  active?: boolean;
}

export interface ProjectLinkRecord {
  linkId: number;
  client: { CLIENTID: number; CLIENTNAME?: string | null } | null;
  projectType: { projectTypeId: number; projectTypeName?: string | null } | null;
  url?: string ;
  userName?: string | null;
  password?: string | null;
  status?: string | null;
  type?: string | null;
  active?: boolean;
}

export type ProjectLinkRecord_Table = ProjectLinkRecord & Record<string, unknown>;
