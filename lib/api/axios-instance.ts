import axios from 'axios';
import { apiConfig } from '@/lib/api/config';
import { clearSession, readSession } from '@/lib/auth/session';
import { ApiError, normalizeApiError } from '@/lib/api/errors';

export const axiosInstance = axios.create({
  ...apiConfig,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});
axiosInstance.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData)
    config.headers.delete('Content-Type');
  const authRoute = /\/(?:user\/(?:login|register)|auth)(?:[/?]|$)/.test(
    config.url ?? '',
  );
  if (!authRoute) {
    const session = readSession();
    if (session?.userId) config.headers.USERID = session.userId;
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
    // Company data is populated by the normal /company query, never fetched here.
    if (typeof window !== 'undefined') {
      try {
        const company = JSON.parse(localStorage.getItem('calls-company') ?? 'null');
        if (company?.COMPID) config.headers.COMPANYID = String(company.COMPID);
        if (company?.COSTID) config.headers.COSTID = String(company.COSTID);
      } catch {
        /* Missing optional company context does not block a request. */
      }
    }
  }
  return config;
});
axiosInstance.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      response.data.success === false
    ) {
      return Promise.reject(
        new ApiError(
          response.data.message || 'The request could not be completed.',
          response.status,
          response.data.errors ??
            (response.data.code === 'VALIDATION_FAILED' ? response.data.data : undefined),
          response,
          response.data.code,
        ),
      );
    }
    if (response.config.url === '/company' && typeof window !== 'undefined') {
      const records = Array.isArray(response.data) ? response.data : response.data?.data;
      if (Array.isArray(records) && records[0]) {
        try {
          localStorage.setItem(
            'calls-company',
            JSON.stringify({ COMPID: records[0].COMPID, COSTID: records[0].COSTID }),
          );
        } catch {
          /* Optional cache. */
        }
      }
    }
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const normalized = normalizeApiError(error);
    // An expired session clears private caches through the session-keyed provider.
    if (
      normalized.statusCode === 401 &&
      error.config?.headers?.Authorization &&
      readSession()?.token ===
        String(error.config.headers.Authorization).replace(/^Bearer /, '')
    )
      clearSession();
    return Promise.reject(normalized);
  },
);
