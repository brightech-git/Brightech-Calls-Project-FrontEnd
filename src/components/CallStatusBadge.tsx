import { cn } from '@/lib/utils';
import { statusTones } from '@/lib/styles';
import { describeCallStatus } from '@/src/utils/callStatus';
export default function CallStatusBadge({ value }: { value: unknown }) {
  const status = describeCallStatus(value);
  return (
    <span className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold',
        statusTones[status.tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  );
}
