"use client";

import { ui } from "@/utils/ui";
import { useSyncExternalStore, useCallback } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
export default function QueryErrorNotice() {
  const client = useQueryClient();
  const fetching = useIsFetching();
  const subscribe = useCallback((callback: () => void) => client.getQueryCache().subscribe(callback), [client]);
  const snapshot = useCallback(() => client.getQueryCache().getAll().filter(query => query.getObserversCount() > 0 && query.state.status === 'error').map(query => query.queryHash).sort().join('|'), [client]);
  const errors = useSyncExternalStore(subscribe, snapshot, () => '');
  if (!errors) return null;
  return <div className={ui("query-error-notice")} role="alert"><AlertCircle size={20} /><div><strong>Some information couldn’t be loaded</strong><p>Check your connection and try again. Your current input is kept.</p></div><button className={ui("ui-button")} disabled={fetching > 0} onClick={() => client.refetchQueries({
      predicate: query => query.getObserversCount() > 0 && query.state.status === 'error'
    })}><RefreshCw size={14} />Retry</button></div>;
}
