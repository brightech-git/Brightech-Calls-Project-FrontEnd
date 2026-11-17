export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8111/api/v1',
  timeout: 30000,
} as const;
