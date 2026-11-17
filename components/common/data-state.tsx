'use client';
import { cn } from '@/lib/utils';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './button';
import { getApiErrorMessage } from '@/lib/api/errors';
export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-2 p-4 text-center text-[13px] text-muted [&_strong]:font-semibold [&_strong]:text-ink"
      role="status"
    >
      <LoaderCircle
        className="animate-spin motion-reduce:animate-none"
        aria-hidden="true"
        size={22}
      />
      <span>{label}</span>
    </div>
  );
}
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className="grid gap-2 p-3"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="h-6 animate-pulse rounded-md bg-gray-100"
          key={index}
        />
      ))}
    </div>
  );
}
export function EmptyState({
  title = 'No records found',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-4 text-center text-[13px] text-muted [&_strong]:font-semibold [&_strong]:text-ink">
      <Inbox
        size={28}
        aria-hidden="true"
      />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function ErrorState({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-2 p-4 text-center text-[13px] text-muted [&_strong]:font-semibold [&_strong]:text-ink"
      role="alert"
    >
      <AlertCircle
        size={24}
        aria-hidden="true"
      />
      <strong>Unable to load data</strong>
      <p>{getApiErrorMessage(error)}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          loading={retrying}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
const NOTIFICATION_TONES = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
} as const;
export function Notification({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn('rounded-md border px-3 py-2 text-[13px]', NOTIFICATION_TONES[tone])}
      data-tone={tone}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
