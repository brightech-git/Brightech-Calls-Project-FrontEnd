// ─────────────────────────────────────────────
// types/ProjectTypeMaster/ProjectTypeMaster.ts
// ─────────────────────────────────────────────

export interface ProjectTypePayload {
  projectTypeName: string;
  displayOrder?: number | null;
  active?:  boolean ;
}

export interface ProjectTypeRecord {
  projectTypeId: number;
  projectTypeName: string;
  displayOrder?: number | null;
  active?: boolean;
}

export type ProjectTypeRecord_Table = ProjectTypeRecord & Record<string, unknown>;
