import { axiosInstance } from "@/api/axiosInstance";
import { StaffPayload, StaffRecord } from "@/types/StaffMaster/StaffMaster";

export const createStaff = async (payload: StaffPayload): Promise<StaffRecord> => {
  const response = await axiosInstance.post("/staff", payload);
  return response.data;
};

export const getAllStaff = async (): Promise<StaffRecord[]> => {
  const response = await axiosInstance.get("/staff");
  return response.data;
};

export const updateStaff = async (id: number, payload: StaffPayload): Promise<StaffRecord> => {
  const response = await axiosInstance.put(`/staff/${id}`, payload);
  return response.data;
};

export const deleteStaff = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/staff/${id}`);
};
