// ─────────────────────────────────────────────
// types/ProjectMaster/ProjectMaster.ts
// ─────────────────────────────────────────────

export interface ProjectPayload {
  CLIENTID?: number;
  CLIENTUSERID?: number;
  PROJECTNAME: string;
  ASSIGNEDTO?: string;       // comma-separated userIds e.g. "1,3,5"
  STATUS?: string;
  ACTIVE?: string | null;
}

export interface ProjectRecord {
  sno: number;
  projectId: number;
  projectName: string;
  clientId?: number;
  clientName?: string | null;
  clientUserId?: number;
  clientUserName?: string | null;
  assignedTo?: string | null;
  assignedToMap?: Record<string, string> | null;
  status?: string | null;
  active?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ProjectRecord_Table = ProjectRecord & Record<string, unknown>;
