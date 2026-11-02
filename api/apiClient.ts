import axios from 'axios';
import { axiosInstance } from './axiosInstance';
import { normalizeApiError } from '@/lib/api/errors';
export { ApiError } from '@/lib/api/errors';
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export interface ApiOptions<T> {
  method: HttpMethod;
  url: string;
  data?: T;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  isFormData?: boolean;
  signal?: AbortSignal;
}
export async function callApi<T, R>({
  method,
  url,
  data,
  params,
  headers,
  signal,
}: ApiOptions<T>): Promise<R> {
  try {
    return (
      await axiosInstance.request<R>({ method, url, data, params, headers, signal })
    ).data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    throw normalizeApiError(error);
  }
}
