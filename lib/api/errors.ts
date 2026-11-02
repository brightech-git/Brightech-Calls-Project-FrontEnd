import axios from 'axios';

export class ApiError extends Error {
  readonly status = 'error';
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errors?: unknown,
    public readonly response?: {
      status: number;
      data: { message?: string; errors?: unknown };
    },
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    const message =
      typeof body?.message === 'string'
        ? body.message
        : error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : !error.response
            ? 'Unable to connect. Check your connection and try again.'
            : error.response.status === 403
              ? 'You do not have access to this action.'
              : 'The request could not be completed.';
    return new ApiError(
      message,
      error.response?.status,
      body?.errors ?? (body?.code === 'VALIDATION_FAILED' ? body.data : undefined),
      error.response,
      body?.code ?? error.code,
    );
  }
  return new ApiError(
    error instanceof Error ? error.message : 'Something went wrong. Please try again.',
  );
}
export const getApiErrorMessage = (error: unknown) => normalizeApiError(error).message;
export function unwrapResponse<T>(body: {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}): T {
  if (!body.success)
    throw new ApiError(
      body.message || 'The request could not be completed.',
      undefined,
      body.code === 'VALIDATION_FAILED' ? body.data : undefined,
      undefined,
      body.code,
    );
  return body.data;
}
