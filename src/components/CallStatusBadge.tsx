import { cn } from '@/lib/utils';
import { callStatusStyle, describeCallStatus } from '@/src/utils/callStatus';

/** Pending (red), In processing (yellow), Completed (green): same on every page. */
export default function CallStatusBadge({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const status = describeCallStatus(value);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        callStatusStyle(value).badge,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', callStatusStyle(value).solid)}
      />
      {status.label}
    </span>
  );
}
