'use client';
import { buttonClass, buttonVariants, labelClass } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDateTime, formatWhen } from '@/src/utils/format/date';

import { isValidElement, useState, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  TextAreaInput,
  SelectInput,
  ComboBox,
  MultiComboBox,
  SwitchField,
  useAddNew,
} from '@/src/components/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader,
  MessageSquarePlus,
  Pencil,
  PhoneCall,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { CustomTable, TableColumn } from '@/src/components/CustomTable';
import CallStatusBadge from '@/src/components/CallStatusBadge';
import {
  CALL_STATUS_OPTIONS,
  CALL_STATUS_STYLE,
  callStatusStyle,
  describeCallStatus,
} from '@/src/utils/callStatus';
import ConfirmDialog from '@/src/components/ConfirmDialog';
import {
  MediaManager,
  MediaItem,
  revokeMediaItems,
  makeExistingMediaItem,
} from '@/src/components/ui/MediaManager';
import { AttachmentList } from '@/src/components/ui/attachments';
import { MediaLightbox, LightboxItem } from '@/src/components/ui/MediaLightbox';
import { DatePickerInput } from '@/src/components/ui/DatePickerInput';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useToast } from '@/src/components/Toast';
import { COLORS, FONT, RADIUS } from '@/src/theme';
import {
  useCallsBookingList,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useUpdateCallsBookingStatus,
  useDeleteCallsBooking,
  useGetCallsBookingById,
} from '@/src/module/task-assignment/hook/use-task-assignment';
import { useCreateCallStatus } from '@/src/module/call-status/hook/use-call-status';
import { getCallsBookingById } from '@/src/module/task-assignment/api/task-assignment.api';
import { useCompanyList } from '@/src/module/company-master/hook/use-company-master';
import { useClientList } from '@/src/module/client-master/hook/use-client-master';
import { useProjectList } from '@/src/module/project-master/hook/use-project-master';
import { useModuleList } from '@/src/module/module-master/hook/use-module-master';
import { ClientFormModal } from '@/src/module/client-master/component/client-form';
import { ProjectFormModal } from '@/src/module/project-master/component/project-form';
import { ModuleFormModal } from '@/src/module/module-master/component/module-form';
import { useGetAllUsers } from '@/src/module/auth/hook/use-auth';
import { useCallStatusHistory } from '@/src/module/call-status/hook/use-call-status';
import {
  statusFiles,
  type CallFile,
} from '@/src/module/call-status/component/call-files';
import {
  CallsBookingRecord,
  CallsBookingListItem_Table,
} from '@/src/module/task-assignment/type/task-assignment.types';

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, 'Status is required'),
  remark: z.string().optional(),
});
type StatusForm = z.infer<typeof statusSchema>;
const DEFAULTS_STATUS: StatusForm = {
  STATUS: 'I',
  remark: '',
};
const STATUS_ITEMS = CALL_STATUS_OPTIONS;
const callsBookingSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  moduleId: z.string().optional(),
  moduleName: z.string().optional(),
  remark: z.string().optional(),
  // Required for staff/admin bookings (checked on submit). A client raising a call
  // leaves it empty, and the admin assigns staff afterwards.
  assignedUsers: z.string().optional(),
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
    key: 'tktid',
    header: 'TKT ID',
    render: (row) => row.tktId,
  },
  // { key: "tktId",       header: "ID",   sortable: true, width: "10px" },

  {
    key: 'remark',
    header: 'Remark',
    maxWidth: '280px',
    render: (row) => <span title={row.remark ?? ''}>{row.remark || '—'}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    //total: 'breakdown',
    //totalLabel: (v) => describeCallStatus(v).label,
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
    header: 'Date & time',
    sortable: true,
    render: (row) => (row.tktDate ? formatWhen(row.tktDate as string) : '-'),
  },
  {
    key: 'active',
   // total: 'active',
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
    maxWidth: '240px',
    render: (row) => (
      <span title={row.statusRemark ?? ''}>{row.statusRemark || '—'}</span>
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
  // The booking whose status is being updated, so its own status follows the update.
  const [statusRow, setStatusRow] = useState<{
    sno: number;
    remark?: string | null;
  } | null>(null);
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  const userId = localStorage.getItem('userId') ?? '';
  const isAdmin = userId === '999';
  const isClientUser = !isAdmin && localStorage.getItem('isClient') === 'Y';
  const myClientId = isClientUser ? Number(localStorage.getItem('clientId')) || 0 : 0;
  const defaultFilters = {
    asOn: !isAdmin,
    asOnDate: today,
    fromDate: today,
    toDate: today,
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
  const { data: staffList = [] } = useGetAllUsers({ active: 'Y' });
  const { data: pagedBookings, isLoading } = useCallsBookingList(searchFilters);
  const bookings = pagedBookings?.content ?? [];
  const { data: viewData, isLoading: viewLoading } = useGetCallsBookingById(viewId ?? '');

  // Call status history for the ticket currently being previewed
  const { data: statusHistory = [], isLoading: statusHistoryLoading } =
    useCallStatusHistory(viewData?.tktId ?? null);
  const createMutation = useCreateCallsBooking();
  const createStatusMutation = useCreateCallStatus();
  const updateMutation = useUpdateCallsBooking();
  const bookingStatusMutation = useUpdateCallsBookingStatus();
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
    getValues,
    setError,
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

  // "Add new" on the Client / Project / Module combos opens that master's form.
  const addNew = useAddNew<'client' | 'project' | 'module'>();

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
  const statusItems = CALL_STATUS_OPTIONS;

  // ── List filters (toolbar) ──

  // ── Summary counts (Total / Completed / Processing) ──
  // Reflects whatever is currently in filteredBookings — i.e. the date
  // range/As On filter (server-side) plus the staff/client/status filters
  // (client-side) applied on top of it.
  const summary = bookings.reduce(
    (acc, row) => {
      const group = describeCallStatus(row.status).group;
      if (group === 'open') acc.open++;
      else if (group === 'progress') acc.progress++;
      else if (group === 'complete') acc.complete++;
      return acc;
    },
    {
      total: pagedBookings?.numberOfElements ?? bookings.length,
      open: 0,
      progress: 0,
      complete: 0,
    },
  );

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    // A client user's own client is filled in (the field is hidden for them).
    reset({ ...DEFAULTS, clientId: isClientUser ? myClientId : DEFAULTS.clientId });
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
    if (!isClientUser && !data.assignedUsers) {
      setError('assignedUsers', { type: 'required', message: 'Staff is required' });
      return;
    }
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


    const payload = {
      ...data,
      compId: editRow?.compId ?? defaultCompId,
      active: editRow ? (data.active ?? editRow.active ?? 'Y') : 'Y',
      // Status is not picked on the booking form: a new booking always starts as
      // Pending, and later changes come only from status updates.
      status: editRow ? editRow.status || data.status || 'P' : 'P',
      // A client user always books for their own client.
      clientId: isClientUser ? myClientId || data.clientId : data.clientId,
      // Clients don't pick staff; an edit by a client keeps the existing assignment.
      assignedUsers: isClientUser
        ? (editRow?.assignedUsers ?? data.assignedUsers ?? '')
        : (data.assignedUsers ?? ''),
    };
   
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
        // Only the files picked in the status dialog, and only the ones left active.
        media: statusMedia.flatMap((m) => (m.active && m.file ? [m.file] : [])),
      });
      // Keep the booking's own status in step, so every list shows the latest one.
      // The booking remark is sent back unchanged (the backend would clear it otherwise).
      if (statusRow) {
        await bookingStatusMutation.mutateAsync({
          id: String(statusRow.sno),
          status: values.STATUS,
          remark: statusRow.remark ?? '',
        });
      }
      toast.success('Status Added', 'Call status entry created successfully.');
      setAddOpen(false);
      statusReset(DEFAULTS_STATUS);
      setStatusMedia((prev) => {
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
  // Opens the "Add status" dialog for a booking, from the list or its single view.
  const openStatus = (row: {
    tktId?: number | string | null;
    sno: number | string;
    status?: unknown;
    remark?: unknown;
  }) => {
    const current = describeCallStatus(row.status).code;
    statusReset({
      ...DEFAULTS_STATUS,
      STATUS: current && current !== 'P' ? current : 'I',
    });
    setStatusMedia((prev) => {
      revokeMediaItems(prev);
      return [];
    });
    setTokenId(row.tktId == null ? null : Number(row.tktId));
    setStatusRow({
      sno: Number(row.sno),
      remark: (row.remark as string | null | undefined) ?? '',
    });
    setAddOpen(true);
  };

  const statusDialog = addOpen ? (
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
        <div className="shrink-0 gap-4 border-b border-line bg-slate-50/60 max-sm:px-3 flex p-2.5 justify-between items-center">
          <div>
            <div className="text-xl tracking-tight">Add Status</div>
            <div className="mt-1 text-sm text-muted">Ticket: {tokenId ?? '—'}</div>
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
            <div className="grid gap-3">
              <Controller
                name="STATUS"
                control={statusControl}
                render={({ field }) => (
                  <SelectInput
                    label="Status"
                    required
                    value={field.value}
                    onChange={(v) => field.onChange(v.toUpperCase())}
                    options={STATUS_ITEMS}
                    error={statusError.STATUS?.message}
                  />
                )}
              />

              <Controller
                name="remark"
                control={statusControl}
                render={({ field }) => (
                  <TextAreaInput
                    label="Remark"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter remark"
                    rows={3}
                  />
                )}
              />

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
          </div>

          <div className="shrink-0 gap-2.5 border-t border-line bg-white px-4 py-3 max-sm:px-3 flex items-center justify-end">
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
  ) : null;

  if (viewId !== null) {
    const v = viewData;
    return (
      <>
        <div className="rounded-lg border border-line bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-3">
            <div>
              <div className="text-xl tracking-tight">Booking Details</div>
              <div className="mt-1 text-sm text-muted">
                Ticket ID: {v?.tktId ?? viewId}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {v && (
                <button
                  type="button"
                  className={cn(buttonClass, buttonVariants.primary)}
                  onClick={() => openStatus(v)}
                >
                  <MessageSquarePlus size={14} /> Add status
                </button>
              )}
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  setViewId(null);
                  openCreate();
                }}
              >
                <Plus size={14} /> New booking
              </button>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setViewId(null)}
              >
                ← Back to list
              </button>
            </div>
          </div>

          <div className="p-4">
            {viewLoading ? (
              <div className="p-12 text-center text-muted">Loading...</div>
            ) : v ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {(
                    [
                      ['Ticket ID', v.tktId],
                      ['Ticket Date', v.tktDate ? formatWhen(v.tktDate as string) : '—'],
                      ['Client', v.clientName],
                      ['Project', v.projectName],
                      ['Module', v.moduleName],
                      [
                        'Staff',
                        v.userMap ? Object.values(v.userMap).join(', ') : v.assignedUsers,
                      ],
                      [
                        'Status',
                        <CallStatusBadge
                          key="s"
                          value={v.status}
                        />,
                      ],
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
                      <span className="text-sm break-words text-ink">
                        {isValidElement(val) ? val : String(val ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>

                {(() => {
                  const files: CallFile[] = [
                    ...(v.media ?? []).map((m) => ({ ...m, source: 'Booking' })),
                    ...statusHistory.flatMap((s) =>
                      statusFiles(s).map((m) => ({
                        ...m,
                        source: `${describeCallStatus(s.STATUS ?? '').label} update${
                          s.UPDATED ? ` · ${formatDateTime(s.UPDATED)}` : ''
                        }`,
                      })),
                    ),
                  ];
                  return (
                    <section className="mt-5">
                      <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                        <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">
                          All files on this call
                        </h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-ink">
                          {files.length}
                        </span>
                      </div>
                      <AttachmentList
                        items={files}
                        emptyText="No files were added to this call yet."
                        onOpen={(index) => setLightbox({ items: files, index })}
                      />
                    </section>
                  );
                })()}

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
                  Call Status History
                </div>

                {statusHistoryLoading ? (
                  <div className="p-4 text-muted text-sm">Loading...</div>
                ) : statusHistory.length === 0 ? (
                  <div className="p-4 text-muted text-sm">No status updates yet.</div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {statusHistory.map((s) => {
                      return (
                        <div
                          key={s.sno}
                          className={cn(
                            'relative overflow-hidden rounded-xl border border-line bg-white p-2.5 pl-3.5',
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'absolute inset-y-0 left-0 w-1',
                              callStatusStyle(s.STATUS).solid,
                            )}
                          />
                          <div className="flex items-center justify-between mb-1.5">
                            <CallStatusBadge value={s.STATUS} />
                            <span className="text-xs text-muted">
                              {s.UPDATED ? formatDateTime(s.UPDATED) : '—'}
                            </span>
                          </div>

                          <div className="text-sm text-ink mb-1">
                            By <b className="text-ink">{s.userName ?? s.userId ?? '—'}</b>
                          </div>

                          {s.remark && (
                            <div className="text-sm text-ink mb-1.5">{s.remark}</div>
                          )}

                          {statusFiles(s).length > 0 && (
                            <AttachmentList
                              className="mt-2"
                              items={statusFiles(s)}
                              onOpen={(index) =>
                                setLightbox({ items: statusFiles(s), index })
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-muted">Booking not found.</div>
            )}
          </div>
        </div>

        {statusDialog}
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
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">
            Projects &amp; calls
          </p>
          <h1 className="text-lg font-semibold text-ink">Calls booking</h1>
          <p className="text-xs text-muted">
            Book calls, assign staff and follow every status update in one place.
          </p>
        </div>
        <button
          type="button"
          className={cn(buttonClass, buttonVariants.primary)}
          onClick={openCreate}
        >
          <Plus size={14} /> New booking
        </button>
      </div>

      {/* Summary tiles */}
      <div className="mb-3 grid grid-cols-4 gap-2 max-lg:grid-cols-2">
        {[
          {
            label: 'Calls listed',
            value: summary.total,
            tone: 'bg-brand',
            icon: <PhoneCall size={16} />,
          },
          {
            label: 'Pending',
            value: summary.open,
            tone: CALL_STATUS_STYLE.open.solid,
            icon: <Clock3 size={16} />,
          },
          {
            label: 'In processing',
            value: summary.progress,
            tone: CALL_STATUS_STYLE.progress.solid,
            icon: <Loader size={16} />,
          },
          {
            label: 'Completed',
            value: summary.complete,
            tone: CALL_STATUS_STYLE.complete.solid,
            icon: <CheckCircle2 size={16} />,
          },
        ].map((tile) => (
          <div
            key={tile.label}
            className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-line bg-white px-3.5 py-3"
          >
            <span
              aria-hidden
              className={cn('absolute inset-y-0 left-0 w-1', tile.tone)}
            />
            <span
              aria-hidden
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-md text-white',
                tile.tone,
              )}
            >
              {tile.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                {tile.label}
              </p>
              <p className="text-xl leading-tight font-semibold text-ink tabular-nums">
                {isLoading ? '—' : tile.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters — Enter moves through them and runs Apply on the last one */}
      <section
        data-enter-nav
        aria-label="Filter bookings"
        className="mb-3 rounded-lg border border-line bg-white px-2.5 py-2"
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
        
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink uppercase">
            <SlidersHorizontal size={13} /> Filters
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] items-end gap-x-2 gap-y-1.5">
          <SwitchField
            value={appliedFilters.asOn}
            onChange={(val) =>
              setAppliedFilters((prev) => ({ ...prev, asOn: val, asOnDate: today }))
            }
            labels={{ on: 'As On', off: 'As On' }}
          />
          {appliedFilters.asOn ? (
            <div className="grid gap-1">
              <span className={labelClass}>As on</span>
              <DatePickerInput
                value={appliedFilters.asOnDate || null}
                onChange={(val) => handleChange('asOnDate', val)}
                placeholder="Select date"
                className="z-[100]"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-1">
                <span className={labelClass}>From</span>
                <DatePickerInput
                  value={appliedFilters.fromDate}
                  onChange={(val) => handleChange('fromDate', val)}
                  placeholder="From date"
                  maxDate={appliedFilters.toDate || today}
                />
              </div>
              <div className="grid gap-1">
                <span className={labelClass}>To</span>
                <DatePickerInput
                  value={appliedFilters.toDate || null}
                  onChange={(val) => handleChange('toDate', val)}
                  placeholder="To date"
                  minDate={appliedFilters.fromDate || undefined}
                  maxDate={today}
                />
              </div>
            </>
          )}
          {isAdmin && (
            <ComboBox
              label="Assigned user"
              value={appliedFilters.userId}
              onChange={(val) => handleChange('userId', val)}
              options={staffItems}
              placeholder="All users"
            />
          )}
          {!isClientUser && (
            <ComboBox
              label="Client"
              value={appliedFilters.clientId}
              onChange={(val) => handleChange('clientId', val)}
              options={clientItems}
              placeholder="All clients"
            />
          )}
          <ComboBox
            label="Project"
            value={appliedFilters.projectId}
            onChange={(val) => handleChange('projectId', val)}
            options={projectItems}
            placeholder="All projects"
          />
          <ComboBox
            label="Module"
            value={appliedFilters.moduleId}
            onChange={(val) => handleChange('moduleId', val)}
            options={moduleItems}
            placeholder="All modules"
          />
          <SelectInput
            label="Status"
            value={appliedFilters.status}
            onChange={(val) => handleChange('status', val)}
            options={statusItems}
            placeholder="All statuses"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(buttonClass, 'flex-1')}
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              data-enter-submit
              className={cn(buttonClass, buttonVariants.primary, 'flex-1')}
              onClick={handleApplyFilters}
            >
              <Search size={13} /> Apply
            </button>
          </div>
        </div>
      </section>

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
            label: 'Update status',
            icon: <MessageSquarePlus size={13} />,
            onClick: openStatus,
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

            <form
              onSubmit={handleSubmit(onSubmit, (formErrors) => {
                // Errors on a field the user can't see would otherwise make the
                // button look dead, so name them in a toast.
                const messages = Object.values(formErrors)
                  .map((e) => e?.message)
                  .filter(Boolean);
                if (messages.length) toast.error('Check the form', messages.join(' · '));
              })}
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
                  Basic Information
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {!isClientUser && (
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field }) => (
                        <ComboBox
                          label="Client"
                          required
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          options={clientItems}
                          placeholder="Select client"
                          disabled={isClientUser}
                          error={errors.clientId?.message}
                          addNew
                          addNewLabel="Add new client"
                          onAddNew={(typed) => addNew.open('client', typed)}
                        />
                      )}
                    />
                  )}

                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <ComboBox
                        label="Project"
                        value={field.value || undefined}
                        onChange={(val) => field.onChange(val)}
                        options={projectItems}
                        placeholder="Select project"
                        error={errors.projectId?.message}
                        addNew={!isClientUser}
                        addNewLabel="Add new project"
                        onAddNew={(typed) => addNew.open('project', typed)}
                      />
                    )}
                  />

                  <Controller
                    name="moduleId"
                    control={control}
                    render={({ field }) => (
                      <ComboBox
                        label="Module"
                        value={field.value || undefined}
                        onChange={(val) => field.onChange(val)}
                        options={moduleItems}
                        placeholder="Select module"
                        error={errors.moduleId?.message}
                        addNew={!isClientUser}
                        addNewLabel="Add new module"
                        onAddNew={(typed) => addNew.open('module', typed)}
                      />
                    )}
                  />
                </div>

                {(!isClientUser || editRow) && (
                  <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
                    Assignment
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  {/* Clients raise the call; staff are assigned by the admin. */}
                 {/* {!isClientUser && ( */}
                    <Controller
                      name="assignedUsers"
                      control={control}
                      render={({ field }) => (
                        <MultiComboBox
                          label="Staff"
                          required
                          value={
                            field.value ? field.value.split(',').filter(Boolean) : []
                          }
                          onChange={(vals) => field.onChange(vals.join(','))}
                          options={staffItems}
                          placeholder="Select staff"
                          error={errors.assignedUsers?.message}
                        />
                      )}
                    />
                  {/* )} */}

                  {/* Active is only editable during Update — on create it
                      defaults to "Y" automatically and isn't shown. */}
                  {editRow && (
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <SwitchField
                          label="Active"
                          value={field.value === 'N' ? 'N' : 'Y'}
                          onChange={field.onChange}
                          trueValue="Y"
                          falseValue="N"
                          labels={{
                            on: 'Active',
                            off: 'Inactive',
                          }}
                          error={errors.active?.message}
                        />
                      )}
                    />
                  )}
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
                  Details
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                      <TextAreaInput
                        label="Remark"
                        value={field.value}
                        placeholder="Enter remarks"
                        onChange={field.onChange}
                        error={errors.remark?.message}
                        rows={3}
                      />
                    )}
                  />
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
                  Media
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

      {statusDialog}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete ticket "${deleteRow?.tktId}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
      {/* "Add new" from the booking form's combos */}
      <ClientFormModal
        open={addNew.is('client')}
        initial={{ CLIENTNAME: addNew.seed.toUpperCase() }}
        onCancel={addNew.close}
        onSaved={(client) => {
          setValue('clientId', client.CLIENTID, { shouldValidate: true });
          addNew.close();
        }}
      />
      <ProjectFormModal
        open={addNew.is('project')}
        initial={{
          PROJECTNAME: addNew.seed.toUpperCase(),
          CLIENTID: Number(getValues('clientId')) || 0,
        }}
        onCancel={addNew.close}
        onSaved={(project) => {
          setValue('projectId', String(project.projectId), { shouldValidate: true });
          addNew.close();
        }}
      />
      <ModuleFormModal
        open={addNew.is('module')}
        initial={{
          MODULENAME: addNew.seed.toUpperCase(),
          PROJECTID: Number(getValues('projectId')) || 0,
        }}
        onCancel={addNew.close}
        onSaved={(module) => {
          setValue('moduleId', String(module.moduleId), { shouldValidate: true });
          addNew.close();
        }}
      />
    </>
  );
}
