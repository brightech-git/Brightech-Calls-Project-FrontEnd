import { axiosInstance } from "@/api/axiosInstance";
import { StaffPayload, StaffRecord } from "@/types/StaffMaster/StaffMaster";

// CREATE
export const createStaff = async (payload: StaffPayload): Promise<StaffRecord> => {
  const response = await axiosInstance.post("/staff", payload);
  return response.data;
};

// GET ALL
export const getAllStaff = async (): Promise<StaffRecord[]> => {
  const response = await axiosInstance.get("/staff");
  return response.data;
};

// GET BY STAFFID
export const getStaffById = async (id: string): Promise<StaffRecord> => {
  const response = await axiosInstance.get(`/staff/${id}`);
  return response.data;
};

// UPDATE BY STAFFID
export const updateStaff = async (id: string, payload: StaffPayload): Promise<StaffRecord> => {
  const response = await axiosInstance.put(`/staff/${id}`, payload);
  return response.data;
};

// DELETE BY STAFFID
export const deleteStaff = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/staff/${id}`);
};
