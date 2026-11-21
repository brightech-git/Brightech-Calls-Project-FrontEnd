'use client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
/** Explicit keys keep API response contracts in services instead of guessing envelopes. */
export function useApiList<T>(
  key: QueryKey,
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => load(signal), enabled });
}
export function useApiMutation<TData, TVariables>(
  mutate: (variables: TVariables) => Promise<TData>,
  invalidate: QueryKey[],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mutate,
    onSuccess: () => {
      for (const queryKey of invalidate) void client.invalidateQueries({ queryKey });
    },
  });
}
