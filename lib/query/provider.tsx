'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './client';
import { readSession, SESSION_EVENT } from '@/lib/auth/session';
export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => {
    const identity = () => {
      const session = readSession();
      return `${session?.userId ?? ''}:${session?.token ?? ''}`;
    };
    let previous = identity();
    const sync = () => {
      const current = identity();
      if (current !== previous) {
        previous = current;
        void client.cancelQueries();
        client.clear();
      }
    };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
      void client.cancelQueries();
      client.clear();
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
