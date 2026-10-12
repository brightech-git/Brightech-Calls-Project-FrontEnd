"use client";

import { ui } from "@/utils/ui";
import Link from 'next/link';
import CallStatusBadge from '@/components/CallStatusBadge';
import { describeCallStatus } from '@/utils/callStatus';
import { useMemo, useState } from 'react';
import { ChevronRightCircle, ArrowUpRight, CheckCircle2, Clock3, Headphones, RefreshCw, CircleDot } from 'lucide-react';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useMyTasks } from '@/hooks/TaskAssignment/useTaskAssignment';
import { CallsBookingRecord_Table } from '@/types/TaskAssignment/TaskAssignment';
import { useSession } from '@/hooks/Auth/useSession';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { useRouter } from 'next/navigation';
// Legacy call codes and full status names share one mapping.
const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [{
  key: 'tktId',
  header: 'Ticket',
  sortable: true,
  render: row => <span className={ui("ticket-number")}>#{row.tktId ?? row.sno}</span>
}, {
  key: 'clientName',
  header: 'Client',
  sortable: true,
  render: row => row.clientName || '—'
}, {
  key: 'projectName',
  header: 'Project',
  sortable: true
}, {
  key: 'status',
  header: 'Status',
  sortable: true,
  render: row => <CallStatusBadge value={row.status} />
}];
export default function DashboardPage() {
  usePageHeader({
    title: 'Overview',
    subtitle: 'Your calls, at a glance'
  });
  const router = useRouter();
  const {
    userId = '',
    username = ''
  } = useSession();
  const {
    isRouteAllowed
  } = useAccessibleMenu();
  const {
    data: myTasks = [],
    isLoading,
    isError,
    isFetching,
    refetch
  } = useMyTasks(userId);
  const [filter, setFilter] = useState('all');
  const active = useMemo(() => myTasks.filter(task => task.active === 'Y'), [myTasks]);
  const completed = active.filter(task => describeCallStatus(task.status).group === 'complete').length;
  const progress = active.filter(task => describeCallStatus(task.status).group === 'progress').length;
  const open = active.filter(task => describeCallStatus(task.status).group === 'open').length;
  const filtered = active.filter(task => filter === "all" || describeCallStatus(task.status).group === filter);
  const stats = [{
    label: 'Assigned to you',
    value: active.length,
    Icon: Headphones,
    tone: 'blue',
    caption: 'All active assignments'
  }, {
    label: 'Open calls',
    value: open,
    Icon: CircleDot,
    tone: 'amber',
    caption: 'Ready for your attention'
  }, {
    label: 'In progress',
    value: progress,
    Icon: Clock3,
    tone: 'violet',
    caption: 'Work currently underway'
  }, {
    label: 'Completed',
    value: completed,
    Icon: CheckCircle2,
    tone: 'green',
    caption: 'Resolved active assignments'
  }];
  const logsAllowed = isRouteAllowed('/ProjectManagement/CallStatus');
  return <>
    <section className={ui("dashboard-welcome")}><div><div className={ui("ui-eyebrow")}>YOUR DAILY OVERVIEW</div><h1>{username ? `Welcome back, ${username.toLowerCase()}.` : 'Your work, in focus.'}</h1><p>Keep calls moving and give every client your best.</p></div><div className={ui("dashboard-welcome-actions")}><button className={ui("ui-button")} onClick={() => refetch()} disabled={isFetching} aria-label="Refresh dashboard"><RefreshCw size={16} className={ui(isFetching ? 'refresh-spinning' : '')} />Refresh</button>{isRouteAllowed('/ProjectManagement/TaskAssignment') && <Link href="/ProjectManagement/TaskAssignment" className={ui("ui-button primary")}>Calls booking<ArrowUpRight size={16} /></Link>}</div></section>
    {isError && <div className={ui("ui-error")} role="alert"><span>We couldn’t load your tasks. Please try again.</span><button className={ui("ui-button")} onClick={() => refetch()}>Retry</button></div>}
    <section className={ui("dashboard-stats")} aria-label="Your assignment statistics">{stats.map(({
        label,
        value,
        Icon,
        tone,
        caption
      }) => <article className={ui("stat-card")} key={label}><div className={ui("stat-top")}><span>{label}</span><span className={ui(`stat-icon ${tone}`)}><Icon size={19} /></span></div><strong>{isLoading || isError ? '—' : value.toLocaleString()}</strong><p>{caption}</p></article>)}</section>
    <div className={ui("dashboard-layout")}><section className={ui("dashboard-work")}><div className={ui("dashboard-section-heading")}><div><h2>Your task queue</h2><p>Active assignments, with everything you need to follow up.</p></div><div className={ui("task-filters")} aria-label="Filter tasks">{[{
              key: 'all',
              label: 'All tasks'
            }, {
              key: 'open',
              label: 'Open'
            }, {
              key: 'progress',
              label: 'In progress'
            }, {
              key: 'complete',
              label: 'Completed'
            }].map(item => <button key={item.key} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div></div>
      <CustomTable title="Assigned calls" columns={COLUMNS} data={filtered as CallsBookingRecord_Table[]} rowKey="sno" isLoading={isLoading} emptyMessage={isError ? 'Tasks are unavailable. Use Retry above.' : filter === 'all' ? 'You’re all caught up. New assignments will appear here.' : 'No assignments match this status.'} extraActions={logsAllowed ? [{
          label: 'View call history',
          icon: <ChevronRightCircle size={18} />,
          onClick: row => router.push(`/ProjectManagement/CallStatus?tktId=${row.tktId}`)
        }] : []} />
    </section>
    <aside className={ui("dashboard-aside")}><section className={ui("workload-card")}><h2>Your workload</h2><p>Resolution progress across your active assignments.</p><div className={ui("workload-value")}><strong>{isLoading || isError ? "—" : active.length ? Math.round(completed / active.length * 100) : 0}</strong><span>%</span></div><progress aria-label="Assignment completion" value={completed} max={active.length || 1} /><div className={ui("workload-breakdown")}><div><i />Pending & open<strong>{isError ? "—" : open}</strong></div><div><i />In progress<strong>{isError ? "—" : progress}</strong></div><div><i />Completed<strong>{isError ? "—" : completed}</strong></div></div></section><section className={ui("shortcut-card")}><h2>Quick access</h2><p>Go straight to your next workflow.</p>{[{
            href: "/Master/ClientVisitMaster",
            label: "Client visits"
          }, {
            href: "/ProjectManagement/CallStatus",
            label: "Call history"
          }, {
            href: "/ProjectManagement/ProjectMaster",
            label: "Projects"
          }].filter(item => isRouteAllowed(item.href)).map(item => <Link key={item.href} href={item.href}>{item.label}<ArrowUpRight size={14} /></Link>)}</section></aside></div>
    <div className={ui("dashboard-footer")}><span><span className={ui("dashboard-footer-dot")} />Live data from your assigned calls</span><span>Brightech · Calls workspace</span></div>
  </>;
}
