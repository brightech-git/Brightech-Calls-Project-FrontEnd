'use client';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './button';
import { getApiErrorMessage } from '@/lib/api/errors';
export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="data-state"
      role="status"
    >
      <LoaderCircle
        className="loading-spin"
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
      className="skeleton-list"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="skeleton-line"
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
    <div className="data-state">
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
      className="data-state"
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
export function Notification({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  return (
    <div
      className="notification"
      data-tone={tone}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
