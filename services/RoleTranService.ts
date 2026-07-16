// ================= SERVICE =================
// service/RoleTranService.ts

import { axiosInstance } from "@/api/axiosInstance";

import {
  ApiResponse,
  Module,
  SubModule,
  Content,
  MenuModule,
  RoleTran,
  RoleTranInput,
} from "@/types/RoleTran/RoleTran";

// =====================================================
// MODULE
// =====================================================

// CREATE MODULE
export const createModule = async (body: {
  name: string;
  displayOrder: number;
}) => {
  const { data } = await axiosInstance.post<ApiResponse<Module>>(
    `/module`,
    body
  );

  return data.data;
};

// GET MODULES
export const getModules = async () => {
  const { data } = await axiosInstance.get<ApiResponse<Module[]>>(
    `/module`
  );

  return data.data;
};

// GET MENU (full tree) — wrapped in the same ApiResponse envelope as the rest
// of the module endpoints; useMenu()'s `select` unwraps `.data`.
export const getMenu = async () => {
  const { data } = await axiosInstance.get<ApiResponse<MenuModule[]>>(
    `/module/list`
  );

  return data;
};

// UPDATE MODULE
export const updateModule = async ({
  id,
  body,
}: {
  id: number;
  body: {
    name: string;
    displayOrder: number;
    active: boolean;
  };
}) => {
  const { data } = await axiosInstance.put<ApiResponse<Module>>(
    `/module/${id}`,
    body
  );

  return data.data;
};

// DELETE MODULE
export const deleteModule = async (id: number) => {
  const { data } = await axiosInstance.delete<string>(
    `/module/${id}`
  );

  return data;
};

// =====================================================
// SUB MODULE
// =====================================================

// CREATE SUB MODULE
export const createSubModule = async (
  moduleId: number,
  body: {
    name: string;
    displayOrder: number;
  }
) => {
  const { data } = await axiosInstance.post<ApiResponse<SubModule>>(
    `/submodule/${moduleId}`,
    body
  );

  return data.data;
};

// GET SUB MODULES (by module)
export const getSubModules = async (
  moduleId: number
) => {
  const { data } = await axiosInstance.get<ApiResponse<SubModule[]>>(
    `/submodule/${moduleId}`
  );

  return data.data;
};

// UPDATE SUB MODULE — SubModuleController#update returns the SubModule directly, not wrapped
export const updateSubModule = async ({
  id,
  body,
}: {
  id: number;
  body: {
    name: string;
    displayOrder: number;
    active: boolean;
  };
}) => {
  const { data } = await axiosInstance.put<SubModule>(
    `/submodule/${id}`,
    body
  );

  return data;
};

// DELETE SUB MODULE
export const deleteSubModule = async (id: number) => {
  const { data } = await axiosInstance.delete<string>(
    `/submodule/${id}`
  );

  return data;
};

// =====================================================
// CONTENT
// =====================================================
// ModuleContentController exposes two parallel paths depending on whether
// the content sits directly under a module or under one of its submodules.

// CREATE CONTENT under a module (no submodule)
export const createContentUnderModule = async (
  moduleId: number,
  body: { name: string; displayOrder: number }
) => {
  const { data } = await axiosInstance.post<ApiResponse<Content>>(
    `/content/module/${moduleId}`,
    body
  );

  return data.data;
};

// CREATE CONTENT under a submodule
export const createContentUnderSubModule = async (
  subModuleId: number,
  body: { name: string; displayOrder: number }
) => {
  const { data } = await axiosInstance.post<ApiResponse<Content>>(
    `/content/submodule/${subModuleId}`,
    body
  );

  return data.data;
};

// GET CONTENTS under a module (no submodule)
export const getContentsByModule = async (moduleId: number) => {
  const { data } = await axiosInstance.get<ApiResponse<Content[]>>(
    `/content/module/${moduleId}`
  );

  return data.data;
};

// GET CONTENTS under a submodule
export const getContentsBySubModule = async (subModuleId: number) => {
  const { data } = await axiosInstance.get<ApiResponse<Content[]>>(
    `/content/submodule/${subModuleId}`
  );

  return data.data;
};

// UPDATE CONTENT
export const updateContent = async ({
  id,
  body,
}: {
  id: number;
  body: {
    name: string;
    displayOrder: number;
    active: boolean;
  };
}) => {
  const { data } = await axiosInstance.put<ApiResponse<Content>>(
    `/content/${id}`,
    body
  );

  return data.data;
};

// DELETE CONTENT
export const deleteContent = async (id: number) => {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(
    `/content/${id}`
  );

  return data;
};

// =====================================================
// ROLE TRANSACTION
// =====================================================

// GET ROLE TRANSACTIONS
export const getRoleTransactions = async () => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/roletran`
  );

  return data;
};

// INSERT ROLE TRANSACTION — ids only, no name fields sent
export const insertRoleTransaction = async (body: RoleTranInput[]) => {
  const { data } = await axiosInstance.post<RoleTran[]>(
    `/roletran/insert`,
    body
  );

  return data;
};

// SAVE SINGLE ROLE TRANSACTION — ids only, no name fields sent
export const saveRoleTransaction = async (body: RoleTranInput) => {
  const { data } = await axiosInstance.post<RoleTran>(
    `/roletran`,
    body
  );

  return data;
};

// GET ROLE TRANSACTIONS BY ROLE ID
export const getRoleTransactionsByRoleId = async (roleId: number) => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/roletran/role/${roleId}`
  );

  return data;
};

// GET ACTIVE ROLE TRANSACTIONS
export const getActiveRoleTransactions = async () => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/roletran/active`
  );

  return data;
};

// GET ACTIVE ROLE TRANSACTIONS BY ROLE ID
export const getActiveRoleTransactionsByRoleId = async (roleId: number) => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/roletran/role/${roleId}/active`
  );

  return data;
};

// DELETE ROLE TRANSACTION
export const deleteRoleTransaction = async (sno: number) => {
  const { data } = await axiosInstance.delete<string>(
    `/roletran/${sno}`
  );

  return data;
};

// TOGGLE ACTIVE STATUS
export const toggleRoleTransactionActive = async (sno: number) => {
  const { data } = await axiosInstance.put<RoleTran>(
    `/roletran/${sno}/toggle`
  );

  return data;
};