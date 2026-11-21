'use client';

import { buttonClass } from '@/lib/styles';
import { useSyncExternalStore, useCallback } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
export default function QueryErrorNotice() {
  const client = useQueryClient();
  const fetching = useIsFetching();
  const subscribe = useCallback(
    (callback: () => void) => client.getQueryCache().subscribe(callback),
    [client],
  );
  const snapshot = useCallback(
    () =>
      client
        .getQueryCache()
        .getAll()
        .filter(
          (query) => query.getObserversCount() > 0 && query.state.status === 'error',
        )
        .map((query) => query.queryHash)
        .sort()
        .join('|'),
    [client],
  );
  const errors = useSyncExternalStore(subscribe, snapshot, () => '');
  if (!errors) return null;
  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-4 text-amber-800 [&>svg]:shrink-0 [&>div]:flex-1 [&_strong]:text-sm [&_p]:mt-1 [&_p]:text-xs"
      role="alert"
    >
      <AlertCircle size={20} />
      <div>
        <strong>Some information couldn’t be loaded</strong>
        <p>Check your connection and try again. Your current input is kept.</p>
      </div>
      <button
        className={buttonClass}
        disabled={fetching > 0}
        onClick={() =>
          client.refetchQueries({
            predicate: (query) =>
              query.getObserversCount() > 0 && query.state.status === 'error',
          })
        }
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}
