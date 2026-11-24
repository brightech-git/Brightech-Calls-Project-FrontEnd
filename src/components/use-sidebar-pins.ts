'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSession } from '@/src/module/auth/hook/use-session';

const changeEvent = 'calls-sidebar-pins-change';
const fallback = new Map<string, string>();

function read(key: string): string {
  if (fallback.has(key)) return fallback.get(key)!;
  try {
    return localStorage.getItem(key) ?? '[]';
  } catch {
    return fallback.get(key) ?? '[]';
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
      : [];
  } catch {
    return [];
  }
}

function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(changeEvent, notify);
  };
}

export function useSidebarPins() {
  const { userId } = useSession();
  const key = `calls-sidebar-pins:${userId || 'guest'}`;
  const snapshot = useCallback(() => read(key), [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const pinnedIds = useMemo(() => parse(raw), [raw]);
  const togglePin = useCallback(
    (id: string) => {
      const current = parse(read(key));
      const next = JSON.stringify(
        current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
      );
      try {
        localStorage.setItem(key, next);
        fallback.delete(key);
      } catch {
        fallback.set(key, next);
      }
      window.dispatchEvent(new Event(changeEvent));
    },
    [key],
  );
  return { pinnedIds, togglePin };
}
