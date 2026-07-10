"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Upload, X, Image, Video, Eye } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { MultiSelectCombobox } from "@/components/ui/MultiSelectCombobox";
import { CallStatusDetail } from "@/components/CallStatusDetail";
import { StatusFilterBar, ALL_FILTER, CUSTOM_FILTER } from "@/components/StatusFilterBar";

import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import {
  FIXED_CALL_STATUSES,
  getCallStatusStyle,
  getStaffColor,
  getCurrentSessionId,
  normalizeStatus,
} from "@/utils/callStatus";

import {
  useMyBookings,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useDeleteCallsBooking,
} from "@/hooks/TaskAssignment/useTaskAssignment";
import { useMyProjectList, useProjectStaff } from "@/hooks/ProjectMaster/useProjectMaster";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";

import {
  CallsBookingRecord,
  CallsBookingRecord_Table,
} from "@/types/TaskAssignment/TaskAssignment";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const callsBookingSchema = z.object({
  COMPID: z.number().min(1, "Company is required"),
  PROJECTID: z.string().min(1, "Project is required"),
  PROJECTNAME: z.string().optional(),
  STAFFIDS: z.string().min(1, "At least one staff member is required"),
  DESCRIPTION: z.string().min(1, "Description is required"),
  REMARK: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"]),
});

