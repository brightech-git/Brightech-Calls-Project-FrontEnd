"use client";

import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Eye } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { MultiSelectCombobox } from "@/components/ui/MultiSelectCombobox";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { MediaManager, MediaItem, revokeMediaItems, makeExistingMediaItem } from "@/components/ui/MediaManager";
import { MediaLightbox, LightboxItem } from "@/components/ui/MediaLightbox";

import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { useEnterNavigation } from "@/components/form/useEnterNavigation";

import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useCallsBookingList,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useDeleteCallsBooking,
  useGetCallsBookingById,
} from "@/hooks/TaskAssignment/useTaskAssignment";

import { useCreateCallStatus } from "@/hooks/CallStatus/useCallStatus";
import { getCallsBookingById } from "@/services/TaskAssignmentService";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";
import { useClientList }  from "@/hooks/ClientMaster/useClientMaster";
import { useProjectList } from "@/hooks/ProjectMaster/useProjectMaster";
import { useModuleList }  from "@/hooks/ModuleMaster/useModuleMaster";
import { useGetAllUsers } from "@/hooks/Auth/useAuth";
import { useCallStatusHistory } from "@/hooks/CallStatus/useCallStatus";

import {
  CallsBookingRecord,
  CallsBookingListItem_Table,
} from "@/types/TaskAssignment/TaskAssignment";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import { ResolveImage } from "@/utils/format/resolveImage";
import { Text } from "@chakra-ui/react";
// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────


const statusSchema = z.object({
  STATUS: z.string().min(1, "Status is required"),
  remark: z.string().optional(),
});

type StatusForm = z.infer<typeof statusSchema>;

const DEFAULTS_STATUS: StatusForm = {
  STATUS: "OPEN",
  remark: "",
};

const STATUS_ITEMS = [
  { label: "Open", value: "OPEN" },
  { label: "Process", value: "PROCESS" },
  { label: "Closed", value: "CLOSED" },
];

const callsBookingSchema = z.object({
  clientId:      z.number().min(1, "Client is required"),
  projectId:     z.string().optional(),
  projectName:   z.string().optional(),
  moduleId:      z.string().optional(),
  moduleName:    z.string().optional(),
  remark:        z.string().optional(),
  assignedUsers: z.string().min(1, "Staff is required"),
  status:        z.string().optional(),
  // Only editable during Update (see Assignment section below) — defaults
  // to "Y" automatically on create, same as before.
  active:        z.string().optional(),
});

