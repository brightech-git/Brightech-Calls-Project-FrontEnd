'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/format/date';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { List, Plus, Pencil, ChevronRightCircle } from 'lucide-react';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import { TextareaField } from '@/components/ui/CapitalizesTextArea';
import { MediaManager, MediaItem, revokeMediaItems } from '@/components/ui/MediaManager';
import {
  AttachmentTile,
  MediaLightbox,
  LightboxItem,
} from '@/components/ui/MediaLightbox';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { COLORS, RADIUS, FONT } from '@/utils/theme';
import {
  useActiveBookingsWithLastStatus,
  useCallStatusTicketDetail,
  useCreateCallStatus,
} from '@/hooks/CallStatus/useCallStatus';
import {
  CallStatusListItem_Table,
  CallStatusRecord,
} from '@/types/CallStatus/CallStatus';
import { NativeSelectWrapper } from '@/components/ui/NativeSelectWrapper';

// ─────────────────────────────────────────────
// Schema — Add Status form
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, 'Status is required'),
  remark: z.string().optional(),
});
type StatusForm = z.infer<typeof statusSchema>;
const DEFAULTS: StatusForm = {
  STATUS: 'OPEN',
  remark: '',
};
const STATUS_ITEMS = [
  {
    label: 'Open',
    value: 'OPEN',
  },
  {
    label: 'Process',
    value: 'PROCESS',
  },
  {
    label: 'Closed',
    value: 'CLOSED',
  },
];
const statusBadge = (label?: string | null) => {
  const s = label ?? '—';
  const bg =
    s === 'CLOSED'
      ? COLORS.errorBg
      : s === 'PROCESS'
        ? COLORS.warningBg
        : COLORS.successBg;
  const color =
    s === 'CLOSED' ? COLORS.error : s === 'PROCESS' ? COLORS.warning : COLORS.success;
  return (
    <span
      style={{
        background: bg,
        color,
      }}
      className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
    >
      {s}
    </span>
  );
};

