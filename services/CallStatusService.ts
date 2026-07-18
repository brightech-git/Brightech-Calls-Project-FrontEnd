// ─────────────────────────────────────────────
// services/CallStatusService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/ApiResponse";

import {
  CallStatusPayload,
  CallStatusRecord,
  CallStatusListItem,
  CallStatusTicketDetail,
} from "@/types/CallStatus/CallStatus";

// CREATE — supports multiple media files (image/video) per status entry
export const createCallStatus = async (
  payload: CallStatusPayload,
  media?: File[]
): Promise<ApiResponse<CallStatusRecord>> => {

  const formData = new FormData();

  formData.append(
    "data",
    JSON.stringify(payload)
  );

  (media ?? []).forEach((file) => {
    formData.append("media", file);
  });

  const response = await axiosInstance.post<ApiResponse<CallStatusRecord>>(
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

// ACTIVE BOOKINGS + LAST STATUS — for the Call Status list page
export const getActiveBookingsWithLastStatus = async (): Promise<
  ApiResponse<CallStatusListItem[]>
> => {

  const response = await axiosInstance.get<ApiResponse<CallStatusListItem[]>>(
    "/callstatus/active-bookings"
  );

  return response.data;
};

// GET CALL STATUS + BOOKING SUMMARY FOR ONE TICKET (used by the Call
// Status detail page, and by the Task Assignment preview's history section)
export const getCallStatusHistory = async (
  tktId: number
): Promise<ApiResponse<CallStatusTicketDetail>> => {

  const response = await axiosInstance.get<
    ApiResponse<CallStatusTicketDetail>
  >(`/callstatus/ticket/${tktId}`);

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
