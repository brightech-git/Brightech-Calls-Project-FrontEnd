'use client';
import { useSyncExternalStore } from 'react';
import { readSession } from '@/lib/auth/session';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('calls-session-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('calls-session-change', callback);
  };
}
function snapshot() {
  return JSON.stringify(readSession() ?? {});
}
export function useSession() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '{}');
  return JSON.parse(raw) as {
    loggedIn?: boolean;
    userId?: string;
    username?: string;
    isClient?: string;
    clientId?: string;
    menuIds?: string | null;
  };
}
