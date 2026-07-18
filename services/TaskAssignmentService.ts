// ─────────────────────────────────────────────
// services/CallsBookingService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from "@/api/axiosInstance";

import {
  CallsBookingListItem,
  CallsBookingMediaMeta,
  CallsBookingPayload,
  CallsBookingRecord,
} from "@/types/TaskAssignment/TaskAssignment";
import { PagedResponse, PageParams } from "@/types/common/Pagination";
import { ApiResponse } from "@/types/ApiResponse";

// CREATE
export const createCallsBooking = async (
  payload: CallsBookingPayload,
  media?: File[] | null,
  mediaMeta?: CallsBookingMediaMeta[] | null
): Promise<CallsBookingRecord> => {
  const formData = new FormData();

  formData.append(
    "booking",
    JSON.stringify(payload)
  );

  (media ?? []).forEach((file) =>
    formData.append("media", file)
  );

  if (mediaMeta && mediaMeta.length) {
    formData.append(
      "mediaMeta",
      JSON.stringify(mediaMeta)
    );
  }

  const response =
    await axiosInstance.post<ApiResponse<CallsBookingRecord>>(
      "/callsbooking",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

  return response.data.data;
};

// GET ALL (paginated)
// NOTE: same ApiResponse<T> envelope as everywhere else - the actual page
// is at response.data.data, not response.data. Unwrapped here so callers
// can use the real PagedResponse shape (pagedBookings.content) directly.
export const getAllCallsBookings = async (
  params?: PageParams
): Promise<PagedResponse<CallsBookingListItem>> => {
  const response =
    await axiosInstance.get<
      ApiResponse<PagedResponse<CallsBookingListItem>>
      >("/callsbooking", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 100,
      },
    });
  return response.data.data;
};

// GET BY ID
// NOTE: the backend wraps every response in ApiResponse<T> ({success,
// message, data}) - the actual booking is at response.data.data, not
// response.data. Unwrapping here (rather than in every caller) is what
// was missing before, which is why View Details/Edit showed no values.
export const getCallsBookingById = async (
  id: string
): Promise<CallsBookingRecord> => {
  const response =
    await axiosInstance.get<ApiResponse<CallsBookingRecord>>(
      `/callsbooking/${id}`
    );

  return response.data.data;
};

// GET MY TASKS
export const getMyTasks = async (
  userId: string
): Promise<CallsBookingRecord[]> => {
  const response =
    await axiosInstance.get<ApiResponse<CallsBookingRecord[]>>(
      `/callsbooking/mytasks/${userId}`
    );

  return response.data.data;
};

// GET BY STATUS
export const getCallsByStatus = async (
  status: string
): Promise<CallsBookingRecord[]> => {
  const response =
    await axiosInstance.get<ApiResponse<CallsBookingRecord[]>>(
      `/callsbooking/status/${status}`
    );

  return response.data.data;
};

// UPDATE (booking fields + media: new uploads and/or edits to existing rows)
export const updateCallsBooking = async (
  id: string,
  payload: CallsBookingPayload,
  media?: File[] | null,
  mediaMeta?: CallsBookingMediaMeta[] | null
): Promise<CallsBookingRecord> => {
  const formData = new FormData();

  formData.append(
    "booking",
    JSON.stringify(payload)
  );

  (media ?? []).forEach((file) =>
    formData.append("media", file)
  );

  if (mediaMeta && mediaMeta.length) {
    formData.append(
      "mediaMeta",
      JSON.stringify(mediaMeta)
    );
  }

  const response =
    await axiosInstance.put<ApiResponse<CallsBookingRecord>>(
      `/callsbooking/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

  return response.data.data;
};

// UPDATE STATUS
export const updateCallsBookingStatus =
  async (
    id: string,
    status: string,
    remark?: string
  ): Promise<CallsBookingRecord> => {

    const response =
      await axiosInstance.put<ApiResponse<CallsBookingRecord>>(
        `/callsbooking/status/${id}`,
        null,
        {
          params: {
            status,
            remark,
          },
        }
      );

    return response.data.data;
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