type CallsBookingForm = z.infer<typeof callsBookingSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [
  { key: "TKTID", header: "Ticket", sortable: true, width: "80px" },
  { key: "PROJECTNAME", header: "Project", sortable: true },
  {
    key: "STAFFMAP",
    header: "Assigned To",
    render: (row) => {
      const map = row.STAFFMAP as Record<string, string> | null;
      if (!map || Object.keys(map).length === 0) return "-";
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.entries(map).map(([id, name]) => {
            const c = getStaffColor(id);
            return (
              <span
                key={id}
                style={{
                  padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                  background: c.bg, color: c.color,
                }}
              >
                {name}
              </span>
            );
          })}
        </div>
      );
    },
  },
  { key: "DESCRIPTION", header: "Description", render: (row) => {
    const desc = (row.DESCRIPTION as string) || "-";
    return desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
  }},
  {
    key: "STATUS",
    header: "Status",
    sortable: true,
    render: (row) => {
      const s = normalizeStatus(row.STATUS as string);
      const style = getCallStatusStyle(s);
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{s}</span>;
    },
  },
  {
    key: "media",
    header: "Media",
    width: "70px",
    render: (row) => {
      const media = row.media as any[] | undefined;
      if (!media || media.length === 0) return "-";
      return <span style={{ fontSize: 11, color: COLORS.info }}>{media.length} file(s)</span>;
    },
  },
  {
    key: "TKTDATE",
    header: "Date",
    sortable: true,
    render: (row) => row.TKTDATE ? new Date(row.TKTDATE as string).toLocaleDateString() : "-",
  },
  {
    key: "ACTIVE",
    header: "Active",
    width: "70px",
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
        color: row.ACTIVE === "Y" ? COLORS.success : COLORS.error,
      }}>
        {row.ACTIVE === "Y" ? "Yes" : "No"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  COMPID: 0,
  PROJECTID: "",
  PROJECTNAME: "",
  STAFFIDS: "",
  DESCRIPTION: "",
  REMARK: "",
  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  usePageHeader({
    title: "Call Booking",
    subtitle: "Manage calls & task assignments",
  });

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<CallsBookingRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<CallsBookingRecord | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ name: string; type: string; url: string }[]>([]);
  const [statusTicket, setStatusTicket] = useState<CallsBookingRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [customQuery, setCustomQuery] = useState("");

  const { data: companies = [] } = useCompanyList();
  const { data: projects = [] } = useMyProjectList();
  const { data: bookings = [], isLoading } = useMyBookings();

  const currentSessionId = getCurrentSessionId();

  // ── Filter bookings by status tab / typed search ──
  const filteredBookings = useMemo(() => {
    if (statusFilter === CUSTOM_FILTER) {
      if (!customQuery.trim()) return bookings;
      const q = customQuery.trim().toLowerCase();
      return bookings.filter((b) => normalizeStatus(b.STATUS).toLowerCase().includes(q));
    }
    if (statusFilter === ALL_FILTER) return bookings;
    return bookings.filter((b) => normalizeStatus(b.STATUS) === statusFilter);
  }, [bookings, statusFilter, customQuery]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { [ALL_FILTER]: bookings.length };
    for (const s of FIXED_CALL_STATUSES) {
      map[s.value] = bookings.filter((b) => normalizeStatus(b.STATUS) === s.value).length;
    }
    return map;
  }, [bookings]);

  const createMutation = useCreateCallsBooking();
  const updateMutation = useUpdateCallsBooking();
  const deleteMutation = useDeleteCallsBooking();

  const isPending = createMutation.isPending || updateMutation.isPending;

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

  const watchedProjectId = useWatch({ control, name: "PROJECTID" });

  // Load staff assigned to selected project
  const selectedProjectSno = projects.find(
    (p) => String(p.projectId) === String(watchedProjectId)
  )?.projectId;

  const { data: projectStaff = [] } = useProjectStaff(
    selectedProjectSno ? Number(selectedProjectSno) : null
  );

  // Auto-select company when only one exists
  useEffect(() => {
    if (companies.length === 1) setValue("COMPID", companies[0].COMPID);
  }, [companies, setValue]);

  // Auto-fill PROJECTNAME when PROJECTID changes
  useEffect(() => {
    const p = projects.find((pr) => String(pr.projectId) === String(watchedProjectId));
    if (p) setValue("PROJECTNAME", p.projectName ?? "");
  }, [watchedProjectId, projects, setValue]);

  // Build dropdown items
  const companyItems = companies.map((c) => ({ label: c.COMPANYNAME, value: String(c.COMPID) }));
  const projectItems = projects.map((p) => ({ label: p.projectName, value: String(p.projectId) }));

  const staffItems = projectStaff.map((s: any) => ({
    label: `${s.staffName || s.username}${s.roleId === 2 ? " (Admin)" : ""}`,
    value: String(s.userId),
  }));

  // ─────────────────────────

  const clearMedia = () => {
    mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const openCreate = () => {
    setEditRow(null);
    clearMedia();
    const defaultCompId = companies.length === 1 ? companies[0].COMPID : 0;
    reset({ ...DEFAULTS, COMPID: defaultCompId });
    setOpen(true);
  };

  const openEdit = (row: CallsBookingRecord_Table) => {
    const r = row as CallsBookingRecord;
    setEditRow(r);
    clearMedia();

    reset({
      COMPID: r.COMPID,
      PROJECTID: r.PROJECTID || "",
      PROJECTNAME: r.PROJECTNAME || "",
      STAFFIDS: r.STAFFIDS || "",
      DESCRIPTION: r.DESCRIPTION || "",
      REMARK: r.REMARK || "",
      ACTIVE: r.ACTIVE === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: typeof mediaPreviews = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) return;

      newFiles.push(file);
      newPreviews.push({
        name: file.name,
        type: isImage ? "IMAGE" : "VIDEO",
        url: URL.createObjectURL(file),
      });
    });

    setMediaFiles((prev) => [...prev, ...newFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────

  const onSubmit = async (data: CallsBookingForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.SNO),
          payload: data,
        });
        toast.success("Booking Updated", `Ticket "${res.TKTID}" updated.`);
      } else {
        const res = await createMutation.mutateAsync({
          payload: data,
          mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
        });
        toast.success("Booking Created", `Ticket "${res.TKTID}" created.`);
      }

      setOpen(false);
      clearMedia();
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow ? "Update Failed" : "Create Failed",
        err?.response?.data?.message || err?.message || "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(String(deleteRow.SNO), {
      onSuccess: () => {
        toast.success("Booking Deleted", `Ticket "${deleteRow.TKTID}" deleted.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  // ─────────────────────────

  // ── STATUS DETAIL VIEW (shared with Call Status screen) ──
  if (statusTicket) {
    return (
      <CallStatusDetail
        ticket={statusTicket}
        onBack={() => setStatusTicket(null)}
      />
    );
  }

  return (
    <>
      <style>{`
        .cb-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: flex-start; justify-content: center;
          z-index: 1000; padding: 10px 16px; overflow-y: auto;
        }
        .cb-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          width: 100%; max-width: 960px;
          height: 90vh; display: flex; flex-direction: column;
          font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: cb-slide-up 0.18s ease;
        }
        .cb-modal-box form {
          display: flex; flex-direction: column; flex: 1; min-height: 0;
        }
        @keyframes cb-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cb-modal-head {
          padding: 10px 14px 8px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          flex-shrink: 0;
        }
        .cb-modal-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .cb-modal-sub { font-size: 10px; color: ${COLORS.textMuted}; margin-top: 1px; }
        .cb-modal-body { padding: 10px 14px; overflow-y: auto; flex: 1; min-height: 0; }
        .cb-modal-footer {
          padding: 8px 14px;
          border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
          flex-shrink: 0;
        }
        .cb-section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${COLORS.textMuted};
          padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder};
          margin-bottom: 6px; margin-top: 10px;
        }
        .cb-section-label:first-child { margin-top: 0; }
        .cb-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px;
        }
        .cb-field-row { display: flex; flex-direction: column; gap: 4px; }
        .cb-field-full { grid-column: 1 / -1; }
        .cb-field-label { font-size: 12px; font-weight: 600; color: ${COLORS.textSecondary}; }
        .cb-field-error { font-size: 11px; color: ${COLORS.error}; }
        .cb-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px;
          border-radius: ${RADIUS.md}; border: none;
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .cb-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .cb-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cb-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px;
          border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};
          background: ${COLORS.btnSecondaryBg}; color: ${COLORS.btnSecondaryText};
          font-size: 12px; font-weight: 500; cursor: pointer;
        }
        .cb-close-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; cursor: pointer;
        }
        .cb-media-upload-area {
          border: 2px dashed ${COLORS.cardBorder};
          border-radius: ${RADIUS.md};
          padding: 12px; text-align: center; cursor: pointer;
          transition: border-color 0.15s;
        }
        .cb-media-upload-area:hover {
          border-color: ${COLORS.btnPrimaryBg};
        }
        .cb-media-upload-label {
          font-size: 12px; color: ${COLORS.textMuted};
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .cb-media-preview-list {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
        }
        .cb-media-preview-item {
          position: relative; width: 80px; height: 80px;
          border-radius: ${RADIUS.md}; overflow: hidden;
          border: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: center;
          background: ${COLORS.gray50};
        }
        .cb-media-preview-item img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .cb-media-preview-remove {
          position: absolute; top: 2px; right: 2px;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${COLORS.error}; color: #fff;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
        }
        .cb-media-preview-type {
          font-size: 9px; color: ${COLORS.textMuted};
          position: absolute; bottom: 2px; left: 0; right: 0; text-align: center;
          background: rgba(255,255,255,0.8); padding: 1px;
        }
        .cb-staff-hint {
          font-size: 10px; color: ${COLORS.textMuted}; margin-top: 2px;
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Table */}
      <CustomTable
        title="Call Bookings"
        columns={COLUMNS}
        data={filteredBookings as CallsBookingRecord_Table[]}
        rowKey="SNO"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as CallsBookingRecord)}
        extraActions={[
          {
            label: "View Status",
            icon: <Eye size={13} />,
            onClick: (row) => setStatusTicket(row as CallsBookingRecord),
          },
        ]}
        getRowStyle={(row) => {
          const map = (row as CallsBookingRecord_Table).STAFFMAP as Record<string, string> | null;
          const isMine = !!currentSessionId && !!map && Object.prototype.hasOwnProperty.call(map, currentSessionId);
          return isMine ? { boxShadow: `inset 3px 0 0 ${COLORS.secondary}` } : undefined;
        }}
        searchPlaceholder="Search ticket, project..."
        emptyMessage="No bookings found."
        filterSlot={
          <StatusFilterBar
            statuses={FIXED_CALL_STATUSES}
            active={statusFilter}
            onSelect={setStatusFilter}
            customQuery={customQuery}
            onCustomQueryChange={setCustomQuery}
            counts={statusCounts}
          />
        }
        toolbarRight={
          <button className="cb-btn-primary" onClick={openCreate}>
            <Plus size={13} />
            Add Booking
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div
          className="cb-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="cb-modal-box">
            <div className="cb-modal-head">
              <div>
                <div className="cb-modal-title">
                  {editRow ? "Edit Booking" : "New Call Booking"}
                </div>
                <div className="cb-modal-sub">
                  {editRow ? `Editing Ticket: ${editRow.TKTID}` : "Fill booking details"}
                </div>
              </div>
              <button className="cb-close-btn" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="cb-modal-body">
                {/* Basic Info */}
                <div className="cb-section-label">Basic Information</div>
                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Company *</label>
                    <Controller
                      name="COMPID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.SNO ?? null}
                          items={companyItems}
                          placeholder="Select company"
                          disable={companies.length === 1}
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.COMPID && <span className="cb-field-error">{errors.COMPID.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Project *</label>
                    <Controller
                      name="PROJECTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.SNO ?? null}
                          items={projectItems}
                          placeholder="Select project"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PROJECTID && <span className="cb-field-error">{errors.PROJECTID.message}</span>}
                  </div>
                </div>

                {/* Assignment */}
                <div className="cb-section-label">Assignment</div>
                <div className="cb-grid-2">
                  <div className="cb-field-row cb-field-full">
                    <label className="cb-field-label">Assign To *</label>
                    <Controller
                      name="STAFFIDS"
                      control={control}
                      render={({ field }) => {
                        const selectedValues = field.value
                          ? field.value.split(",").filter(Boolean)
                          : [];
                        return (
                          <MultiSelectCombobox
                            value={selectedValues}
                            onChange={(vals) => field.onChange(vals.join(","))}
                            editId={editRow?.SNO ?? null}
                            items={staffItems}
                            placeholder={
                              watchedProjectId
                                ? "Select staff/admin assigned to this project"
                                : "Select a project first"
                            }
                            disable={!watchedProjectId}
                            maxWidth="100%"
                          />
                        );
                      }}
                    />
                    {!watchedProjectId && (
                      <div className="cb-staff-hint">
                        Select a project to load its assigned staff
                      </div>
                    )}
                    {watchedProjectId && projectStaff.length === 0 && (
                      <div className="cb-staff-hint">
                        No staff assigned to this project yet. Assign staff in Project Master first.
                      </div>
                    )}
                    {errors.STAFFIDS && <span className="cb-field-error">{errors.STAFFIDS.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Active</label>
                    <Controller
                      name="ACTIVE"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          trueValue="Y"
                          falseValue="N"
                          labels={{ on: "Active", off: "Inactive" }}
                          size="sm"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="cb-section-label">Details</div>
                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Description *</label>
                    <Controller
                      name="DESCRIPTION"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="DESCRIPTION"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter description"
                          mode="inline"
                        />
                      )}
                    />
                    {errors.DESCRIPTION && <span className="cb-field-error">{errors.DESCRIPTION.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Remark</label>
                    <Controller
                      name="REMARK"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="REMARK"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter remarks"
                          mode="inline"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Media Upload (only on create) */}
                {!editRow && (
                  <>
                    <div className="cb-section-label">Reference Media</div>
                    <div
                      className="cb-media-upload-area"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="cb-media-upload-label">
                        <Upload size={14} />
                        Click to upload images or videos
                      </div>
                    </div>

                    {mediaPreviews.length > 0 && (
                      <div className="cb-media-preview-list">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="cb-media-preview-item">
                            {preview.type === "IMAGE" ? (
                              <img src={preview.url} alt={preview.name} />
                            ) : (
                              <Video size={24} color={COLORS.textMuted} />
                            )}
                            <button
                              type="button"
                              className="cb-media-preview-remove"
                              onClick={() => removeMedia(index)}
                            >
                              <X size={10} />
                            </button>
                            <div className="cb-media-preview-type">
                              {preview.type === "IMAGE" ? (
                                <Image size={8} />
                              ) : (
                                <Video size={8} />
                              )}{" "}
                              {preview.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Show existing media on edit */}
                {editRow && editRow.media && editRow.media.length > 0 && (
                  <>
                    <div className="cb-section-label">Existing Media</div>
                    <div className="cb-media-preview-list">
                      {editRow.media.map((m, i) => (
                        <div key={i} className="cb-media-preview-item">
                          {m.mediaType === "IMAGE" ? (
                            <img src={m.mediaUrl} alt={`media-${i}`} />
                          ) : (
                            <Video size={24} color={COLORS.textMuted} />
                          )}
                          <div className="cb-media-preview-type">{m.mediaType}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  className="cb-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cb-btn-primary" disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete ticket "${deleteRow?.TKTID}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
