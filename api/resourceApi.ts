import { callApi } from './apiClient';
export function createResourceApi<TRecord, TCreate = TRecord, TUpdate = Partial<TCreate>>(
  resource: string,
) {
  const base = `/${resource.replace(/^\/+|\/+$/g, '')}`;
  return {
    getAll: (params?: Record<string, unknown>, signal?: AbortSignal) =>
      callApi<never, TRecord[]>({ method: 'get', url: base, params, signal }),
    getById: (id: number | string, signal?: AbortSignal) =>
      callApi<never, TRecord>({
        method: 'get',
        url: `${base}/${encodeURIComponent(id)}`,
        signal,
      }),
    create: (data: TCreate | FormData, isFormData = false) =>
      callApi<TCreate | FormData, TRecord>({
        method: 'post',
        url: base,
        data,
        isFormData,
      }),
    update: (id: number | string, data: TUpdate | FormData, isFormData = false) =>
      callApi<TUpdate | FormData, TRecord>({
        method: 'put',
        url: `${base}/${encodeURIComponent(id)}`,
        data,
        isFormData,
      }),
    patch: (id: number | string, data: Partial<TUpdate>) =>
      callApi<Partial<TUpdate>, TRecord>({
        method: 'patch',
        url: `${base}/${encodeURIComponent(id)}`,
        data,
      }),
    delete: (id: number | string) =>
      callApi<never, { success: boolean }>({
        method: 'delete',
        url: `${base}/${encodeURIComponent(id)}`,
      }),
  };
}
