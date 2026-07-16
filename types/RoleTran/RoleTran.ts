// ================= TYPES =================
  // types/RoleTran/RoleTran.ts
// Every controller under com.calls.calls.MODULE returns this envelope.
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Module {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
}

export interface SubModule {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
  moduleId: number;
}

export interface Content {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
  moduleId: number;
  subModuleId: number | null;
}

// ================= MENU TYPES =================
// Shape of the separate /menu tree endpoint — unrelated to the Module/
// SubModule/Content CRUD controllers above.

export interface MenuContent {
  id: number;
  name: string;
}

export interface MenuSubModule {
  id: number;
  name: string;
  moduleContent: MenuContent[];
}

export interface MenuModule {
  id: number;
  name: string;
  moduleContent: MenuContent[];
  subModulel: MenuSubModule[];
}

// ================= ROLE TRANSACTION TYPES =================

// Shape returned by GET endpoints — denormalized with names for display.
export interface RoleTran {
  SNO?: number;
  ROLEID: number;
  ROLENAME: string;
  MODULEID: number;
  MODULENAME: string;
  SUBMODULEID: number;
  SUBMODULENAME: string;
  CONTENTID: number;
  CONTENTNAME: string;
  ACTIVE?: boolean;
}

// Shape sent to create/save endpoints. ECOM_ROLETRAN stores id + name columns
// directly (no server-side join), so every field the entity persists must be
// sent explicitly — this is everything from RoleTran except the auto-generated SNO.
export interface RoleTranInput {
  ROLEID: number;
  ROLENAME: string;
  MODULEID: number;
  MODULENAME: string;
  SUBMODULEID: number;
  SUBMODULENAME: string;
  CONTENTID: number;
  CONTENTNAME: string;
  ACTIVE?: boolean;
}