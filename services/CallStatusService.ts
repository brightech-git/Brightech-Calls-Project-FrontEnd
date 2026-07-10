// ─────────────────────────────────────────────
// services/CallStatusService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  CallStatusPayload,
  CallStatusRecord,
} from "@/types/CallStatus/CallStatus";
import { CallsBookingRecord } from "@/types/TaskAssignment/TaskAssignment";

// CREATE
export const createCallStatus = async (
  payload: CallStatusPayload,
  image?: File | null
): Promise<CallStatusRecord> => {

  const formData = new FormData();

  formData.append(
    "data",
    JSON.stringify(payload)
  );

  if (image) {
    formData.append("image", image);
  }

  const response = await axiosInstance.post<CallStatusRecord>(
    "/callstatus/save",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// GET ALL
export const getAllCallStatus = async (): Promise<CallStatusRecord[]> => {

  const response = await axiosInstance.get<CallStatusRecord[]>(
    "/callstatus/list"
  );

  return response.data;
};

// GET BY TICKET ID (returns the full booking, including its media)
export const getCallStatusById = async (
  id: string
): Promise<CallsBookingRecord> => {

  const response = await axiosInstance.get<CallsBookingRecord>(
    `/callsbooking/${id}`
  );

  return response.data;
};

// DELETE
export const deleteCallStatus = async (
  id: string
): Promise<void> => {

  await axiosInstance.delete(
    `/callstatus/delete/${id}`
  );
};