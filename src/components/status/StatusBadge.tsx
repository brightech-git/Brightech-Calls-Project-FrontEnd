import { Badge } from '@chakra-ui/react';

export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  const color = status === 'Completed' ? 'green' : 'orange';

  return <Badge colorScheme={color}>{status}</Badge>;
}