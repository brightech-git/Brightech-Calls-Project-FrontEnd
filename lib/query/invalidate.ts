import { type QueryClient } from '@tanstack/react-query';
/** Call mutations affect bookings, ticket history, personal queues and dashboard totals. */
export function invalidateCallQueries(client: QueryClient) {
  for (const key of [
    'calls-booking-list',
    'calls-booking',
    'callstatus-active-bookings',
    'callstatus-ticket-detail',
    'callstatus-history',
    'my-tasks',
    'calls-status',
    'dashboard-calls',
  ])
    void client.invalidateQueries({ queryKey: [key] });
}
