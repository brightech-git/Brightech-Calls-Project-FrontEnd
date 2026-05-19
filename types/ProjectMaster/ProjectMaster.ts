// ─────────────────────────────────────────────
// types/ProjectMaster/ProjectMaster.ts
// ─────────────────────────────────────────────

export interface ProjectPayload {
  CLIENTID: number;
  PROJECTNAME: string;
  ACTIVE?: string | null;
}

export interface ProjectRecord {
  sno: number;
  projectId: number;
  projectName: string;
  clientId: number;
  clientName?: string | null;
  active?: string | null;
  updated?: string | null;
  uptime?: string | null;
}

export type ProjectRecord_Table = ProjectRecord & Record<string, unknown>;