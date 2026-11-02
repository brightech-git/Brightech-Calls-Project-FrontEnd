// ─────────────────────────────────────────────
// services/CallsBookingService.ts
// ─────────────────────────────────────────────

import { axiosInstance } from '@/api/axiosInstance';

import {
  CallsBookingListItem,
  CallsBookingListParams,
  CallsBookingMediaMeta,
  CallsBookingPayload,
  CallsBookingRecord,
} from '@/types/TaskAssignment/TaskAssignment';
import { PagedResponse, PageParams } from '@/types/common/Pagination';
import { ApiResponse } from '@/types/ApiResponse';

// CREATE
export const createCallsBooking = async (
  payload: CallsBookingPayload,
  media?: File[] | null,
  mediaMeta?: CallsBookingMediaMeta[] | null,
): Promise<CallsBookingRecord> => {
  const formData = new FormData();

  formData.append('booking', JSON.stringify(payload));

  (media ?? []).forEach((file) => formData.append('media', file));

  if (mediaMeta && mediaMeta.length) {
    formData.append('mediaMeta', JSON.stringify(mediaMeta));
  }

  const response = await axiosInstance.post<ApiResponse<CallsBookingRecord>>(
    '/callsbooking',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
};

// GET ALL (paginated)
// NOTE: same ApiResponse<T> envelope as everywhere else - the actual page
// is at response.data.data, not response.data. Unwrapped here so callers
// can use the real PagedResponse shape (pagedBookings.content) directly.
export const getAllCallsBookings = async (
  params?: CallsBookingListParams,
  signal?: AbortSignal,
): Promise<PagedResponse<CallsBookingListItem>> => {
  const {
    page = 0,
    size = 100,
    fromDate,
    toDate,
    asOn = false,
    asOnDate,
    clientId,
    userId,
    status,
    projectId,
    moduleId,
  } = params ?? {};

  const userIdfromLocalStorage = localStorage.getItem('userId') ?? '';
  const clientIdfromLocalStorage = localStorage.getItem('clientId') ?? '';

  const queryParams = {
    page,
    size,

    // Range filtering
    ...(!asOn && fromDate ? { fromDate } : {}),
    ...(!asOn && toDate ? { toDate } : {}),

    // As-on filtering
    ...(asOn && asOnDate ? { toDate: asOnDate } : {}),

    // Other filters
    ...(clientId ? { clientId } : {}),

    // ...(Number(userIdfromLocalStorage) != 2 && userId ? {userIds : userId} : {userIds : userIdfromLocalStorage} ),
    ...(userId ? { userIds: userId } : {}),
    ...(status ? { status } : {}),
    ...(projectId ? { projectId } : {}),
    ...(moduleId ? { moduleId } : {}),
  };

  const response = await axiosInstance.get<
    ApiResponse<PagedResponse<CallsBookingListItem>>
  >('/callsbooking', {
    params: { ...queryParams, size: Math.min(200, Math.max(1, size)) },
    signal,
  });

  return response.data.data;
};

export const getCallsBookingById = async (id: string): Promise<CallsBookingRecord> => {
  const response = await axiosInstance.get<ApiResponse<CallsBookingRecord>>(
    `/callsbooking/${id}`,
  );

  return response.data.data;
};

// GET MY TASKS
export const getMyTasks = async (userId: string): Promise<CallsBookingRecord[]> => {
  const response = await axiosInstance.get<ApiResponse<CallsBookingRecord[]>>(
    `/callsbooking/mytasks/${userId}`,
  );

  return response.data.data;
};

// GET BY STATUS
export const getCallsByStatus = async (status: string): Promise<CallsBookingRecord[]> => {
  const response = await axiosInstance.get<ApiResponse<CallsBookingRecord[]>>(
    `/callsbooking/status/${status}`,
  );

  return response.data.data;
};

// UPDATE (booking fields + media: new uploads and/or edits to existing rows)
export const updateCallsBooking = async (
  id: string,
  payload: CallsBookingPayload,
  media?: File[] | null,
  mediaMeta?: CallsBookingMediaMeta[] | null,
): Promise<CallsBookingRecord> => {
  const formData = new FormData();

  formData.append('booking', JSON.stringify(payload));

  (media ?? []).forEach((file) => formData.append('media', file));

  if (mediaMeta && mediaMeta.length) {
    formData.append('mediaMeta', JSON.stringify(mediaMeta));
  }

  const response = await axiosInstance.put<ApiResponse<CallsBookingRecord>>(
    `/callsbooking/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
};

// UPDATE STATUS
export const updateCallsBookingStatus = async (
  id: string,
  status: string,
  remark?: string,
): Promise<CallsBookingRecord> => {
  const response = await axiosInstance.put<ApiResponse<CallsBookingRecord>>(
    `/callsbooking/status/${id}`,
    null,
    {
      params: {
        status,
        remark,
      },
    },
  );

  return response.data.data;
};

// DELETE
export const deleteCallsBooking = async (id: string): Promise<any> => {
  const response = await axiosInstance.delete(`/callsbooking/${id}`);

  return response.data;
};
/** The current table filters/exports locally, so collect every server page. */
export async function getCallsBookingsForTable(
  params?: CallsBookingListParams,
  signal?: AbortSignal,
): Promise<PagedResponse<CallsBookingListItem>> {
  const first = await getAllCallsBookings(
    { ...params, asOn: params?.asOn ?? false, page: 0, size: 200 },
    signal,
  );
  const content = [...first.content];
  for (let page = 1; page < first.totalPages; page++) {
    const next = await getAllCallsBookings(
      { ...params, asOn: params?.asOn ?? false, page, size: 200 },
      signal,
    );
    content.push(...next.content);
  }
  return {
    ...first,
    content,
    first: true,
    last: true,
    number: 0,
    size: content.length,
    numberOfElements: content.length,
    empty: content.length === 0,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
  };
}
