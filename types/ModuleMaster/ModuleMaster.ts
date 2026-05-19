// ─────────────────────────────────────────────
// types/ModuleMaster/ModuleMaster.ts
// ─────────────────────────────────────────────

export interface ModulePayload {
  PROJECTID: number;
  MODULENAME: string;
  ACTIVE?: string | null;
}

export interface ModuleRecord {
  sno: number;
  projectId: number;
  projectName?: string | null;
  moduleId: number;
  moduleName: string;
  active?: string | null;
  updated?: string | null;
  uptime?: string | null;
}

export type ModuleRecord_Table = ModuleRecord & Record<string, unknown>;