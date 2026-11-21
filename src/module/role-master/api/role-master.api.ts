import { axiosInstance } from '@/lib/api/axios-instance';
import { Role, RolePayload, ApiResponse } from '@/src/module/role-master/type/role-master.types';

// ✅ GET ALL
export const fetchRoles = async () => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<Role[]>>(`/rolemaster`);
    return data.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// ✅ CREATE
export const createRole = async (payload: RolePayload) => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<Role>>(`/rolemaster`, payload);
    return data.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

// ✅ UPDATE
export const updateRole = async (id: number, payload: RolePayload) => {
  try {
    const { data } = await axiosInstance.put<ApiResponse<Role>>(
      `/rolemaster/${id}`,
      payload,
    );
    return data.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

// ✅ DELETE
export const deleteRole = async (id: number) => {
  try {
    const { data } = await axiosInstance.delete<ApiResponse<any>>(`/rolemaster/${id}`);
    return data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};
