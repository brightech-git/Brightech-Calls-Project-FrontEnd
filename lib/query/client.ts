import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/errors';
export const queryKeys = {
  projectLinks: ['project-link-list'] as const,
  dashboard: ['dashboard-calls'] as const,
  employees: ['dashboard-employees'] as const,
  calls: ['calls-booking-list'] as const,
};
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        gcTime: 5 * 60000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          count < 1 &&
          !(
            error instanceof ApiError &&
            error.statusCode != null &&
            error.statusCode < 500
          ),
      },
      mutations: { retry: false },
    },
  });
}
