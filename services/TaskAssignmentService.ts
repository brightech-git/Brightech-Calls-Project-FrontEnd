// ─────────────────────────────────────────────
// services/CallsBookingService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  CallsBookingPayload,
  CallsBookingRecord,
} from "@/types/TaskAssignment/TaskAssignment";

// CREATE
export const createCallsBooking = async (
  payload: CallsBookingPayload
): Promise<CallsBookingRecord> => {
  const response =
    await axiosInstance.post<CallsBookingRecord>(
      "/callsbooking",
      payload
    );

  return response.data;
};

// GET ALL
export const getAllCallsBookings = async (): Promise<
  CallsBookingRecord[]
> => {
  const response =
    await axiosInstance.get<CallsBookingRecord[]>(
      "/callsbooking"
    );

  return response.data;
};

// GET BY ID
export const getCallsBookingById = async (
  id: string
): Promise<CallsBookingRecord> => {
  const response =
    await axiosInstance.get<CallsBookingRecord>(
      `/callsbooking/${id}`
    );

  return response.data;
};

// GET MY TASKS
export const getMyTasks = async (
  staffId: string
): Promise<CallsBookingRecord[]> => {
  const response =
    await axiosInstance.get<CallsBookingRecord[]>(
      `/callsbooking/mytasks/${staffId}`
    );

  return response.data;
};

// GET BY STATUS
export const getCallsByStatus = async (
  status: string
): Promise<CallsBookingRecord[]> => {
  const response =
    await axiosInstance.get<CallsBookingRecord[]>(
      `/callsbooking/status/${status}`
    );

  return response.data;
};

// UPDATE
export const updateCallsBooking = async (
  id: string,
  payload: CallsBookingPayload
): Promise<CallsBookingRecord> => {
  const response =
    await axiosInstance.put<CallsBookingRecord>(
      `/callsbooking/${id}`,
      payload
    );

  return response.data;
};

// UPDATE STATUS
export const updateCallsBookingStatus =
  async (
    id: string,
    status: string,
    remark?: string
  ): Promise<CallsBookingRecord> => {

    const response =
      await axiosInstance.put<CallsBookingRecord>(
        `/callsbooking/status/${id}`,
        null,
        {
          params: {
            status,
            remark,
          },
        }
      );

    return response.data;
  };

// DELETE
export const deleteCallsBooking = async (
  id: string
): Promise<any> => {
  const response =
    await axiosInstance.delete(
      `/callsbooking/${id}`
    );

  return response.data;
};