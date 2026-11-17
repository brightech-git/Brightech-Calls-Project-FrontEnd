'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/utils/format/date';

import { useState, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Eye, RotateCcw, Search } from 'lucide-react';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import CallStatusBadge from '@/components/CallStatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SelectCombobox } from '@/components/ui/SelectComboBox';
import { MultiSelectCombobox } from '@/components/ui/MultiSelectCombobox';
import { TextareaField } from '@/components/ui/CapitalizesTextArea';
import { SwitchInput } from '@/components/ui/SwitchInput';
import {
  MediaManager,
  MediaItem,
  revokeMediaItems,
  makeExistingMediaItem,
} from '@/components/ui/MediaManager';
import {
  AttachmentTile,
  MediaLightbox,
  LightboxItem,
} from '@/components/ui/MediaLightbox';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { useEnterNavigation } from '@/components/form/useEnterNavigation';
import { COLORS, FONT, RADIUS } from '@/utils/theme';
import { Box, Text, Flex, VStack, HStack, Button } from '@chakra-ui/react';
import {
  useCallsBookingList,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useDeleteCallsBooking,
  useGetCallsBookingById,
} from '@/src/module/task-assignment/hook/use-task-assignment';
import { useCreateCallStatus } from '@/src/module/call-status/hook/use-call-status';
import { getCallsBookingById } from '@/src/module/task-assignment/api/task-assignment.api';
import { useCompanyList } from '@/src/module/company-master/hook/use-company-master';
import { useClientList } from '@/src/module/client-master/hook/use-client-master';
import { useProjectList } from '@/src/module/project-master/hook/use-project-master';
import { useModuleList } from '@/src/module/module-master/hook/use-module-master';
import { useGetAllUsers } from '@/src/module/auth/hook/use-auth';
import { useCallStatusHistory } from '@/src/module/call-status/hook/use-call-status';
import {
  CallsBookingRecord,
  CallsBookingListItem_Table,
} from '@/src/module/task-assignment/type/task-assignment.types';
import { NativeSelectWrapper } from '@/components/ui/NativeSelectWrapper';

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, 'Status is required'),
  remark: z.string().optional(),
});
type StatusForm = z.infer<typeof statusSchema>;
const DEFAULTS_STATUS: StatusForm = {
  STATUS: 'OPEN',
  remark: '',
};
const STATUS_ITEMS = [
  // { label: "Open", value: "OPEN" },
  {
    label: 'Process',
    value: 'PROCESS',
  },
  {
    label: 'Closed',
    value: 'CLOSED',
  },
];
const callsBookingSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  moduleId: z.string().optional(),
  moduleName: z.string().optional(),
  remark: z.string().optional(),
  assignedUsers: z.string().min(1, 'Staff is required'),
  status: z.string().optional(),
  // Only editable during Update (see Assignment section below) — defaults
  // to "Y" automatically on create, same as before.
  active: z.string().optional(),
});
type CallsBookingForm = z.infer<typeof callsBookingSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingListItem_Table>[] = [
  {
    key: 'sno',
    header: 'Sno',
    render: (row, index) => index + 1,
  },
  // { key: "tktId",       header: "ID",   sortable: true, width: "10px" },

  {
    key: 'remark',
    header: 'Remark',
    width: '100px',
    render: (row) => (
      <div
        className="w-100 whitespace-normal wrap-anywhere break-words leading-[18px]"
      >
        {row.remark}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <CallStatusBadge value={row.status} />,
  },
  // { key: "bookingMedia", header: "Calls Media", render: (row) => {
  //   const image = typeof row?.bookingMedia === "string"
  //     ? JSON.parse(row.bookingMedia)
  //     :[];
  //   console.log(image,'mediaimage');
  //   return image?.length > 0 ? image.map((i:any)=>{

  //     if (i.MEDIA_TYPE === "IMAGE"){
  //       return <img src={ResolveImage(i.MEDIA_URL)}  alt="image" />
  //     }
  //     else{
  //       return <video src={ResolveImage(i.MEDIA_URL)} autoPlay/>
  //     }
  //   })  : ""
  //  }},

  //   {
  //     key: "statusMedia", header: "Status Media", render: (row) => {
  //       const image = typeof row?.bookingMedia === "string"
  //         ? JSON.parse(row.bookingMedia)
  //         : [];
  //       console.log(image, 'mediaimage');
  //       return image?.length > 0 ? image.map((i: any) => {

  //         if (i.MEDIA_TYPE === "IMAGE") {
  //           return <img src={ResolveImage(i.MEDIA_URL)} alt="image" />
  //         }
  //         else {
  //           return <video src={ResolveImage(i.MEDIA_URL)} autoPlay />
  //         }
  //       }) : ""
  //     }
  // },
  {
    key: 'clientMobile',
    header: 'Mobile',
    render: (row) => (row.clientMobile as string) || '-',
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
  },
  {
    key: 'moduleName',
    header: 'Module',
    sortable: true,
  },
  {
    key: 'assignedUsers',
    header: 'Staff',
    sortable: true,
  },
  {
    key: 'tktDate',
    header: 'Date',
    sortable: true,
    render: (row) => (row.tktDate ? formatDate(row.tktDate as string) : '-'),
  },
  {
    key: 'active',
    header: 'Active',
    render: (row) => (
      <span
        style={{
          background: row.active === 'Y' ? COLORS.successBg : COLORS.errorBg,
          color: row.active === 'Y' ? COLORS.success : COLORS.error,
        }}
        className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
      >
        {row.active === 'Y' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'statusRemark',
    header: 'Status Remark',
    render: (row) => (
      <div
        className="w-75 whitespace-normal wrap-anywhere break-words leading-[18px]"
      >
        {row.statusRemark}
      </div>
    ),
  },
];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  clientId: 0,
  projectId: '',
  projectName: '',
  moduleId: '',
  moduleName: '',
  remark: '',
  assignedUsers: '',
  status: 'P',
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  const today = new Date().toISOString().split('T')[0];
  usePageHeader({
    title: 'Calls Booking',
    subtitle: 'Manage calls & task assignments',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<CallsBookingRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<CallsBookingListItem_Table | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [statusMedia, setStatusMedia] = useState<MediaItem[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>();
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  // ── Date filter (toolbar) ──
  // "As On" shows a single date and filters bookings ticketed on exactly
  // that day (fromDate === toDate). Turned off, From Date / To Date pick a
  // range. Both are sent to the server (GET /callsbooking?fromDate=&toDate=)
  // so the filter — and the summary tiles below — reflect the whole
  // matching dataset, not just the currently loaded page.
  const userId = localStorage.getItem('userId') ?? '';
  const isAdmin = userId === '999';
  const isClientUser = !isAdmin && localStorage.getItem('isClient') === 'Y';
  const myClientId = isClientUser ? Number(localStorage.getItem('clientId')) || 0 : 0;
  const defaultFilters = {
    asOn: !isAdmin,
    asOnDate: isAdmin ? '' : today,
    fromDate: isAdmin ? '' : today,
    toDate: isAdmin ? '' : today,
    userId: isAdmin || isClientUser ? '' : userId,
    clientId: myClientId ? String(myClientId) : '',
    projectId: '',
    moduleId: '',
    status: '',
  };
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [searchFilters, setSearchFilters] = useState(defaultFilters);

  const { data: companies = [] } = useCompanyList();
  const { data: clients = [] } = useClientList();
  const { data: projects = [] } = useProjectList();
  const { data: modules = [] } = useModuleList();
  const { data: staffList = [] } = useGetAllUsers();
  const { data: pagedBookings, isLoading } = useCallsBookingList(searchFilters);
  const bookings = pagedBookings?.content ?? [];
  const { data: viewData, isLoading: viewLoading } = useGetCallsBookingById(viewId ?? '');

  // Call status history for the ticket currently being previewed
  const { data: statusHistory = [], isLoading: statusHistoryLoading } =
    useCallStatusHistory(viewData?.tktId ?? null);
  const createMutation = useCreateCallsBooking();
  const createStatusMutation = useCreateCallStatus();
  const updateMutation = useUpdateCallsBooking();
  const deleteMutation = useDeleteCallsBooking();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const handleChange = (field: string, value: any) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleApplyFilters = () => {
    setSearchFilters({
      ...appliedFilters,
    });
  };
  const handleResetFilters = () => {
    setAppliedFilters(defaultFilters);
    setSearchFilters(defaultFilters);
  };
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CallsBookingForm>({
    resolver: zodResolver(callsBookingSchema),
    defaultValues: DEFAULTS,
  });
  const {
    control: statusControl,
    handleSubmit: statusSubmit,
    reset: statusReset,
    formState: { errors: statusError },
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: DEFAULTS,
  });

  // Enter-to-next-field navigation for the Add/Edit Booking form.
  const { register: registerField, focusNext } = useEnterNavigation(
    ['clientId', 'projectId', 'moduleId', 'assignedUsers', 'status', 'remark'],
    () => handleSubmit(onSubmit)(),
  );
  const watchedProjectId = useWatch({
    control,
    name: 'projectId',
  });
  const watchedModuleId = useWatch({
    control,
    name: 'moduleId',
  });

  // Company is no longer a visible field — every booking is created under
  // the (single) company on file, applied silently at submit time.
  const defaultCompId = companies[0]?.COMPID ?? 0;

  // Auto-fill projectName when projectId changes
  useEffect(() => {
    const p = projects.find((p) => String(p.projectId) === String(watchedProjectId));
    if (p) setValue('projectName', p.projectName ?? '');
  }, [watchedProjectId, projects]);

  // Auto-fill moduleName when moduleId changes
  useEffect(() => {
    const m = modules.find((m) => String(m.moduleId) === String(watchedModuleId));
    if (m) setValue('moduleName', m.moduleName ?? '');
  }, [watchedModuleId, modules]);
  const clientItems = clients.map((c) => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID),
  }));
  const projectItems = projects.map((p) => ({
    label: p.projectName,
    value: String(p.projectId),
  }));
  const moduleItems = modules.map((m) => ({
    label: m.moduleName,
    value: String(m.moduleId),
  }));
  const staffItems = staffList.map((s) => ({
    label: s.USERNAME ?? '',
    value: String(s.USERID),
  }));
  const statusItems = [
    {
      label: 'Pending',
      value: 'P',
    },
    {
      label: 'Completed',
      value: 'C',
    },
    {
      label: 'Both',
      value: '',
    },
  ];

  // ── List filters (toolbar) ──
  const staffFilterItems = [
    {
      label: 'All assigned users',
      value: '',
    },
    ...staffItems,
  ];
  const clientFilterItems = [
    {
      label: 'All Clients',
      value: '',
    },
    ...clientItems,
  ];

  // ── Summary counts (Total / Completed / Processing) ──
  // Reflects whatever is currently in filteredBookings — i.e. the date
  // range/As On filter (server-side) plus the staff/client/status filters
  // (client-side) applied on top of it.
  const summaryTotal = pagedBookings?.numberOfElements;
  const summaryCompleted = bookings.filter((row) => row.status === 'C').length;
  const summaryProcessing = bookings.filter((row) => row.status === 'P').length;

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setMedia((prev) => {
      revokeMediaItems(prev);
      return [];
    });
    setOpen(true);
  };
  const openEdit = async (row: CallsBookingListItem_Table) => {
    if (editLoading) return;
    setEditLoading(true);
    try {
      const r = await getCallsBookingById(String(row.sno));
      setEditRow(r);
      reset({
        clientId: r.clientId,
        projectId: r.projectId || '',
        projectName: r.projectName || '',
        moduleId: r.moduleId || '',
        moduleName: r.moduleName || '',
        remark: r.remark || '',
        assignedUsers: r.assignedUsers || '',
        status: r.status || '',
        active: r.active === 'N' ? 'N' : 'Y',
      });
      setMedia((prev) => {
        revokeMediaItems(prev);
        return (r.media ?? []).map((m) => makeExistingMediaItem(m, ''));
      });
      setOpen(true);
    } catch (err: any) {
      toast.error(
        'Error',
        err?.response?.data?.message || 'Failed to load booking details.',
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Eye → open full detail page
  const openView = (row: CallsBookingListItem_Table) => {
    setViewId(String(row.sno));
  };

  // ─────────────────────────

  const onSubmit = async (data: CallsBookingForm) => {
    // Keep every existing (already-uploaded) item so its active/order
    // state is persisted, but drop new picks the user toggled off before
    // ever saving them — those were never uploaded, so there's nothing
    // to keep. `newFiles` and the id:null entries below are built from
    // the same filtered order so the backend can match them positionally.
    const keptMedia = media.filter((m) => m.isExisting || m.active);
    const newFiles = keptMedia
      .filter((m) => !m.isExisting && m.file)
      .map((m) => m.file as File);
    const mediaMeta = keptMedia.map((m, idx) => ({
      id: m.isExisting ? (m.id ?? null) : null,
      displayOrder: idx,
      active: m.active,
    }));

    // Company is no longer a form field — every booking is filed under the
    // company on record, applied here automatically. Active is only
    // editable during Update (see the Assignment section); on create it
    // isn't shown at all and defaults to "Y".
    const payload = {
      ...data,
      compId: editRow?.compId ?? defaultCompId,
      active: editRow ? (data.active ?? editRow.active ?? 'Y') : 'Y',
      // clientId: myClientId,
    };
    // console.log(payload,'payload')
    // return;
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload,
          media: newFiles,
          mediaMeta,
        });
        toast.success('Booking Updated', `"${res.tktId}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({
          payload,
          media: newFiles,
          mediaMeta,
        });
        toast.success('Booking Created', `"${res.tktId}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
      setMedia((prev) => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error(
        editRow ? 'Update Failed' : 'Create Failed',
        err?.response?.data?.message || err?.message || 'Operation failed.',
      );
    }
  };
  const onStatusSubmit = async (values: StatusForm) => {
    if (!tokenId) return '';
    console.log(tokenId, values, 'payloadstatus');
    try {
      await createStatusMutation.mutateAsync({
        payload: {
          tktId: tokenId,
          STATUS: values.STATUS,
          remark: values.remark,
        },
        media: media.map((m) => m.file).filter(Boolean) as File[],
      });
      toast.success('Status Added', 'Call status entry created successfully.');
      setAddOpen(false);
      statusReset(DEFAULTS_STATUS);
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

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success(
          'Booking Deleted',
          `Ticket "${deleteRow.tktId}" deleted successfully.`,
        );
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error('Delete Failed', err?.response?.data?.message || 'Delete failed.');
        setDeleteRow(null);
      },
    });
  };

  // ─────────────────────────

  // ── Detail view (full page replace) ──
  if (viewId !== null) {
    const v = viewData;
    return (
      <>
        <div className="rounded-lg border border-line bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-3">
            <div>
              <div className="text-xl tracking-tight">Booking Details</div>
              <div className="mt-1 text-sm text-muted">Ticket ID: {v?.tktId ?? viewId}</div>
            </div>
            <button
              className={buttonClass}
              onClick={() => setViewId(null)}
            >
              ← Back to List
            </button>
          </div>

          <div className="p-4">
            {viewLoading ? (
              <div
                className="p-12 text-center text-muted"
              >
                Loading...
              </div>
            ) : v ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {(
                    [
                      ['Ticket ID', v.tktId],
                      [
                        'Ticket Date',
                        v.tktDate ? formatDateTime(v.tktDate as string) : '—',
                      ],
                      ['Client', v.clientName],
                      ['Project', v.projectName],
                      ['Module', v.moduleName],
                      [
                        'Staff',
                        v.userMap ? Object.values(v.userMap).join(', ') : v.assignedUsers,
                      ],
                      ['Status', v.status],
                      ['Active', v.active === 'Y' ? 'Active' : 'Inactive'],
                      ['Remark', v.remark],
                      ['Cancelled', v.cancel],
                      ['Cancel By', v.cancelBy],
                      ['Updated', formatDateTime(v.updated)],
                    ] as [string, unknown][]
                  ).map(([label, val]) => (
                    <div
                      key={label}
                      className="flex flex-col items-start gap-2"
                    >
                      <span className="text-xs text-muted">{label}</span>
                      <span className="text-sm break-words text-ink">{String(val ?? '—')}</span>
                    </div>
                  ))}
                </div>

                {v.media && v.media.length > 0 && (
                  <>
                    <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Media</div>
                    <div className="flex flex-wrap gap-3">
                      {v.media.map((m, idx) => {
                        return (
                          // NOTE: m.mediaId is a shared group id (same across every
                          // file in this booking), not unique per item — key on idx.
                          <div
                            key={idx}
                            className="size-20 overflow-hidden rounded-lg border border-line bg-slate-50 [&_img]:size-full [&_img]:object-cover [&_video]:size-full [&_video]:object-cover"
                          >
                            <AttachmentTile
                              item={m}
                              onOpen={() =>
                                setLightbox({
                                  items: v.media as LightboxItem[],
                                  index: idx,
                                })
                              }
                            />
                            <div
                              style={{
                                color:
                                  m.active === false
                                    ? COLORS.textMuted
                                    : COLORS.textSecondary,
                              }}
                              className="text-xs p-1 text-center"
                            >
                              {m.active === false ? 'Inactive' : 'Active'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Call Status History</div>

                {statusHistoryLoading ? (
                  <div
                    className="p-4 text-muted text-sm"
                  >
                    Loading...
                  </div>
                ) : statusHistory.length === 0 ? (
                  <div
                    className="p-4 text-muted text-sm"
                  >
                    No status updates yet.
                  </div>
                ) : (
                  <div
                    className="flex flex-col gap-2.5"
                  >
                    {statusHistory.map((s) => {
                      const label = s.STATUS ?? '—';
                      const bg =
                        label === 'CLOSED' || label === 'C'
                          ? COLORS.errorBg
                          : label === 'PROCESS' || label === 'I'
                            ? COLORS.warningBg
                            : COLORS.successBg;
                      const color =
                        label === 'CLOSED' || label === 'C'
                          ? COLORS.error
                          : label === 'PROCESS' || label === 'I'
                            ? COLORS.warning
                            : COLORS.success;
                      return (
                        <div
                          key={s.sno}
                          style={{
                            border: `1px solid ${COLORS.cardBorder}`,
                          }}
                          className="rounded-xl p-2.5 bg-white"
                        >
                          <div
                            className="flex items-center justify-between mb-1.5"
                          >
                            <span
                              style={{
                                background: bg,
                                color,
                              }}
                              className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
                            >
                              {label}
                            </span>
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
                                        active: true,
                                      },
                                    ];
                              return (
                                <div className="flex flex-wrap gap-3">
                                  {historyMedia.map((m, idx) => {
                                    return (
                                      <div
                                        key={idx}
                                        className="size-20 overflow-hidden rounded-lg border border-line bg-slate-50 [&_img]:size-full [&_img]:object-cover [&_video]:size-full [&_video]:object-cover"
                                      >
                                        <AttachmentTile
                                          item={m}
                                          onOpen={() =>
                                            setLightbox({
                                              items: historyMedia as LightboxItem[],
                                              index: idx,
                                            })
                                          }
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div
                className="p-12 text-center text-muted"
              >
                Booking not found.
              </div>
            )}
          </div>
        </div>

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

  // ─────────────────────────

  return (
    <>
      <Box>
        {/* Summary Tiles */}
        <Flex className="gap-3 mb-3 flex-wrap">
          {[
            {
              label: 'Calls Total Listed',
              value: summaryTotal,
              bg: COLORS.gray50,
              color: COLORS.textPrimary,
            },
            {
              label: 'Calls Completed',
              value: summaryCompleted,
              bg: COLORS.successBg,
              color: COLORS.success,
            },
            {
              label: 'Calls Processing',
              value: summaryProcessing,
              bg: COLORS.warningBg,
              color: COLORS.warning,
            },
          ].map((tile) => (
            <Box
              key={tile.label}
              bg={tile.bg}
              className="flex-[1_1_160px] min-w-40 border border-solid border-line rounded-lg pl-4 pr-4 pt-2.5 pb-2.5"
            >
              <Text
                className="text-xs text-muted font-normal uppercase tracking-wide"
              >
                {tile.label}
              </Text>

              <Text
                color={tile.color}
                className="text-xl font-normal mt-0.5"
              >
                {tile.value}
              </Text>
            </Box>
          ))}
        </Flex>
      </Box>
      {/* Filter */}
      <Box
        className="flex flex-wrap items-end justify-between gap-4 [&_label]:text-xs [&_label]:text-muted [&>div]:max-w-full bg-white border border-solid border-[#E5E7EB] rounded-xl p-3 md:p-3.5 mb-3 shadow-sm"
      >
        <Flex className="gap-3 items-end flex-wrap">
          {/* As On */}
          <VStack
            spaceX="4px"
            className="items-stretch min-w-25"
          >
            <Text
              className="text-sm font-normal text-gray-700"
            >
              As On
            </Text>

            <SwitchInput
              value={appliedFilters.asOn}
              onChange={(val) => {
                setAppliedFilters((prev) => ({
                  ...prev,
                  asOn: val,
                  asOnDate: today,
                }));
              }}
              trueValue={true}
              falseValue={false}
              labels={{
                on: 'On',
                off: 'Off',
              }}
              size="sm"
            />
          </VStack>

          {/* Date Filters */}
          {appliedFilters.asOn ? (
            <VStack
              spaceX="4px"
              className="items-stretch"
            >
              <Text
                className="text-sm font-normal text-gray-700"
              >
                Date
              </Text>

              <DatePickerInput
                value={appliedFilters.asOnDate || null}
                onChange={(val) => handleChange('asOnDate', val)}
                placeholder="Select date"
                className="max-w-37.5"
              />
            </VStack>
          ) : (
            <>
              <VStack
                spaceX="4px"
                className="items-stretch"
              >
                <Text
                  className="text-sm font-normal text-gray-700"
                >
                  From Date
                </Text>

                <DatePickerInput
                  value={appliedFilters.fromDate}
                  onChange={(val) => handleChange('fromDate', val)}
                  placeholder="From date"
                  maxDate={appliedFilters.toDate || today}
                  className="max-w-37.5"
                />
              </VStack>

              <VStack
                spaceX="4px"
                className="items-stretch"
              >
                <Text
                  className="text-sm font-normal text-gray-700"
                >
                  To Date
                </Text>

                <DatePickerInput
                  value={appliedFilters.toDate || null}
                  onChange={(val) => handleChange('toDate', val)}
                  placeholder="To date"
                  minDate={appliedFilters.fromDate || undefined}
                  maxDate={today}
                  className="max-w-37.5"
                />
              </VStack>
            </>
          )}

          {/* Staff */}
          {isAdmin && (
            <VStack
              spaceX="4px"
              className="items-stretch min-w-37.5"
            >
              <Text
                className="text-sm font-normal text-gray-700"
              >
                Assigned user
              </Text>

              <SelectCombobox
                value={appliedFilters.userId || undefined}
                onChange={(val) => handleChange('userId', val)}
                items={staffFilterItems}
                placeholder="All assigned users"
                size="sm"
                label=""
                className="max-w-45 text-sm"
              />
            </VStack>
          )}

          {!isClientUser && (
            <VStack
              spaceX="4px"
              className="items-stretch min-w-50"
            >
              <Text
                className="text-sm font-normal text-gray-700"
              >
                Client
              </Text>

              <SelectCombobox
                value={appliedFilters.clientId || undefined}
                onChange={(val) => handleChange('clientId', val)}
                items={clientFilterItems}
                placeholder="Select client"
                size="sm"
                label=""
                className="max-w-62.5 min-w-50 text-sm"
              />
            </VStack>
          )}
          <VStack
            spaceX="4px"
            className="items-stretch min-w-50"
          >
            <Text
              className="text-sm font-normal text-gray-700"
            >
              Project
            </Text>
            <SelectCombobox
              value={appliedFilters.projectId}
              onChange={(val) => handleChange('projectId', val)}
              items={projectItems}
              placeholder="Select project"
              size="md"
              className="max-w-full text-sm"
            />
          </VStack>
          <VStack
            spaceX="4px"
            className="items-stretch min-w-50"
          >
            <Text
              className="text-sm font-normal text-gray-700"
            >
              Module
            </Text>
            <SelectCombobox
              value={appliedFilters.moduleId}
              onChange={(val) => handleChange('moduleId', val)}
              items={moduleItems}
              placeholder="Select module"
              size="md"
              className="max-w-full text-sm"
            />
          </VStack>

          {/* Status */}
          <VStack
            spaceX="4px"
            className="items-stretch"
          >
            <Text
              className="text-sm font-normal text-gray-700"
            >
              Status
            </Text>

            <NativeSelectWrapper
              value={appliedFilters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              items={statusItems}
              css={{
                bg: 'white',
                border: '1px solid',
                borderColor: '#D1D5DB',
                borderRadius: '6px',
              }}
              className="max-w-35"
            />
          </VStack>

          {/* Actions */}
          <HStack
            spaceX="8px"
            className="ml-auto max-sm:ml-0 max-sm:w-full max-sm:flex-wrap"
          >
            {/* Reset */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetFilters}
              _hover={{
                bg: 'gray.50',
              }}
              className="border-[#D1D5DB] text-gray-700"
            >
              <RotateCcw size={14} /> Reset
            </Button>

            {/* Apply */}
            <Button
              size="sm"
              _hover={{
                bg: COLORS.primaryHover,
              }}
              onClick={handleApplyFilters}
              className="bg-brand text-white"
            >
              <Search size={14} />
              Apply
            </Button>

            {/* Add Booking */}
            <Button
              size="sm"
              _hover={{
                bg: COLORS.primaryHover,
              }}
              onClick={openCreate}
              className="bg-brand text-white"
            >
              <Plus size={14} /> Add Booking
            </Button>
          </HStack>
        </Flex>
      </Box>

      <CustomTable
        // title="All Calls Bookings"
        showSearch={false}
        columns={COLUMNS}
        data={bookings as CallsBookingListItem_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        // onDelete={(row) =>
        //   setDeleteRow(row)
        // }
        extraActions={[
          {
            label: 'View Details',
            icon: <Eye size={13} />,
            onClick: openView,
          },
          {
            label: 'View Details',
            icon: <Plus size={13} />,
            onClick: (row) => {
              statusReset(DEFAULTS_STATUS);
              setMedia((prev) => {
                revokeMediaItems(prev);
                return [];
              });
              setTokenId(row.tktId);
              setAddOpen(true);
            },
          },
        ]}
        // searchPlaceholder="Search ticket, project, module..."
        // emptyMessage="No bookings found."
      />

      {/* Modal */}

      {open && (
        <div
          className="fixed inset-0 z-1000 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm max-sm:p-2"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="flex max-h-[calc(100dvh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-0 bg-white shadow-lg max-sm:max-h-[calc(100dvh-16px)] [&_form]:flex [&_form]:min-h-0 [&_form]:flex-1 [&_form]:flex-col"
            data-workspace-dialog
            role="dialog"
            aria-modal="true"
            aria-label="Booking and call details"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
              <div>
                <div className="text-lg tracking-tight text-ink">
                  {editRow ? 'Edit Booking' : 'Add Booking'}
                </div>

                <div className="mt-1 text-xs text-muted">
                  {editRow ? `Editing Ticket: ${editRow.tktId}` : 'Fill booking details'}
                </div>
              </div>

              <button
                className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted hover:bg-rose-50 hover:text-rose-600"
                data-dialog-close
                aria-label="Close form"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Basic Information</div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {!isClientUser && (
                    <div className="flex min-w-0 flex-col gap-2">
                      <label className="text-sm text-muted">Client *</label>
                      <Controller
                        name="clientId"
                        control={control}
                        render={({ field }) => (
                          <SelectCombobox
                            ref={registerField('clientId')}
                            value={field.value ? String(field.value) : undefined}
                            onChange={(val) => field.onChange(val ? Number(val) : 0)}
                            onEnter={() => focusNext('clientId')}
                            editId={editRow?.sno ?? null}
                            items={clientItems}
                            placeholder="Select client"
                            size="md"
                            disable={isClientUser}
                            className="max-w-full text-sm"
                          />
                        )}
                      />
                      {errors.clientId && (
                        <span className="mt-1 text-xs text-rose-600">
                          {errors.clientId.message}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Project</label>
                    <Controller
                      name="projectId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField('projectId')}
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          onEnter={() => focusNext('projectId')}
                          editId={editRow?.sno ?? null}
                          items={projectItems}
                          placeholder="Select project"
                          size="md"
                          className="max-w-full text-sm"
                        />
                      )}
                    />
                    {errors.projectId && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.projectId.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Module</label>
                    <Controller
                      name="moduleId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField('moduleId')}
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          onEnter={() => focusNext('moduleId')}
                          editId={editRow?.sno ?? null}
                          items={moduleItems}
                          placeholder="Select module"
                          size="md"
                          className="max-w-full text-sm"
                        />
                      )}
                    />
                    {errors.moduleId && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.moduleId.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Assignment</div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Staff *</label>
                    <Controller
                      name="assignedUsers"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectCombobox
                          ref={registerField('assignedUsers')}
                          value={
                            field.value ? field.value.split(',').filter(Boolean) : []
                          }
                          onChange={(vals) => field.onChange(vals.join(','))}
                          onEnter={() => focusNext('assignedUsers')}
                          editId={editRow?.sno ?? null}
                          items={staffItems}
                          placeholder="Select staff"
                          size="md"
                          className="max-w-full text-sm"
                        />
                      )}
                    />
                    {errors.assignedUsers && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.assignedUsers.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Status</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <>
                          <NativeSelectWrapper
                            ref={registerField('status')}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            onEnter={() => focusNext('status')}
                            items={statusItems}
                            css={{
                              border: '1px solid #DDD',
                              bg: '#EEE',
                              color: '#222',
                              fontSize: '14px',
                            }}
                          />
                        </>
                      )}
                    />
                    {errors.status && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.status.message}
                      </span>
                    )}
                  </div>

                  {/* Active is only editable during Update — on create it
                      defaults to "Y" automatically and isn't shown. */}
                  {editRow && (
                    <div className="flex min-w-0 flex-col gap-2">
                      <label className="text-sm text-muted">Active</label>
                      <Controller
                        name="active"
                        control={control}
                        render={({ field }) => (
                          <SwitchInput
                            value={field.value === 'N' ? 'N' : 'Y'}
                            onChange={field.onChange}
                            trueValue="Y"
                            falseValue="N"
                            labels={{
                              on: 'Active',
                              off: 'Inactive',
                            }}
                            size="sm"
                          />
                        )}
                      />
                      {errors.active && (
                        <span className="mt-1 text-xs text-rose-600">
                          {errors.active.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Details</div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Remark</label>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          inputRef={registerField('remark')}
                          value={field.value}
                          field="remark"
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext('remark')}
                          placeholder="Enter remarks"
                          mode="inline"
                        />
                      )}
                    />
                    {errors.remark && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.remark.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Media</div>

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
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={cn(buttonClass, buttonVariants.primary)}
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? 'Saving...'
                    : editRow
                      ? 'Update Booking'
                      : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            aria-label="Booking and call details"
          >
            <div
              className="shrink-0 gap-4 border-b border-line bg-slate-50/60 max-sm:px-3 flex p-2.5 justify-between items-center"
            >
              <div>
                <div className="text-xl tracking-tight">Add Status</div>
                <div className="mt-1 text-sm text-muted">Ticket:</div>
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

            <form onSubmit={statusSubmit(onStatusSubmit)}>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm text-muted">Status *</label>
                  <Controller
                    name="STATUS"
                    control={statusControl}
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
                  {statusError.STATUS && (
                    <span className="mt-1 text-xs text-rose-600">
                      {statusError.STATUS.message}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm text-muted">Remark</label>
                  <Controller
                    name="remark"
                    control={statusControl}
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
                    <span className="mt-1 text-xs text-rose-600">{errors.remark.message}</span>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm text-muted">Attachments</label>
                  <MediaManager
                    value={statusMedia}
                    onChange={setStatusMedia}
                    ticketAttachments
                    maxFiles={10}
                    onError={(msg) => toast.error('Error', msg)}
                  />
                </div>
              </div>

              <div
                className="shrink-0 gap-2.5 border-t border-line bg-white px-4 py-3 max-sm:px-3 flex items-center justify-end"
              >
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
                  disabled={createStatusMutation.isPending}
                >
                  <Pencil size={12} />
                  {createStatusMutation.isPending ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete ticket "${deleteRow?.tktId}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
