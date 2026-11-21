import { axiosInstance } from '@/lib/api/axios-instance';
import { StaffPayload, StaffRecord } from '@/src/module/staff-master/type/staff-master.types';
import { ApiResponse } from '@/lib/api/api-response';

// CREATE
export const createStaff = async (payload: StaffPayload): Promise<StaffRecord> => {
  const response = await axiosInstance.post('/staff', payload);
  return response.data;
};

// GET ALL
export const getAllStaff = async (): Promise<StaffRecord[]> => {
  const response = await axiosInstance.get<StaffRecord[] | ApiResponse<StaffRecord[]>>(
    '/staff',
  );
  const records = Array.isArray(response.data) ? response.data : response.data.data;
  if (!Array.isArray(records)) throw new Error('The staff response could not be read.');
  return records;
};

// GET BY STAFFID
export const getStaffById = async (id: string): Promise<StaffRecord> => {
  const response = await axiosInstance.get(`/staff/${id}`);
  return response.data;
};

// UPDATE BY STAFFID
export const updateStaff = async (
  id: string,
  payload: StaffPayload,
): Promise<StaffRecord> => {
  const response = await axiosInstance.put(`/staff/${id}`, payload);
  return response.data;
};

// DELETE BY STAFFID
export const deleteStaff = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/staff/${id}`);
};
