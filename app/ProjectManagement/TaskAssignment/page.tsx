"use client";

import { ui } from "@/utils/ui";
import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Eye, RotateCcw, Search } from "lucide-react";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import CallStatusBadge from "@/components/CallStatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { MultiSelectCombobox } from "@/components/ui/MultiSelectCombobox";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { MediaManager, MediaItem, revokeMediaItems, makeExistingMediaItem } from "@/components/ui/MediaManager";
import { MediaLightbox, LightboxItem } from "@/components/ui/MediaLightbox";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { useEnterNavigation } from "@/components/form/useEnterNavigation";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { Box, Text, Flex, VStack, HStack, Button } from "@chakra-ui/react";
import { useCallsBookingList, useCreateCallsBooking, useUpdateCallsBooking, useDeleteCallsBooking, useGetCallsBookingById } from "@/hooks/TaskAssignment/useTaskAssignment";
import { useCreateCallStatus } from "@/hooks/CallStatus/useCallStatus";
import { getCallsBookingById } from "@/services/TaskAssignmentService";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { useProjectList } from "@/hooks/ProjectMaster/useProjectMaster";
import { useModuleList } from "@/hooks/ModuleMaster/useModuleMaster";
import { useGetAllUsers } from "@/hooks/Auth/useAuth";
import { useCallStatusHistory } from "@/hooks/CallStatus/useCallStatus";
import { CallsBookingRecord, CallsBookingListItem_Table } from "@/types/TaskAssignment/TaskAssignment";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import { ResolveImage } from "@/utils/format/resolveImage";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, "Status is required"),
  remark: z.string().optional()
});
type StatusForm = z.infer<typeof statusSchema>;
const DEFAULTS_STATUS: StatusForm = {
  STATUS: "OPEN",
  remark: ""
};
const STATUS_ITEMS = [
// { label: "Open", value: "OPEN" },
{
  label: "Process",
  value: "PROCESS"
}, {
  label: "Closed",
  value: "CLOSED"
}];
const callsBookingSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  moduleId: z.string().optional(),
  moduleName: z.string().optional(),
  remark: z.string().optional(),
  assignedUsers: z.string().min(1, "Staff is required"),
  status: z.string().optional(),
  // Only editable during Update (see Assignment section below) — defaults
  // to "Y" automatically on create, same as before.
  active: z.string().optional()
});
type CallsBookingForm = z.infer<typeof callsBookingSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingListItem_Table>[] = [{
  key: "sno",
  header: "Sno",
  render: (row, index) => index + 1
},
// { key: "tktId",       header: "ID",   sortable: true, width: "10px" },

{
  key: "remark",
  header: "Remark",
  width: "100px",
  render: row => <div className={ui("[width:400px] [white-space:normal] [overflow-wrap:anywhere] [word-break:break-word] [line-height:18px]")}>
        {row.remark}
      </div>
}, {
  key: "status",
  header: "Status",
  sortable: true,
  render: row => <CallStatusBadge value={row.status} />
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
  key: "clientMobile",
  header: "Mobile",
  render: row => row.clientMobile as string || "-"
}, {
  key: "clientName",
  header: "Client",
  sortable: true,
  render: row => row.clientName as string || "-"
}, {
  key: "projectName",
  header: "Project",
  sortable: true
}, {
  key: "moduleName",
  header: "Module",
  sortable: true
}, {
  key: "assignedUsers",
  header: "Staff",
  sortable: true
}, {
  key: "tktDate",
  header: "Date",
  sortable: true,
  render: row => row.tktDate ? new Date(row.tktDate as string).toLocaleDateString() : "-"
}, {
  key: "active",
  header: "Active",
  render: row => <span style={{
    background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
    color: row.active === "Y" ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
}, {
  key: "statusRemark",
  header: "Status Remark",
  render: row => <div className={ui("[width:300px] [white-space:normal] [overflow-wrap:anywhere] [word-break:break-word] [line-height:18px]")}>
        {row.statusRemark}
      </div>
}];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  clientId: 0,
  projectId: "",
  projectName: "",
  moduleId: "",
  moduleName: "",
  remark: "",
  assignedUsers: "",
  status: "P"
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  const today = new Date().toISOString().split("T")[0];
  usePageHeader({
    title: "Calls Booking",
    subtitle: "Manage calls & task assignments"
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

  const [appliedFilters, setAppliedFilters] = useState({
    asOn: false,
    asOnDate: today,
    fromDate: today,
    toDate: today,
    userId: "",
    clientId: "",
    projectId: "",
    moduleId: "",
    status: ""
  });
  const [searchFilters, setSearchFilters] = useState(appliedFilters);
  const isClientUser = typeof window !== "undefined" && localStorage.getItem("isClient") === "Y";
  const myClientId = isClientUser ? Number(localStorage.getItem("clientId") || 0) || 0 : 0;
  const {
    data: companies = []
  } = useCompanyList();
  const {
    data: clients = []
  } = useClientList();
  const {
    data: projects = []
  } = useProjectList();
  const {
    data: modules = []
  } = useModuleList();
  const {
    data: staffList = []
  } = useGetAllUsers();
  const {
    data: pagedBookings,
    isLoading
  } = useCallsBookingList(searchFilters);
  const bookings = pagedBookings?.content ?? [];
  console.log(bookings, 'bookings');
  const {
    data: viewData,
    isLoading: viewLoading
  } = useGetCallsBookingById(viewId ?? "");

  // Call status history for the ticket currently being previewed
  const {
    data: statusHistory = [],
    isLoading: statusHistoryLoading
  } = useCallStatusHistory(viewData?.tktId ?? null);
  const createMutation = useCreateCallsBooking();
  const createStatusMutation = useCreateCallStatus();
  const updateMutation = useUpdateCallsBooking();
  const deleteMutation = useDeleteCallsBooking();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const handleChange = (field: string, value: any) => {
    setAppliedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleApplyFilters = () => {
    setSearchFilters({
      ...appliedFilters
    });
  };
  const handleResetFilters = () => {
    setAppliedFilters({
      asOn: false,
      asOnDate: today,
      fromDate: today,
      toDate: today,
      userId: "",
      clientId: "",
      projectId: "",
      moduleId: "",
      status: ""
    });
  };
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: {
      errors
    }
  } = useForm<CallsBookingForm>({
    resolver: zodResolver(callsBookingSchema),
    defaultValues: DEFAULTS
  });
  const {
    control: statusControl,
    handleSubmit: statusSubmit,
    reset: statusReset,
    formState: {
      errors: statusError
    }
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: DEFAULTS
  });

  // Enter-to-next-field navigation for the Add/Edit Booking form.
  const {
    register: registerField,
    focusNext
  } = useEnterNavigation(["clientId", "projectId", "moduleId", "assignedUsers", "status", "remark"], () => handleSubmit(onSubmit)());
  const watchedProjectId = useWatch({
    control,
    name: "projectId"
  });
  const watchedModuleId = useWatch({
    control,
    name: "moduleId"
  });

  // Company is no longer a visible field — every booking is created under
  // the (single) company on file, applied silently at submit time.
  const defaultCompId = companies[0]?.COMPID ?? 0;

  // Auto-fill projectName when projectId changes
  useEffect(() => {
    const p = projects.find(p => String(p.projectId) === String(watchedProjectId));
    if (p) setValue("projectName", p.projectName ?? "");
  }, [watchedProjectId, projects]);

  // Auto-fill moduleName when moduleId changes
  useEffect(() => {
    const m = modules.find(m => String(m.moduleId) === String(watchedModuleId));
    if (m) setValue("moduleName", m.moduleName ?? "");
  }, [watchedModuleId, modules]);
  const clientItems = clients.map(c => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID)
  }));
  const projectItems = projects.map(p => ({
    label: p.projectName,
    value: String(p.projectId)
  }));
  const moduleItems = modules.map(m => ({
    label: m.moduleName,
    value: String(m.moduleId)
  }));
  const staffItems = staffList.map(s => ({
    label: s.USERNAME ?? "",
    value: String(s.USERID)
  }));
  const statusItems = [{
    label: "Pending",
    value: "P"
  }, {
    label: "Completed",
    value: "C"
  }, {
    label: "Both",
    value: "B"
  }];

  // ── List filters (toolbar) ──
  // Staff filter defaults to the logged-in user's own id so the list
  // opens scoped to "my bookings"; "All Staff" clears it back to everyone.
  const staffFilterItems = [{
    label: "All Staff",
    value: ""
  }, ...staffItems];
  const clientFilterItems = [{
    label: "All Clients",
    value: ""
  }, ...clientItems];

  // ── Summary counts (Total / Completed / Processing) ──
  // Reflects whatever is currently in filteredBookings — i.e. the date
  // range/As On filter (server-side) plus the staff/client/status filters
  // (client-side) applied on top of it.
  const summaryTotal = pagedBookings?.numberOfElements;
  const summaryCompleted = bookings.filter(row => row.status === "C").length;
  const summaryProcessing = bookings.filter(row => row.status === "P").length;

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(isClientUser ? {
      ...DEFAULTS,
      clientId: myClientId
    } : DEFAULTS);
    setMedia(prev => {
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
        projectId: r.projectId || "",
        projectName: r.projectName || "",
        moduleId: r.moduleId || "",
        moduleName: r.moduleName || "",
        remark: r.remark || "",
        assignedUsers: r.assignedUsers || "",
        status: r.status || "",
        active: r.active === "N" ? "N" : "Y"
      });
      setMedia(prev => {
        revokeMediaItems(prev);
        return (r.media ?? []).map(m => makeExistingMediaItem(m, process.env.NEXT_PUBLIC_IMAGE_URL ?? ""));
      });
      setOpen(true);
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to load booking details.");
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
    const keptMedia = media.filter(m => m.isExisting || m.active);
    const newFiles = keptMedia.filter(m => !m.isExisting && m.file).map(m => m.file as File);
    const mediaMeta = keptMedia.map((m, idx) => ({
      id: m.isExisting ? m.id ?? null : null,
      displayOrder: idx,
      active: m.active
    }));

    // Company is no longer a form field — every booking is filed under the
    // company on record, applied here automatically. Active is only
    // editable during Update (see the Assignment section); on create it
    // isn't shown at all and defaults to "Y".
    const payload = {
      ...data,
      compId: editRow?.compId ?? defaultCompId,
      active: editRow ? data.active ?? editRow.active ?? "Y" : "Y"
    };
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload,
          media: newFiles,
          mediaMeta
        });
        toast.success("Booking Updated", `"${res.tktId}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({
          payload,
          media: newFiles,
          mediaMeta
        });
        toast.success("Booking Created", `"${res.tktId}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
      setMedia(prev => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };
  const onStatusSubmit = async (values: StatusForm) => {
    if (!tokenId) return "";
    console.log(tokenId, values, 'payloadstatus');
    try {
      await createStatusMutation.mutateAsync({
        payload: {
          tktId: tokenId,
          STATUS: values.STATUS,
          remark: values.remark
        },
        media: media.map(m => m.file).filter(Boolean) as File[]
      });
      toast.success("Status Added", "Call status entry created successfully.");
      setAddOpen(false);
      statusReset(DEFAULTS_STATUS);
      setMedia(prev => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error("Save Failed", err?.response?.data?.message || err?.message || "Failed to save status.");
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success("Booking Deleted", `Ticket "${deleteRow.tktId}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      }
    });
  };

  // ─────────────────────────

  // ── Detail view (full page replace) ──
  if (viewId !== null) {
    const v = viewData;
    return <>
        

        <div className={ui("cb-detail-wrap")}>
          <div className={ui("cb-detail-head")}>
            <div>
              <div className={ui("cb-detail-title")}>Booking Details</div>
              <div className={ui("cb-detail-sub")}>Ticket ID: {v?.tktId ?? viewId}</div>
            </div>
            <button className={ui("cb-back-btn")} onClick={() => setViewId(null)}>
              ← Back to List
            </button>
          </div>

          <div className={ui("cb-detail-body")}>
            {viewLoading ? <div className={ui("[padding:48px] [text-align:center] [color:var(--text-muted)]")}>Loading...</div> : v ? <>
                <div className={ui("cb-detail-grid")}>
                  {([["Ticket ID", v.tktId], ["Ticket Date", v.tktDate ? new Date(v.tktDate as string).toLocaleString() : "—"], ["Client", v.clientName], ["Project", v.projectName], ["Module", v.moduleName], ["Staff", v.userMap ? Object.values(v.userMap).join(", ") : v.assignedUsers], ["Status", v.status], ["Active", v.active === "Y" ? "Active" : "Inactive"], ["Remark", v.remark], ["Cancelled", v.cancel], ["Cancel By", v.cancelBy], ["Updated", v.updated]] as [string, unknown][]).map(([label, val]) => <div key={label} className={ui("cb-detail-row")}>
                      <span className={ui("cb-detail-label")}>{label}</span>
                      <span className={ui("cb-detail-val")}>{String(val ?? "—")}</span>
                    </div>)}
                </div>

                {v.media && v.media.length > 0 && <>
                    <div className={ui("cb-detail-section-label")}>Media</div>
                    <div className={ui("cb-media-grid")}>
                      {v.media.map((m, idx) => {
                  const type = (m.mediaType ?? "").toUpperCase();
                  return (
                    // NOTE: m.mediaId is a shared group id (same across every
                    // file in this booking), not unique per item — key on idx.
                    <div key={idx} className={ui("cb-media-tile")}>
                          {type.startsWith("IMAGE") ? <img src={ResolveImage(m.mediaUrl)} alt={`media-${idx}`} onClick={() => setLightbox({
                        items: v.media as LightboxItem[],
                        index: idx
                      })} className={ui("[width:100%] [height:90px] [object-fit:cover] [cursor:pointer]")} /> : type.startsWith("VIDEO") ? <video src={ResolveImage(m.mediaUrl)} controls className={ui("[width:100%] [height:90px] [object-fit:cover]")} /> : <a href={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`} target="_blank" rel="noreferrer" className={ui("[display:flex] [align-items:center] [justify-content:center] [height:90px] [font-size:var(--font-xs)] [color:#34445d]")}>
                              Open file
                            </a>}
                          <div style={{
                        color: m.active === false ? COLORS.textMuted : COLORS.textSecondary
                      }} className={ui("[font-size:var(--font-xs)] [padding:4px] [text-align:center]")}>
                            {m.active === false ? "Inactive" : "Active"}
                          </div>
                        </div>
                  );
                })}
                    </div>
                  </>}

                <div className={ui("cb-detail-section-label")}>Call Status History</div>

                {statusHistoryLoading ? <div className={ui("[padding:16px] [color:var(--text-muted)] [font-size:var(--font-sm)]")}>Loading...</div> : statusHistory.length === 0 ? <div className={ui("[padding:16px] [color:var(--text-muted)] [font-size:var(--font-sm)]")}>No status updates yet.</div> : <div className={ui("[display:flex] [flex-direction:column] [gap:10px]")}>
                    {statusHistory.map(s => {
                const label = s.STATUS ?? "—";
                const bg = label === "CLOSED" || label === "C" ? COLORS.errorBg : label === "PROCESS" || label === "I" ? COLORS.warningBg : COLORS.successBg;
                const color = label === "CLOSED" || label === "C" ? COLORS.error : label === "PROCESS" || label === "I" ? COLORS.warning : COLORS.success;
                return <div key={s.sno} style={{
                  border: `1px solid ${COLORS.cardBorder}`
                }} className={ui("[border-radius:10px] [padding:10px] [background:var(--surface)]")}>
                          <div className={ui("[display:flex] [align-items:center] [justify-content:space-between] [margin-bottom:6px]")}>
                            <span style={{
                      background: bg,
                      color
                    }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
                              {label}
                            </span>
                            <span className={ui("[font-size:var(--font-xs)] [color:var(--text-muted)]")}>
                              {s.UPDATED ? new Date(s.UPDATED).toLocaleString() : "—"}
                            </span>
                          </div>

                          <div className={ui("[font-size:var(--font-sm)] [color:#34445d] [margin-bottom:4px]")}>
                            By <b className={ui("[color:var(--text-main)]")}>{s.userName ?? s.userId ?? "—"}</b>
                          </div>

                          {s.remark && <div className={ui("[font-size:var(--font-sm)] [color:var(--text-main)] [margin-bottom:6px]")}>{s.remark}</div>}

                          {(s.media && s.media.length > 0 || s.IMAGE) && (() => {
                    const historyMedia = s.media && s.media.length > 0 ? s.media : [{
                      mediaUrl: s.IMAGE,
                      mediaType: "IMAGE",
                      active: true
                    }];
                    return <div className={ui("cb-media-grid")}>
                              {historyMedia.map((m, idx) => {
                        const type = (m.mediaType ?? "").toUpperCase();
                        return <div key={idx} className={ui("cb-media-tile")}>
                                    {type.startsWith("IMAGE") ? <img src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`} alt={`status-media-${idx}`} onClick={() => setLightbox({
                            items: historyMedia as LightboxItem[],
                            index: idx
                          })} className={ui("[width:100%] [height:90px] [object-fit:cover] [cursor:pointer]")} /> : type.startsWith("VIDEO") ? <video src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`} controls className={ui("[width:100%] [height:90px] [object-fit:cover]")} /> : <a href={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`} target="_blank" rel="noreferrer" className={ui("[display:flex] [align-items:center] [justify-content:center] [height:90px] [font-size:var(--font-xs)] [color:#34445d]")}>
                                        Open file
                                      </a>}
                                  </div>;
                      })}
                            </div>;
                  })()}
                        </div>;
              })}
                  </div>}
              </> : <div className={ui("[padding:48px] [text-align:center] [color:var(--text-muted)]")}>Booking not found.</div>}
          </div>
        </div>

        {lightbox && <MediaLightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(prev => prev ? {
        ...prev,
        index: i
      } : prev)} />}
      </>;
  }

  // ─────────────────────────

  return <>
      
      <Box>
        {/* Summary Tiles */}
        <Flex className={ui("[gap:12px]! [margin-bottom:12px]! [flex-wrap:wrap]!")}>
          {[{
          label: "Calls Total Listed",
          value: summaryTotal,
          bg: COLORS.gray50,
          color: COLORS.textPrimary
        }, {
          label: "Calls Completed",
          value: summaryCompleted,
          bg: COLORS.successBg,
          color: COLORS.success
        }, {
          label: "Calls Processing",
          value: summaryProcessing,
          bg: COLORS.warningBg,
          color: COLORS.warning
        }].map(tile => <Box key={tile.label} bg={tile.bg} className={ui("[flex:1_1_160px]! [min-width:160px]! border! border-solid! [border-color:var(--border)]! [border-radius:14px]! [padding-left:16px]! [padding-right:16px]! [padding-top:10px]! [padding-bottom:10px]!")}>
              <Text className={ui("[font-size:var(--font-xs)]! [color:var(--text-muted)]! font-normal! [text-transform:uppercase]! [letter-spacing:0.05em]!")}>
                {tile.label}
              </Text>

              <Text color={tile.color} className={ui("[font-size:22px]! font-normal! [margin-top:2px]!")}>
                {tile.value}
              </Text>
            </Box>)}
        </Flex>
      </Box>
      {/* Filter */}
      <Box className={ui("workspace-filterbar" + " " + "[background:white]! border! border-solid! [border-color:#E5E7EB]! [border-radius:12px]! [padding:12px]! md:[padding:14px]! [margin-bottom:12px]! shadow-sm!")}>
        <Flex className={ui("[gap:12px]! [align-items:flex-end]! [flex-wrap:wrap]!")}>
          {/* As On */}
          <VStack spaceX="4px" className={ui("[align-items:stretch]! [min-width:100px]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              As On
            </Text>

            <SwitchInput value={appliedFilters.asOn} onChange={val => {
            setAppliedFilters(prev => ({
              ...prev,
              asOn: val,
              asOnDate: today
            }));
          }} trueValue={true} falseValue={false} labels={{
            on: "On",
            off: "Off"
          }} size="sm" />
          </VStack>

          {/* Date Filters */}
          {appliedFilters.asOn ? <VStack spaceX="4px" className={ui("[align-items:stretch]!")}>
              <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
                Date
              </Text>

              <DatePickerInput value={appliedFilters.asOnDate || null} onChange={val => handleChange("asOnDate", val)} placeholder="Select date" className={ui("[max-width:150px]!")} />
            </VStack> : <>
              <VStack spaceX="4px" className={ui("[align-items:stretch]!")}>
                <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
                  From Date
                </Text>

                <DatePickerInput value={appliedFilters.fromDate} onChange={val => handleChange("fromDate", val)} placeholder="From date" maxDate={appliedFilters.toDate || today} className={ui("[max-width:150px]!")} />
              </VStack>

              <VStack spaceX="4px" className={ui("[align-items:stretch]!")}>
                <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
                  To Date
                </Text>

                <DatePickerInput value={appliedFilters.toDate || null} onChange={val => handleChange("toDate", val)} placeholder="To date" minDate={appliedFilters.fromDate || undefined} maxDate={today} className={ui("[max-width:150px]!")} />
              </VStack>
            </>}

          {/* Staff */}
          <VStack spaceX="4px" className={ui("[align-items:stretch]! [min-width:150px]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              Staff
            </Text>

            <SelectCombobox value={appliedFilters.userId || undefined} onChange={val => handleChange("userId", val)} items={staffFilterItems} placeholder="Select staff" size="sm" label="" className={ui("[max-width:180px]! [font-size:var(--font-sm)]!")} />
          </VStack>

          {/* Client */}
          <VStack spaceX="4px" className={ui("[align-items:stretch]! [min-width:200px]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              Client
            </Text>

            <SelectCombobox value={appliedFilters.clientId || undefined} onChange={val => handleChange("clientId", val)} items={clientFilterItems} placeholder="Select client" size="sm" label="" className={ui("[max-width:250px]! [min-width:200px]! [font-size:var(--font-sm)]!")} />
          </VStack>
          <VStack spaceX="4px" className={ui("[align-items:stretch]! [min-width:200px]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              Project
            </Text>
                  <SelectCombobox value={appliedFilters.projectId} onChange={val => handleChange("projectId", val)} items={projectItems} placeholder="Select project" size="md" className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />
          </VStack>
          <VStack spaceX="4px" className={ui("[align-items:stretch]! [min-width:200px]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              Module
            </Text>
            <SelectCombobox value={appliedFilters.moduleId} onChange={val => handleChange("moduleId", val)} items={moduleItems} placeholder="Select module" size="md" className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />
          </VStack>

          {/* Status */}
          <VStack spaceX="4px" className={ui("[align-items:stretch]!")}>
            <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--color-gray-700)]!")}>
              Status
            </Text>

            <NativeSelectWrapper value={appliedFilters.status} onChange={e => handleChange("status", e.target.value)} items={statusItems} css={{
            bg: "white",
            border: "1px solid",
            borderColor: "#D1D5DB",
            borderRadius: "6px"
          }} className={ui("[max-width:140px]!")} />
          </VStack>

          {/* Actions */}
          <HStack spaceX="8px" className={ui("ml-auto! max-sm:ml-0! max-sm:w-full! max-sm:flex-wrap!")}>
            {/* Reset */}
            <Button size="sm" variant="outline" onClick={handleResetFilters} _hover={{
            bg: "gray.50"
          }} className={ui("[border-color:#D1D5DB]! [color:var(--color-gray-700)]!")}>
              <RotateCcw size={14} /> Reset
            </Button>

            {/* Apply */}
            <Button size="sm" _hover={{
            bg: COLORS.primaryHover
          }} onClick={handleApplyFilters} className={ui("[background:var(--primary)]! [color:white]!")}>
              <Search size={14} />Apply
            </Button>

            {/* Add Booking */}
            <Button size="sm" _hover={{
            bg: COLORS.primaryHover
          }} onClick={openCreate} className={ui("[background:var(--primary)]! [color:white]!")}>
              <Plus size={14} /> Add Booking
            </Button>
          </HStack>
        </Flex>
      </Box>

      <CustomTable
    // title="All Calls Bookings"
    showSearch={false} columns={COLUMNS} data={bookings as CallsBookingListItem_Table[]} rowKey="sno" isLoading={isLoading} onEdit={openEdit}
    // onDelete={(row) =>
    //   setDeleteRow(row)
    // }
    extraActions={[{
      label: "View Details",
      icon: <Eye size={13} />,
      onClick: openView
    }, {
      label: "View Details",
      icon: <Plus size={13} />,
      onClick: row => {
        statusReset(DEFAULTS_STATUS);
        setMedia(prev => {
          revokeMediaItems(prev);
          return [];
        });
        setTokenId(row.tktId);
        setAddOpen(true);
      }
    }]}
    // searchPlaceholder="Search ticket, project, module..."
    // emptyMessage="No bookings found."
    />

      {/* Modal */}

      {open && <div className={ui("cb-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("cb-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Booking and call details">
            <div className={ui("cb-modal-head")}>
              <div>
                <div className={ui("cb-modal-title")}>
                  {editRow ? "Edit Booking" : "Add Booking"}
                </div>

                <div className={ui("cb-modal-sub")}>
                  {editRow ? `Editing Ticket: ${editRow.tktId}` : "Fill booking details"}
                </div>
              </div>

              <button className={ui("cb-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("cb-modal-body")}>
                <div className={ui("cb-section-label")}>
                  Basic Information
                </div>

                <div className={ui("cb-grid-2 workspace-form-grid")}>
                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Client *</label>
                    <Controller name="clientId" control={control} render={({
                  field
                }) => <SelectCombobox ref={registerField("clientId")} value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? Number(val) : 0)} onEnter={() => focusNext("clientId")} editId={editRow?.sno ?? null} items={clientItems} placeholder="Select client" size="md" disable={isClientUser} className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />} />
                    {errors.clientId && <span className={ui("cb-field-error")}>{errors.clientId.message}</span>}
                  </div>

                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Project</label>
                    <Controller name="projectId" control={control} render={({
                  field
                }) => <SelectCombobox ref={registerField("projectId")} value={field.value || undefined} onChange={val => field.onChange(val)} onEnter={() => focusNext("projectId")} editId={editRow?.sno ?? null} items={projectItems} placeholder="Select project" size="md" className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />} />
                    {errors.projectId && <span className={ui("cb-field-error")}>{errors.projectId.message}</span>}
                  </div>

                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Module</label>
                    <Controller name="moduleId" control={control} render={({
                  field
                }) => <SelectCombobox ref={registerField("moduleId")} value={field.value || undefined} onChange={val => field.onChange(val)} onEnter={() => focusNext("moduleId")} editId={editRow?.sno ?? null} items={moduleItems} placeholder="Select module" size="md" className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />} />
                    {errors.moduleId && <span className={ui("cb-field-error")}>{errors.moduleId.message}</span>}
                  </div>
                </div>

                <div className={ui("cb-section-label")}>
                  Assignment
                </div>

                <div className={ui("cb-grid-2 workspace-form-grid")}>
                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Staff *</label>
                    <Controller name="assignedUsers" control={control} render={({
                  field
                }) => <MultiSelectCombobox ref={registerField("assignedUsers")} value={field.value ? field.value.split(",").filter(Boolean) : []} onChange={vals => field.onChange(vals.join(","))} onEnter={() => focusNext("assignedUsers")} editId={editRow?.sno ?? null} items={staffItems} placeholder="Select staff" size="md" className={ui("[max-width:100%]! [font-size:var(--font-sm)]!")} />} />
                    {errors.assignedUsers && <span className={ui("cb-field-error")}>{errors.assignedUsers.message}</span>}
                  </div>

                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Status</label>
                    <Controller name="status" control={control} render={({
                  field
                }) => <>
                         
                          <NativeSelectWrapper ref={registerField("status")} value={field.value ?? ""} onChange={e => {
                    field.onChange(e);
                  }} onEnter={() => focusNext("status")} items={statusItems} css={{
                    border: "1px solid #DDD",
                    bg: "#EEE",
                    color: "#222",
                    fontSize: "14px"
                  }} />
                        </>} />
                    {errors.status && <span className={ui("cb-field-error")}>{errors.status.message}</span>}
                  </div>

                  {/* Active is only editable during Update — on create it
                      defaults to "Y" automatically and isn't shown. */}
                  {editRow && <div className={ui("cb-field-row")}>
                      <label className={ui("cb-field-label")}>Active</label>
                      <Controller name="active" control={control} render={({
                  field
                }) => <SwitchInput value={field.value === "N" ? "N" : "Y"} onChange={field.onChange} trueValue="Y" falseValue="N" labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                      {errors.active && <span className={ui("cb-field-error")}>{errors.active.message}</span>}
                    </div>}
                </div>

                <div className={ui("cb-section-label")}>
                  Details
                </div>

                <div className={ui("cb-grid-2 workspace-form-grid")}>
                  <div className={ui("cb-field-row")}>
                    <label className={ui("cb-field-label")}>Remark</label>
                    <Controller name="remark" control={control} render={({
                  field
                }) => <TextareaField inputRef={registerField("remark")} value={field.value} field="remark" onChange={(_, value) => field.onChange(value)} onEnter={() => focusNext("remark")} placeholder="Enter remarks" mode="inline" />} />
                    {errors.remark && <span className={ui("cb-field-error")}>{errors.remark.message}</span>}
                  </div>
                </div>

                <div className={ui("cb-section-label")}>
                  Media
                </div>

                <div className={ui("cb-field-row")}>
                  <label className={ui("cb-field-label")}>Attachments</label>
                  <MediaManager value={media} onChange={setMedia} accept="image/*,video/*,application/pdf,.doc,.docx" maxFiles={10} onError={msg => toast.error("Error", msg)} />
                </div>
              </div>

              <div className={ui("cb-modal-footer")}>
                <button type="button" className={ui("cb-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className={ui("cb-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />

                  {isPending ? "Saving..." : editRow ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>}

          {/* Add Status Modal */}
              {addOpen && <div className={ui("cs-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
                  <div className={ui("cs-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Booking and call details">
                    <div className={ui("callstatus-head" + " " + "[display:flex] [padding:10px] [justify-content:space-between] [align-items:center]")}>
                      <div>
                        <div className={ui("cs-title")}>Add Status</div>
                        <div className={ui("cs-sub")}>Ticket:</div>
                      </div>
                      <button className={ui("cs-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setAddOpen(false)}>✕</button>
                    </div>
      
                  <form onSubmit={statusSubmit(onStatusSubmit)}>
                      <div className={ui("cs-modal-body")}>
                        <div className={ui("cs-field-row")}>
                          <label className={ui("cs-field-label")}>Status *</label>
                          <Controller name="STATUS" control={statusControl} render={({
                field
              }) => <>
                                
      
                                <NativeSelectWrapper value={field.value} onChange={e => field.onChange(e.target.value.toUpperCase())} items={STATUS_ITEMS} css={{
                  fontSize: "14px",
                  background: "#ddd",
                  color: "#222"
                }} className={ui("[min-width:150px]!")} />
                              </>} />
                  {statusError.STATUS && <span className={ui("cs-field-error")}>{statusError.STATUS.message}</span>}
                        </div>
      
                        <div className={ui("cs-field-row")}>
                          <label className={ui("cs-field-label")}>Remark</label>
                          <Controller name="remark" control={statusControl} render={({
                field
              }) => <TextareaField value={field.value} field="remark" onChange={(_, value) => field.onChange(value)} placeholder="Enter remark" mode="inline" rows={3} />} />
                          {errors.remark && <span className={ui("cs-field-error")}>{errors.remark.message}</span>}
                        </div>
      
                        <div className={ui("cs-field-row")}>
                          <label className={ui("cs-field-label")}>Media (image/video)</label>
                          <MediaManager value={statusMedia} onChange={setStatusMedia} accept="image/*,video/*" maxFiles={10} onError={msg => toast.error("Error", msg)} />
                        </div>
                      </div>
      
                      <div className={ui("callstatus-modal-footer" + " " + "[display:flex] [align-items:center] [justify-content:end]")}>
                        <button type="button" className={ui("cs-btn-secondary")} onClick={() => setAddOpen(false)}>
                          Cancel
                        </button>
                <button type="submit" className={ui("cb-btn-primary")} disabled={createStatusMutation.isPending}>
                          <Pencil size={12} />
                          {createStatusMutation.isPending ? "Saving..." : "Save Status"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>}

      {/* Delete Confirm */}

      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete ticket "${deleteRow?.tktId}"?`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
