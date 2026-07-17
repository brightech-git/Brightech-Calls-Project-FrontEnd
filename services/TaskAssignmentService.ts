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

  // if (mediaMeta && mediaMeta.length) {
  //   formData.append(
  //     "mediaMeta",
  //     JSON.stringify(mediaMeta)
  //   );
  // }

  for(const [key,value] of formData.entries()){
    console.log(key, value);
  }

  const response =
    await axiosInstance.post<CallsBookingRecord>(
      "/callsbooking",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

  return response.data;
};

// GET ALL (paginated)
export const getAllCallsBookings = async (
  params?: PageParams
): Promise<PagedResponse<CallsBookingListItem>> => {
  const response =
    await axiosInstance.get<
      PagedResponse<CallsBookingListItem>
      >("/callsbooking", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 100,
      },
    });
    console.log(response , 'callsgetting')
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
  console.log(response, 'callsgetting')

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