type CallsBookingForm = z.infer<typeof callsBookingSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingListItem_Table>[] = [
  { key: "tktId",       header: "ID",   sortable: true, width: "10px" },
  { key: "clientName",  header: "Client",      sortable: true, render: (row) => (row.clientName as string) || "-" },
  { key: "clientMobile",  header: "Mobile",      render: (row) => (row.clientMobile as string) || "-" },
  {
    key: "remark",
    header: "Remark",
    width: "100px",
    render: (row) => (
      <div
        style={{
          width: "150px",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          lineHeight: "18px",
        }}
      >
        {row.remark}
      </div>
    ),
  },
  { key: "bookingMedia", header: "Calls Media", render: (row) => {
    const image = typeof row?.bookingMedia === "string"
      ? JSON.parse(row.bookingMedia)
      :[];
    console.log(image,'mediaimage');
    return image?.length > 0 ? image.map((i:any)=>{

      if (i.MEDIA_TYPE === "IMAGE"){
        return <img src={ResolveImage(i.MEDIA_URL)}  alt="image" />
      }
      else{
        return <video src={ResolveImage(i.MEDIA_URL)} autoPlay/>
      }
    })  : ""
   }},

  {
    key: "statusRemark", header: "Status Remark", render: (row) => (
      <div
        style={{
          width: "150px",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          lineHeight: "18px",
        }}
      >
        {row.statusRemark}
      </div>
    ),
},
  {
    key: "statusMedia", header: "Status Media", render: (row) => {
      const image = typeof row?.bookingMedia === "string"
        ? JSON.parse(row.bookingMedia)
        : [];
      console.log(image, 'mediaimage');
      return image?.length > 0 ? image.map((i: any) => {

        if (i.MEDIA_TYPE === "IMAGE") {
          return <img src={ResolveImage(i.MEDIA_URL)} alt="image" />
        }
        else {
          return <video src={ResolveImage(i.MEDIA_URL)} autoPlay />
        }
      }) : ""
    }
},
  { key: "projectName", header: "Project",     sortable: true },
  { key: "moduleName",  header: "Module",      sortable: true },
  { key: "assignedUsers", header: "Staff",     sortable: true },
  { key: "tktDate",     header: "Date",        sortable: true, render: (row) => row.tktDate ? new Date(row.tktDate as string).toLocaleDateString() : "-" },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      const status = row.status === "P" ? "PENDING" :row.status === "C" ? "COMPLETED" : "BOTH";
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: FONT.size.xs}}>{status}</span>;
    },
  },
  {
    key: "active",
    header: "Active",
    render: (row) => (
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: FONT.size.xs, fontWeight: 600,
        background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
        color: row.active === "Y" ? COLORS.success : COLORS.error,
      }}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  clientId:      0,
  projectId:     "",
  projectName:   "",
  moduleId:      "",
  moduleName:    "",
  remark:        "",
  assignedUsers: "",
  status:        "P",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  usePageHeader({
    title: "Calls Booking",
    subtitle:
      "Manage calls & task assignments",
  });

  const toast = useToast();

  const [open, setOpen] =
    useState(false);

  const [addOpen, setAddOpen] = useState(false);

  const [editRow, setEditRow] =
    useState<CallsBookingRecord | null>(
      null
    );

  const [deleteRow, setDeleteRow] =
    useState<CallsBookingListItem_Table | null>(
      null
    );

  const [media, setMedia] =
    useState<MediaItem[]>([]);

  const [statusMedia ,setStatusMedia] = useState<MediaItem[]>([])

  const [editLoading, setEditLoading] =
    useState(false);

  const [viewId, setViewId] =
    useState<string | null>(null);

  const [tokenId ,setTokenId] =useState<number|null>();

  const [lightbox, setLightbox] =
    useState<{ items: LightboxItem[]; index: number } | null>(null);

  // CLIENT-ACCOUNT SCOPING - WHEN THE LOGGED-IN USER IS A CLIENT (isClient
  // "Y" IN localStorage, SET AT LOGIN), THE CLIENT FIELD IS PRESET TO THEIR
  // OWN CLIENTID AND LOCKED SO THEY CAN'T PICK/SEE ANY OTHER CLIENT'S NAME.
  // THE ACTUAL DATA SCOPING IS ENFORCED SERVER-SIDE; THIS IS DEFENSE-IN-DEPTH
  // MATCHING THE UI TO THAT RESTRICTION.
  const isClientUser =
    typeof window !== "undefined" && localStorage.getItem("isClient") === "Y";
  const myClientId = isClientUser
    ? Number(localStorage.getItem("clientId") || 0) || 0
    : 0;

  const { data: companies = [] } = useCompanyList();
  const { data: clients   = [] } = useClientList();
  const { data: projects  = [] } = useProjectList();
  const { data: modules   = [] } = useModuleList();
  const { data: staffList = [] } = useGetAllUsers();

  const {
    data: pagedBookings,
    isLoading,
  } = useCallsBookingList();

  const bookings = pagedBookings?.content ?? [];

  const {
    data: viewData,
    isLoading: viewLoading,
  } = useGetCallsBookingById(viewId ?? "");

  // Call status history for the ticket currently being previewed
  const {
    data: statusHistory = [],
    isLoading: statusHistoryLoading,
  } = useCallStatusHistory(viewData?.tktId ?? null);

  const createMutation =
    useCreateCallsBooking();

     const createStatusMutation = useCreateCallStatus();

  const updateMutation =
    useUpdateCallsBooking();

  const deleteMutation =
    useDeleteCallsBooking();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

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
      control:statusControl,
      handleSubmit:statusSubmit,
      reset:statusReset,
      formState: { errors:statusError },
    } = useForm<StatusForm>({
      resolver: zodResolver(statusSchema),
      defaultValues: DEFAULTS,
    });

  // Enter-to-next-field navigation for the Add/Edit Booking form.
  const { register: registerField, focusNext } = useEnterNavigation(
    ["clientId", "projectId", "moduleId", "assignedUsers", "status", "remark"],
    () => handleSubmit(onSubmit)()
  );

  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedModuleId  = useWatch({ control, name: "moduleId" });

  // Company is no longer a visible field — every booking is created under
  // the (single) company on file, applied silently at submit time.
  const defaultCompId = companies[0]?.COMPID ?? 0;

  // Auto-fill projectName when projectId changes
  useEffect(() => {
    const p = projects.find((p) => String(p.projectId) === String(watchedProjectId));
    if (p) setValue("projectName", p.projectName ?? "");
  }, [watchedProjectId, projects]);

  // Auto-fill moduleName when moduleId changes
  useEffect(() => {
    const m = modules.find((m) => String(m.moduleId) === String(watchedModuleId));
    if (m) setValue("moduleName", m.moduleName ?? "");
  }, [watchedModuleId, modules]);

  const clientItems  = clients.map((c) => ({ label: c.CLIENTNAME, value: String(c.CLIENTID) }));
  const projectItems = projects.map((p) => ({ label: p.projectName, value: String(p.projectId) }));
  const moduleItems  = modules.map((m) => ({ label: m.moduleName, value: String(m.moduleId) }));
  const staffItems = staffList.map((s) => ({ label: s.USERNAME ?? "", value: String(s.USERID) }));

  const statusItems = [
    { label: "Pending",        value: "P" },
    { label: "Completed", value: "C" },
    { label: "Both",   value: "B" },
  ];

  // ── List filters (toolbar) ──
  // Staff filter defaults to the logged-in user's own id so the list
  // opens scoped to "my bookings"; "All Staff" clears it back to everyone.
  const staffFilterItems  = [{ label: "All Staff",   value: "" }, ...staffItems];
  const clientFilterItems = [{ label: "All Clients", value: "" }, ...clientItems];

  const [filterUserId, setFilterUserId] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("userId") || "" : ""
  );
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("P");

  const filterStaffName  = staffList.find((s) => String(s.USERID) === filterUserId)?.USERNAME;
  const filterClientName = clients.find((c) => String(c.CLIENTID) === filterClientId)?.CLIENTNAME;

  const filteredBookings = bookings.filter((row) => {
    if (filterUserId && filterStaffName) {
      const assigned = String(row.assignedUsers ?? "").split(",").map((n) => n.trim());
      if (!assigned.includes(filterStaffName)) return false;
    }
    if (filterClientId && filterClientName && row.clientName !== filterClientName) return false;
    if (filterStatus && filterStatus !== "B" && row.status !== filterStatus) return false;
    return true;
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(
      isClientUser
        ? { ...DEFAULTS, clientId: myClientId }
        : DEFAULTS
    );
    setMedia((prev) => {
      revokeMediaItems(prev);
      return [];
    });
    setOpen(true);
  };

  const openEdit = async (
    row: CallsBookingListItem_Table
  ) => {
    if (editLoading) return;

    setEditLoading(true);

    try {
      const r = await getCallsBookingById(
        String(row.sno)
      );

      setEditRow(r);

      reset({
        clientId:      r.clientId,
        projectId:     r.projectId    || "",
        projectName:   r.projectName  || "",
        moduleId:      r.moduleId     || "",
        moduleName:    r.moduleName   || "",
        remark:        r.remark       || "",
        assignedUsers: r.assignedUsers || "",
        status:        r.status       || "",
        active:        r.active === "N" ? "N" : "Y",
      });

      setMedia((prev) => {
        revokeMediaItems(prev);
        return (r.media ?? []).map((m) =>
          makeExistingMediaItem(m, process.env.NEXT_PUBLIC_IMAGE_URL ?? "")
        );
      });

      setOpen(true);
    } catch (err: any) {
      toast.error(
        "Error",
        err?.response?.data?.message ||
          "Failed to load booking details."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Eye → open full detail page
  const openView = (
    row: CallsBookingListItem_Table
  ) => {
    setViewId(String(row.sno));
  };

  // ─────────────────────────

  const onSubmit = async (
    data: CallsBookingForm
  )  => {

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
      id: m.isExisting ? m.id ?? null : null,
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
      active: editRow ? (data.active ?? editRow.active ?? "Y") : "Y",
    };

    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync(
            {
              id: String(editRow.sno),
              payload,
              media: newFiles,
              mediaMeta,
            }
          );

        toast.success(
          "Booking Updated",
          `"${res.tktId}" updated successfully.`
        );
      } else {
        const res =
          await createMutation.mutateAsync(
            {
              payload,
              media: newFiles,
              mediaMeta,
            }
          );

        toast.success(
          "Booking Created",
          `"${res.tktId}" created successfully.`
        );
      }

      setOpen(false);

      reset(DEFAULTS);
      setMedia((prev) => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error(
        editRow
          ? "Update Failed"
          : "Create Failed",

        err?.response?.data
          ?.message ||
          err?.message ||
          "Operation failed."
      );
    }
  };


    const onStatusSubmit = async (values: StatusForm) => {
      
      if(!tokenId) return "";
      console.log(tokenId , values ,'payloadstatus');
  
      try {
        await createStatusMutation.mutateAsync({
          payload: {
            tktId: tokenId,
            STATUS: values.STATUS,
            remark: values.remark,
          },
          media: media.map((m) => m.file).filter(Boolean) as File[],
        });
  
        toast.success("Status Added", "Call status entry created successfully.");
        setAddOpen(false);
        statusReset(DEFAULTS_STATUS);
        setMedia((prev) => {
          revokeMediaItems(prev);
          return [];
        });
      } catch (err: any) {
        toast.error(
          "Save Failed",
          err?.response?.data?.message || err?.message || "Failed to save status."
        );
      }
    };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(
      String(deleteRow.sno),

      {
        onSuccess: () => {
          toast.success(
            "Booking Deleted",
            `Ticket "${deleteRow.tktId}" deleted successfully.`
          );

          setDeleteRow(null);
        },

        onError: (err: any) => {
          toast.error(
            "Delete Failed",

            err?.response?.data
              ?.message ||
              "Delete failed."
          );

          setDeleteRow(null);
        },
      }
    );
  };

  // ─────────────────────────

  // ── Detail view (full page replace) ──
  if (viewId !== null) {
    const v = viewData;
    return (
      <>
        <style>{`
          .cb-detail-wrap {
            background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
            border-radius: ${RADIUS.xl}; font-family: ${FONT.family};
            box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          }
          .cb-detail-head {
            padding: 10px 14px; border-bottom: 1px solid ${COLORS.cardBorder};
            display: flex; align-items: center; justify-content: space-between;
            background: ${COLORS.gray50}; border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          }
          .cb-detail-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
          .cb-detail-sub   { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
          .cb-detail-body  { padding: 16px; }
          .cb-detail-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .cb-detail-row {
            display: flex; gap: 8px; padding: 8px 0;
            border-bottom: 1px solid ${COLORS.cardBorder}; font-size: 13px;
          }
               .cs-modal-box { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.xl};
                        width: 100%; max-width: 640px; display: flex; flex-direction: column; font-family: ${FONT.family};
                        box-shadow: 0 8px 32px rgba(0,0,0,0.16); }
          .callstatus-head { display:flex; flexDirection:row; padding: 10px 14px; border-bottom: 1px solid ${COLORS.cardBorder};
            display: flex; align-items: center; justify-content: space-between;
            background: ${COLORS.gray50}; border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0; }
          .cb-detail-row:last-child { border-bottom: none; }
          .cb-detail-label { width: 140px; font-weight: 600; color: ${COLORS.textSecondary}; flex-shrink: 0; font-size: 12px; }
          .cb-detail-val   { color: ${COLORS.textPrimary}; }
          .cb-detail-section-label {
            font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
            color: ${COLORS.textMuted}; padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder};
            margin: 16px 0 8px;
          }
          .cb-media-grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .cb-media-tile {
            width: 120px; border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.md};
            overflow: hidden; background: ${COLORS.cardBg};
          }
          .cb-back-btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 0 14px; height: 32px; border-radius: ${RADIUS.md};
            border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
            color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer;
            font-family: ${FONT.family};
          }
              .callstatus-modal-footer { padding: 8px 14px; border-top: 1px solid ${COLORS.cardBorder}; display: flex;
                        justify-content: flex-end; gap: 8px; background: ${COLORS.gray50}; border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl}; }
          .cb-back-btn:hover { background: ${COLORS.gray50}; }
        `}</style>

        <div className="cb-detail-wrap">
          <div className="cb-detail-head">
            <div>
              <div className="cb-detail-title">Booking Details</div>
              <div className="cb-detail-sub">Ticket ID: {v?.tktId ?? viewId}</div>
            </div>
            <button className="cb-back-btn" onClick={() => setViewId(null)}>
              ← Back to List
            </button>
          </div>

          <div className="cb-detail-body">
            {viewLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>Loading...</div>
            ) : v ? (
              <>
                <div className="cb-detail-grid">
                  {([
                    ["Ticket ID",   v.tktId],
                    ["Ticket Date", v.tktDate ? new Date(v.tktDate as string).toLocaleString() : "—"],
                    ["Client",      v.clientName],
                    ["Project",     v.projectName],
                    ["Module",      v.moduleName],
                    ["Staff",       v.userMap ? Object.values(v.userMap).join(", ") : v.assignedUsers],
                    ["Status",      v.status],
                    ["Active",      v.active === "Y" ? "Active" : "Inactive"],
                    ["Remark",      v.remark],
                    ["Cancelled",   v.cancel],
                    ["Cancel By",   v.cancelBy],
                    ["Updated",     v.updated],
                  ] as [string, unknown][]).map(([label, val]) => (
                    <div key={label} className="cb-detail-row">
                      <span className="cb-detail-label">{label}</span>
                      <span className="cb-detail-val">{String(val ?? "—")}</span>
                    </div>
                  ))}
                </div>

                {v.media && v.media.length > 0 && (
                  <>
                    <div className="cb-detail-section-label">Media</div>
                    <div className="cb-media-grid">
                      {v.media.map((m, idx) => {
                        const type = (m.mediaType ?? "").toUpperCase();
                        return (
                        // NOTE: m.mediaId is a shared group id (same across every
                        // file in this booking), not unique per item — key on idx.
                        <div key={idx} className="cb-media-tile">
                          {type.startsWith("IMAGE") ? (
                            <img
                              src={ResolveImage(m.mediaUrl)}
                              alt={`media-${idx}`}
                              onClick={() => setLightbox({ items: v.media as LightboxItem[], index: idx })}
                              style={{ width: "100%", height: 90, objectFit: "cover", cursor: "pointer" }}
                            />
                          ) : type.startsWith("VIDEO") ? (
                            <video
                              src={ResolveImage(m.mediaUrl)}
                              controls
                              style={{ width: "100%", height: 90, objectFit: "cover" }}
                            />
                          ) : (
                            <a
                              href={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 90, fontSize: FONT.size.xs, color: COLORS.textSecondary }}
                            >
                              Open file
                            </a>
                          )}
                          <div style={{ fontSize: FONT.size.xs, padding: 4, color: m.active === false ? COLORS.textMuted : COLORS.textSecondary, textAlign: "center" }}>
                            {m.active === false ? "Inactive" : "Active"}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="cb-detail-section-label">Call Status History</div>

                {statusHistoryLoading ? (
                  <div style={{ padding: 16, color: COLORS.textMuted, fontSize: FONT.size.sm }}>Loading...</div>
                ) : statusHistory.length === 0 ? (
                  <div style={{ padding: 16, color: COLORS.textMuted, fontSize: FONT.size.sm }}>No status updates yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {statusHistory.map((s) => {
                      const label = s.STATUS ?? "—";
                      const bg = label === "CLOSED" || label === "C" ? COLORS.errorBg : label === "PROCESS" || label === "I" ? COLORS.warningBg : COLORS.successBg;
                      const color = label === "CLOSED" || label === "C" ? COLORS.error : label === "PROCESS" || label === "I" ? COLORS.warning : COLORS.success;

                      return (
                        <div
                          key={s.sno}
                          style={{
                            border: `1px solid ${COLORS.cardBorder}`,
                            borderRadius: RADIUS.md,
                            padding: 10,
                            background: COLORS.cardBg,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: FONT.size.xs, fontWeight: 600, background: bg, color }}>
                              {label}
                            </span>
                            <span style={{ fontSize: FONT.size.xs, color: COLORS.textMuted }}>
                              {s.UPDATED ? new Date(s.UPDATED).toLocaleString() : "—"}
                            </span>
                          </div>

                          <div style={{ fontSize: FONT.size.sm, color: COLORS.textSecondary, marginBottom: 4 }}>
                            By <b style={{ color: COLORS.textPrimary }}>{s.userName ?? s.userId ?? "—"}</b>
                          </div>

                          {s.remark && (
                            <div style={{ fontSize: FONT.size.sm, color: COLORS.textPrimary, marginBottom: 6 }}>{s.remark}</div>
                          )}

                          {((s.media && s.media.length > 0) || s.IMAGE) && (() => {
                            const historyMedia = s.media && s.media.length > 0
                              ? s.media
                              : [{ mediaUrl: s.IMAGE, mediaType: "IMAGE", active: true }];
                            return (
                            <div className="cb-media-grid">
                              {historyMedia.map((m, idx) => {
                                const type = (m.mediaType ?? "").toUpperCase();
                                return (
                                  <div key={idx} className="cb-media-tile">
                                    {type.startsWith("IMAGE") ? (
                                      <img
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`}
                                        alt={`status-media-${idx}`}
                                        onClick={() => setLightbox({ items: historyMedia as LightboxItem[], index: idx })}
                                        style={{ width: "100%", height: 90, objectFit: "cover", cursor: "pointer" }}
                                      />
                                    ) : type.startsWith("VIDEO") ? (
                                      <video
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`}
                                        controls
                                        style={{ width: "100%", height: 90, objectFit: "cover" }}
                                      />
                                    ) : (
                                      <a
                                        href={`${process.env.NEXT_PUBLIC_IMAGE_URL}${m.mediaUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 90, fontSize: FONT.size.xs, color: COLORS.textSecondary }}
                                      >
                                        Open file
                                      </a>
                                    )}
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
              <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>Booking not found.</div>
            )}
          </div>
        </div>

        {lightbox && (
          <MediaLightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
            
          />
        )}
      </>
    );
  }

  // ─────────────────────────

  return (
    <>
      <style>{`
        .cb-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: flex-start;
          justify-content: center;

          z-index: 1000;

          padding: 10px 16px;

          overflow-y: auto;
        }

        .cb-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 960px;

          height: 90vh;

          display: flex;
          flex-direction: column;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: cb-slide-up 0.18s ease;
        }

        .cb-modal-box form {
          display: flex;
          flex-direction: column;

          flex: 1;
          min-height: 0;
        }

        @keyframes cb-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cb-modal-head {
          padding: 10px 14px 8px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl}
            ${RADIUS.xl} 0 0;

          flex-shrink: 0;
        }

        .cb-modal-title {
          font-size: 13px;
          font-weight: 700;

          color: ${COLORS.textPrimary};
        }

        .cb-modal-sub {
          font-size: 10px;
          color: ${COLORS.textMuted};

          margin-top: 1px;
        }

        .cb-modal-body {
          padding: 10px 14px;

          overflow-y: auto;

          flex: 1;
          min-height: 0;
        }

        .cb-modal-footer {
          padding: 8px 14px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0
            ${RADIUS.xl}
            ${RADIUS.xl};

          flex-shrink: 0;
        }

        .cb-section-label {
          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.1em;

          text-transform: uppercase;

          color: ${COLORS.textMuted};

          padding-bottom: 4px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          margin-bottom: 6px;
          margin-top: 10px;
        }

        .cb-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }

        .cb-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cb-field-label {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .cb-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .cb-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};

          border: none;

          background: ${COLORS.btnPrimaryBg};

          color: ${COLORS.btnPrimaryText};

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .cb-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .cb-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cb-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};

          border: 1px solid ${COLORS.btnSecondaryBorder};

          background: ${COLORS.btnSecondaryBg};

          color: ${COLORS.btnSecondaryText};

          font-size: 12px;
          font-weight: 500;

          cursor: pointer;
        }

        .cb-close-btn {
          width: 26px;
          height: 26px;

          border-radius: 6px;

          border: 1px solid ${COLORS.cardBorder};

          background: ${COLORS.cardBg};

          cursor: pointer;
        }
          
          .cs-btn-primary:hover:not(:disabled) { background: ${COLORS.btnPrimaryHover}; }
          .cs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          .cs-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; height: 34px;
            border-radius: ${RADIUS.md}; border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
            color: ${COLORS.textSecondary}; font-size: 14px; cursor: pointer; }
           .cs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex;
                      align-items: flex-start; justify-content: center; z-index: 1000; padding: 20px 16px; overflow-y: auto; }
                    .cs-modal-box { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.xl};
                      width: 100%; max-width: 640px; display: flex; flex-direction: column; font-family: ${FONT.family};
                      box-shadow: 0 8px 32px rgba(0,0,0,0.16); }
                    .cs-modal-box form { display: flex; flex-direction: column; }
                    .cs-modal-body { padding: 14px 16px; }
                    .cs-modal-footer { padding: 8px 14px; border-top: 1px solid ${COLORS.cardBorder}; display: flex;
                      justify-content: flex-end; gap: 8px; background: ${COLORS.gray50}; border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl}; }
                    .cs-field-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
                    .cs-field-label { font-size: 14px; font-weight: 600; color: ${COLORS.textSecondary}; }
                    .cs-field-error { font-size: 14px; color: ${COLORS.error}; }
                    .cs-close-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid ${COLORS.cardBorder};
                      background: ${COLORS.cardBg}; cursor: pointer; }
      `}</style>

      {/* Table */}

      <CustomTable
        title="All Calls Bookings"
        columns={COLUMNS}
        data={
          filteredBookings as CallsBookingListItem_Table[]
        }
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(row)
        }
        extraActions={[
          {
            label: "View Details",
            icon: <Eye size={13} />,
            onClick: openView,
          },
          {
            label: "View Details",
            icon: <Plus size={13} />,
            onClick:  (row) => {
              statusReset(DEFAULTS_STATUS);
                setMedia((prev) => {
                  revokeMediaItems(prev);
                  return [];
                });
                setTokenId(row.tktId);
                setAddOpen(true);
              }
          },
        ]}
        searchPlaceholder="Search ticket, project, module..."
        emptyMessage="No bookings found."
        toolbarRight={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <SelectCombobox
              value={filterUserId || undefined}
              onChange={setFilterUserId}
              items={staffFilterItems}
              placeholder="Filter by staff"
              maxWidth="150px"
              size="sm"
              label="select staff"
              fontSize="sm"
            />
            <div className=" w-[300px]">
            <SelectCombobox
              value={filterClientId || undefined}
              onChange={setFilterClientId}
              items={clientFilterItems}
              placeholder="Filter by client"
              maxWidth="250px"
              minWidth= "200px"
              size="sm"
              label="select client"
              fontSize="sm"
            />
            </div>
            
            <div className="flex flex-col">
              <Text fontSize={"sm"}> Select status </Text>
              <NativeSelectWrapper
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                items={statusItems}
                maxWidth="120px"
                css={{bg:"#FFF" , border:"1px solid #DDD"}}
                

              />
            </div>
           

            <button
              className="cb-btn-primary"
              onClick={openCreate}
            >
              <Plus size={13} />
              Add Booking
            </button>
          </div>
        }

      />

      {/* Modal */}

      {open && (
        <div
          className="cb-modal-overlay"
          onClick={(e) =>
            e.target ===
              e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="cb-modal-box">
            <div className="cb-modal-head">
              <div>
                <div className="cb-modal-title">
                  {editRow
                    ? "Edit Booking"
                    : "Add Booking"}
                </div>

                <div className="cb-modal-sub">
                  {editRow
                    ? `Editing Ticket: ${editRow.tktId}`
                    : "Fill booking details"}
                </div>
              </div>

              <button
                className="cb-close-btn"
                onClick={() =>
                  setOpen(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                onSubmit
              )}
            >
              <div className="cb-modal-body">
                <div className="cb-section-label">
                  Basic Information
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Client *</label>
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField("clientId")}
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          onEnter={() => focusNext("clientId")}
                          editId={editRow?.sno ?? null}
                          items={clientItems}
                          placeholder="Select client"
                          maxWidth="100%"
                          size="md"
                          disable={isClientUser}
                          fontSize="sm"
                        />
                      )}
                    />
                    {errors.clientId && <span className="cb-field-error">{errors.clientId.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Project</label>
                    <Controller
                      name="projectId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField("projectId")}
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          onEnter={() => focusNext("projectId")}
                          editId={editRow?.sno ?? null}
                          items={projectItems}
                          placeholder="Select project"
                          maxWidth="100%"
size="md"
 fontSize="sm"
                        />
                      )}
                    />
                    {errors.projectId && <span className="cb-field-error">{errors.projectId.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Module</label>
                    <Controller
                      name="moduleId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField("moduleId")}
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          onEnter={() => focusNext("moduleId")}
                          editId={editRow?.sno ?? null}
                          items={moduleItems}
                          placeholder="Select module"
                          maxWidth="100%"
size="md"
 fontSize="sm"
                        />
                      )}
                    />
                    {errors.moduleId && <span className="cb-field-error">{errors.moduleId.message}</span>}
                  </div>
                </div>

                <div className="cb-section-label">
                  Assignment
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Staff *</label>
                    <Controller
                      name="assignedUsers"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectCombobox
                          ref={registerField("assignedUsers")}
                          value={field.value ? field.value.split(",").filter(Boolean) : []}
                          onChange={(vals) => field.onChange(vals.join(","))}
                          onEnter={() => focusNext("assignedUsers")}
                          editId={editRow?.sno ?? null}
                          items={staffItems}
                          placeholder="Select staff"
                          maxWidth="100%"
size="md"
 fontSize="sm"
                        />
                      )}
                    />
                    {errors.assignedUsers && <span className="cb-field-error">{errors.assignedUsers.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Status</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <>
                         
                          <NativeSelectWrapper
                            ref={registerField("status")}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            onEnter={() => focusNext("status")}
                            items={statusItems}
                            css ={{
                              border:"1px solid #DDD",
                              bg :"#EEE",
                              color : "#222",
                              fontSize :"14px"
                            }}

                          />
                        </>
                      )}
                    />
                    {errors.status && <span className="cb-field-error">{errors.status.message}</span>}
                  </div>

                  {/* Active is only editable during Update — on create it
                      defaults to "Y" automatically and isn't shown. */}
                  {editRow && (
                    <div className="cb-field-row">
                      <label className="cb-field-label">Active</label>
                      <Controller
                        name="active"
                        control={control}
                        render={({ field }) => (
                          <SwitchInput
                            value={field.value === "N" ? "N" : "Y"}
                            onChange={field.onChange}
                            trueValue="Y"
                            falseValue="N"
                            labels={{ on: "Active", off: "Inactive" }}
                            size="sm"
                          />
                        )}
                      />
                      {errors.active && <span className="cb-field-error">{errors.active.message}</span>}
                    </div>
                  )}
                </div>

                <div className="cb-section-label">
                  Details
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Remark</label>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          inputRef={registerField("remark")}
                          value={field.value}
                          field="remark"
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext("remark")}
                          placeholder="Enter remarks"
                          mode="inline"
                        />
                      )}
                    />
                    {errors.remark && <span className="cb-field-error">{errors.remark.message}</span>}
                  </div>
                </div>

                <div className="cb-section-label">
                  Media
                </div>

                <div className="cb-field-row">
                  <label className="cb-field-label">Attachments</label>
                  <MediaManager
                    value={media}
                    onChange={setMedia}
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    maxFiles={10}
                    onError={(msg) => toast.error("Error", msg)}
                  />
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  className="cb-btn-secondary"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="cb-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Booking"
                    : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* Add Status Modal */}
              {addOpen && (
                <div className="cs-overlay" onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}>
                  <div className="cs-modal-box">
                    <div className="callstatus-head" style={{display:"flex" , padding:"10px", justifyContent:"space-between" ,alignItems:"center"}}>
                      <div >
                        <div className="cs-title">Add Status</div>
                        <div className="cs-sub">Ticket:</div>
                      </div>
                      <button className="cs-close-btn" onClick={() => setAddOpen(false)}>✕</button>
                    </div>
      
                  <form onSubmit={statusSubmit(onStatusSubmit)}>
                      <div className="cs-modal-body">
                        <div className="cs-field-row">
                          <label className="cs-field-label">Status *</label>
                          <Controller
                            name="STATUS"
                            control={statusControl}
                            render={({ field }) => (
                              <>
                                
      
                                <NativeSelectWrapper 
      
                                  value = {field.value}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  items={STATUS_ITEMS}
                                  css={{
                                    fontSize:"14px",
                                    background : "#ddd",
                                    color : "#222"
      
                                  }}
                                  minW="150px"
                                />
                              </>
                            )}
                          />
                  {statusError.STATUS && <span className="cs-field-error">{statusError.STATUS.message}</span>}
                        </div>
      
                        <div className="cs-field-row">
                          <label className="cs-field-label">Remark</label>
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
                          {errors.remark && <span className="cs-field-error">{errors.remark.message}</span>}
                        </div>
      
                        <div className="cs-field-row">
                          <label className="cs-field-label">Media (image/video)</label>
                          <MediaManager
                            value={statusMedia}
                            onChange={setStatusMedia}
                            accept="image/*,video/*"
                            maxFiles={10}
                            onError={(msg) => toast.error("Error", msg)}
                          />
                        </div>
                      </div>
      
                      <div className="callstatus-modal-footer" style={{display:"flex" , alignItems:"center" , justifyContent:"end"}}>
                        <button type="button" className="cs-btn-secondary" onClick={() => setAddOpen(false)}>
                          Cancel
                        </button>
                <button type="submit" className="cb-btn-primary" disabled={createStatusMutation.isPending}>
                          <Pencil size={12} />
                          {createStatusMutation.isPending ? "Saving..." : "Save Status"}
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
        isPending={
          deleteMutation.isPending
        }
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteRow(null)
        }
      />
    </>
  );
}