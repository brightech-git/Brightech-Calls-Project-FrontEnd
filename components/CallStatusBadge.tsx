import { ui } from "@/utils/ui";
import { describeCallStatus } from '@/utils/callStatus';
export default function CallStatusBadge({
  value
}: {
  value: unknown;
}) {
  const status = describeCallStatus(value);
  return <span className={ui(`task-status ${status.tone}`)}><span />{status.label}</span>;
}