// ─────────────────────────────────────────────
// Columns — list view (active bookings only)
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallStatusListItem_Table>[] = [
  {
    key: 'tktId',
    header: 'Ticket ID',
    sortable: true,
    width: '90px',
  },
  {
    key: 'clientName',
    header: 'Client',
    sortable: true,
    render: (row) => (row.clientName as string) || '-',
  },
  {
    key: 'projectName',
    header: 'Project',
    sortable: true,
    render: (row) => (row.projectName as string) || '-',
  },
  {
    key: 'moduleName',
    header: 'Module',
    sortable: true,
    render: (row) => (row.moduleName as string) || '-',
  },
  {
    key: 'lastStatus',
    header: 'Last Status',
    sortable: true,
    render: (row) =>
      row.lastStatus ? (
        statusBadge(row.lastStatus as string)
      ) : (
        <span className="text-muted text-sm">
          No status yet
        </span>
      ),
  },
];
// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">Loading...</div>
      }
    >
      <CallStatusPageInner />
    </Suspense>
  );
}
function CallStatusPageInner() {
  usePageHeader({
    title: 'Call Status',
    subtitle: 'Track call status updates per task',
  });
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewTktId, setViewTktId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  // Deep-link support — e.g. /ProjectManagement/CallStatus?tktId=1234 opens
  // straight into that ticket's log/detail view (used by the Home page's
  // "View Logs" action).
  useEffect(() => {
    const tktIdParam = searchParams.get('tktId');
    if (tktIdParam) {
      const parsed = Number(tktIdParam);
      if (!Number.isNaN(parsed)) setViewTktId(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const { data: bookings = [], isLoading } = useActiveBookingsWithLastStatus();

  const { data: detail, isLoading: detailLoading } = useCallStatusTicketDetail(viewTktId);
  const createMutation = useCreateCallStatus();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: DEFAULTS,
  });

  // Newest-first — used both to display the history and to derive the
  // "latest status" shown in the task summary at the top of the detail page.
  const sortedStatuses: CallStatusRecord[] = useMemo(() => {
    const list = detail?.statuses ?? [];
    return [...list].sort((a, b) => {
      const ta = a.UPDATED ? new Date(a.UPDATED).getTime() : 0;
      const tb = b.UPDATED ? new Date(b.UPDATED).getTime() : 0;
      return tb - ta;
    });
  }, [detail]);
  const latestStatus = sortedStatuses[0];
  const openView = (row: CallStatusListItem_Table) => {
    setViewTktId(Number(row.tktId));
    router.replace(`/ProjectManagement/CallStatus?tktId=${row.tktId}`);
  };
  const openAdd = () => {
    reset(DEFAULTS);
    setMedia((prev) => {
      revokeMediaItems(prev);
      return [];
    });
    setAddOpen(true);
  };
  const onSubmit = async (values: StatusForm) => {
    if (!viewTktId) return;
    try {
      await createMutation.mutateAsync({
        payload: {
          tktId: viewTktId,
          STATUS: values.STATUS,
          remark: values.remark,
        },
        media: media.flatMap((item) => (item.active && item.file ? [item.file] : [])),
      });
      toast.success('Status Added', 'Call status entry created successfully.');
      setAddOpen(false);
      reset(DEFAULTS);
      setMedia((prev) => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error(
        'Save Failed',
        err?.response?.data?.message || err?.message || 'Failed to save status.',
      );
    }
  };

  // ── Detail view (full page replace) ──
  if (viewTktId !== null) {
    const booking = detail?.callBooking;
    const bookingMedia = booking?.media ?? [];
    return (
      <>
        <div className="rounded-lg border border-line bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-3">
            <div>
              <div className="text-xl tracking-tight">Call Status</div>
              <div className="mt-1 text-sm text-muted">Ticket ID: {booking?.tktId ?? viewTktId}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className={cn(buttonClass, buttonVariants.primary)}
                onClick={openAdd}
              >
                <Plus size={13} />
                Add Status
              </button>
              <button
                className={buttonClass}
                onClick={() => {
                  setViewTktId(null);
                  router.replace('/ProjectManagement/CallStatus');
                }}
              >
                ← Back to List
              </button>
            </div>
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div
                className="p-12 text-center text-muted"
              >
                Loading...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {(
                    [
                      ['Client', booking?.clientName],
                      ['Project', booking?.projectName],
                      ['Module', booking?.moduleName],
                      ['Task Status', booking?.status],
                      ['Task Remark', booking?.remark],
                      ['Last Status', latestStatus?.STATUS],
                      ['Latest Remark', latestStatus?.remark],
                    ] as [string, unknown][]
                  ).map(([label, val]) => (
                    <div
                      key={label}
                      className="flex flex-col items-start gap-2"
                    >
                      <span className="text-xs text-muted">{label}</span>
                      <span className="text-sm break-words text-ink">
                        {label === 'Task Status' || label === 'Last Status'
                          ? statusBadge(val as string | null)
                          : String(val ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>

                {bookingMedia.length > 0 && (
                  <>
                    <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Booking attachments</div>
                    <div className="flex flex-wrap gap-3">
                      {bookingMedia.map((item, index) => (
                        <AttachmentTile
                          key={item.id ?? index}
                          item={item}
                          onOpen={() => setLightbox({ items: bookingMedia, index })}
                        />
                      ))}
                    </div>
                  </>
                )}

                {latestStatus?.media && latestStatus.media.length > 0 && (
                  <>
                    <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Media (latest status)</div>
                    <div className="flex flex-wrap gap-3">
                      {latestStatus.media.map((m, idx) => (
                        <AttachmentTile
                          key={m.id ?? idx}
                          item={m}

                          onOpen={() =>
                            setLightbox({
                              items: latestStatus.media as LightboxItem[],
                              index: idx,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Status History</div>

                {sortedStatuses.length === 0 ? (
                  <div
                    className="p-4 text-muted text-sm"
                  >
                    No status updates yet.
                  </div>
                ) : (
                  <div
                    className="flex flex-col gap-2.5"
                  >
                    {sortedStatuses.map((s) => (
                      <div
                        key={s.sno}
                        className="rounded-xl border border-line border-l-3 border-l-brand bg-white p-3"
                      >
                        <div
                          className="flex items-center justify-between mb-1.5"
                        >
                          {statusBadge(s.STATUS)}
                          <span
                            className="text-xs text-muted"
                          >
                            {s.UPDATED ? formatDateTime(s.UPDATED) : '—'}
                          </span>
                        </div>

                        <div
                          className="text-sm text-ink mb-1"
                        >
                          By{' '}
                          <b className="text-ink">
                            {s.userName ?? s.userId ?? '—'}
                          </b>
                        </div>

                        {s.remark && (
                          <div
                            className="text-sm text-ink mb-1.5"
                          >
                            {s.remark}
                          </div>
                        )}

                        {((s.media && s.media.length > 0) || s.IMAGE) &&
                          (() => {
                            const historyMedia =
                              s.media && s.media.length > 0
                                ? s.media
                                : [
                                    {
                                      mediaUrl: s.IMAGE,
                                      mediaType: 'IMAGE',
                                    },
                                  ];
                            return (
                              <div className="flex flex-wrap gap-3">
                                {historyMedia.map((m, idx) => (
                                  <AttachmentTile
                                    key={idx}
                                    item={m}

                                    onOpen={() =>
                                      setLightbox({
                                        items: historyMedia as LightboxItem[],
                                        index: idx,
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })()}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Status Modal */}
        {addOpen && (
          <div
            className="fixed inset-0 z-1000 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm max-sm:p-2"
            onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}
          >
            <div
              className="flex max-h-[calc(100dvh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-0 bg-white shadow-lg max-sm:max-h-[calc(100dvh-16px)] [&_form]:flex [&_form]:min-h-0 [&_form]:flex-1 [&_form]:flex-col"
              data-workspace-dialog
              role="dialog"
              aria-modal="true"
              aria-label="Call update details"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-3">
                <div>
                  <div className="text-xl tracking-tight">Add Status</div>
                  <div className="mt-1 text-sm text-muted">
                    Ticket: {booking?.tktId ?? viewTktId}
                  </div>
                </div>
                <button
                  className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted hover:bg-rose-50 hover:text-rose-600"
                  data-dialog-close
                  aria-label="Close form"
                  onClick={() => setAddOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Status *</label>
                    <Controller
                      name="STATUS"
                      control={control}
                      render={({ field }) => (
                        <>
                          <NativeSelectWrapper
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            items={STATUS_ITEMS}
                            css={{
                              fontSize: '14px',
                              background: '#ddd',
                              color: '#222',
                            }}
                            className="min-w-37.5"
                          />
                        </>
                      )}
                    />
                    {errors.STATUS && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.STATUS.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Remark</label>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="remark"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter remark"
                          mode="inline"
                          rows={3}
                        />
                      )}
                    />
                    {errors.remark && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.remark.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Attachments</label>
                    <MediaManager
                      value={media}
                      onChange={setMedia}
                      ticketAttachments
                      maxFiles={10}
                      onError={(msg) => toast.error('Error', msg)}
                    />
                  </div>
                </div>

                <div className="flex shrink-0 justify-end gap-2.5 border-t border-line bg-white px-4 py-3 max-sm:px-3">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cn(buttonClass, buttonVariants.primary)}
                    disabled={createMutation.isPending}
                  >
                    <Pencil size={12} />
                    {createMutation.isPending ? 'Saving...' : 'Save Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {lightbox && (
          <MediaLightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onIndexChange={(i) =>
              setLightbox((prev) =>
                prev
                  ? {
                      ...prev,
                      index: i,
                    }
                  : prev,
              )
            }
          />
        )}
      </>
    );
  }

  // ── List view ──
  return (
    <CustomTable
      title="Call Status"
      columns={COLUMNS}
      data={bookings as CallStatusListItem_Table[]}
      rowKey="sno"
      isLoading={isLoading}
      extraActions={[
        {
          label: 'View Status',
          icon: <ChevronRightCircle size={20} />,
          onClick: openView,
        },
      ]}
      searchPlaceholder="Search ticket, client, project..."
      emptyMessage="No active bookings found."
    />
  );
}
