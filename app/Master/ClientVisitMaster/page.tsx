"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Image as ImageIcon } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { FileUploader } from "@/components/ui/FileUploadInput";
import { MediaLightbox, LightboxItem } from "@/components/ui/MediaLightbox";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import {
  useClientVisitList,
  useCreateClientVisit,
  useUpdateClientVisit,
  useDeleteClientVisit,
} from "@/hooks/ApiHooks/ClientVisit/useClientVisit";
import { ClientVisitRecord, ClientVisitRecord_Table } from "@/types/ClientVisit/ClientVisit";

// ─── Media URL helper ──────────────────────────────────────────────────────────
// Media paths come back server-relative (e.g. "/uploads/clientvisit/xxx.jpg"),
// rooted at the API host, not under the "/api/v1" prefix used for JSON calls.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8112/api/v1";
const MEDIA_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");
const mediaUrl = (path: string) =>
  path.startsWith("http") ? path : `${MEDIA_ORIGIN}${path}`;

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientVisitSchema = z.object({
  COMPANYNAME:  z.string().min(1, "Client name is required"),
  COMPANYID:   z.string().optional(),

  PHONE:       z.string().optional(),
  MOBILE:      z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  EMAIL:       z.string().optional(),
  ADDRESS1:    z.string().optional(),
  ADDRESS2:    z.string().optional(),
  ADDRESS3:    z.string().optional(),
  REMARKS:     z.string().optional(),
  AREACODE:    z.string().optional(),
  GSTNO:       z.string().optional(),
  PANNO:       z.string().optional(),
  TANNO:       z.string().optional(),
  TDSNO:       z.string().optional(),
  TINNO:       z.string().optional(),
  CSTNO:       z.string().optional(),
  LOCALTAXNO:  z.string().optional(),
  SHORTKEY:    z.string().optional(),
  ACTIVE:      z.enum(["Y", "N"]),
});

type ClientVisitForm = z.infer<typeof clientVisitSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<ClientVisitRecord_Table>[] = [
  { key: "ID",         header: "#",           align: "center", width: "50px" },
  { key: "COMPANYNAME", header: "Client Name", sortable: true },
  { key: "MOBILE",     header: "Mobile",      sortable: true },
  { key: "EMAIL",      header: "Email",       sortable: true },
  { key: "media",      header: "Media",       align: "center", width: "80px",
    render: (row) => (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, color: COLORS.textMuted,
      }}>
        <ImageIcon size={13} /> {row.media?.length ?? 0}
      </span>
    ),
  },
  { key: "ACTIVE",      header: "Status",      sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
        color:      row.ACTIVE === "Y" ? COLORS.success   : COLORS.error,
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULTS: ClientVisitForm = {
  COMPANYNAME: "", COMPANYID: "",  SHORTKEY: "",
  PHONE: "", MOBILE: "", EMAIL: "", ACTIVE: "Y",
  ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", REMARKS: "", AREACODE: "",
  GSTNO: "", PANNO: "", TANNO: "", TDSNO: "", TINNO: "", CSTNO: "", LOCALTAXNO: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientVisitMasterPage() {
  usePageHeader({ title: "Client Visit Master", subtitle: "Manage client visit records" });

  const toast = useToast();
  const [open, setOpen]           = useState(false);
  const [editRow, setEditRow]     = useState<ClientVisitRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientVisitRecord | null>(null);
  const [media, setMedia]         = useState<File[]>([]);
  const [lightbox, setLightbox]   = useState<{ items: LightboxItem[]; index: number } | null>(null);

  const { data: visits = [], isLoading } = useClientVisitList();


    console.log(visits,'visits')

  const createMutation = useCreateClientVisit();
  const updateMutation = useUpdateClientVisit();
  const deleteMutation = useDeleteClientVisit();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientVisitForm>({
    resolver: zodResolver(clientVisitSchema),
    defaultValues: DEFAULTS,
  });

  const openCreate = () => {
    setEditRow(null);
    setMedia([]);
    reset(DEFAULTS);
    setOpen(true);
  };

  const openEdit = (row: ClientVisitRecord_Table) => {
    const r = row as ClientVisitRecord;
    setEditRow(r);
    setMedia([]);
    reset({
    COMPANYNAME: r.COMPANYNAME  ?? "",
      COMPANYID:   r.COMPANYID   ?? "",
    //   COSTID:      r.COSTID      ?? "",
      SHORTKEY:    r.SHORTKEY    ?? "",
      PHONE:       r.PHONE       ?? "",
      MOBILE:      r.MOBILE      ?? "",
      EMAIL:       r.EMAIL       ?? "",
      ACTIVE:      r.ACTIVE === "N" ? "N" : "Y",
      ADDRESS1:    r.ADDRESS1    ?? "",
      ADDRESS2:    r.ADDRESS2    ?? "",
      ADDRESS3:    r.ADDRESS3    ?? "",
      REMARKS:     r.REMARKS     ?? "",
      AREACODE:    r.AREACODE    ?? "",
      GSTNO:       r.GSTNO       ?? "",
      PANNO:       r.PANNO       ?? "",
      TANNO:       r.TANNO       ?? "",
      TDSNO:       r.TDSNO       ?? "",
      TINNO:       r.TINNO       ?? "",
      CSTNO:       r.CSTNO       ?? "",
      LOCALTAXNO:  r.LOCALTAXNO  ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: ClientVisitForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.ID),
          payload: data,
          media,
        });
        toast.success("Visit Updated", `"${res.COMPANYNAME}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({ payload: data, media });
        toast.success("Visit Created", `"${res.COMPANYNAME}" created successfully.`);
      }
      setOpen(false);
      setMedia([]);
      reset(DEFAULTS);
    } catch (err: any) {
      console.error("[ClientVisitMaster] ERROR:", err?.response ?? err);
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };

  // Inline expandable row detail (List icon in the table) — no modal, no
  // separate page, just an accordion-style dropdown shown under the row.
  const renderExpandedRow = (row: ClientVisitRecord_Table) => {
    const r = row as ClientVisitRecord;

    const fields: [string, unknown][] = [
      ["Short Key",    r.SHORTKEY],
      ["Phone",        r.PHONE],
      ["Mobile",       r.MOBILE],
      ["Email",        r.EMAIL],
      ["Address 1",    r.ADDRESS1],
      ["Address 2",    r.ADDRESS2],
      ["Address 3",    r.ADDRESS3],
      ["Area Code",    r.AREACODE],
      ["GST No",       r.GSTNO],
      ["PAN No",       r.PANNO],
      ["TAN No",       r.TANNO],
      ["TDS No",       r.TDSNO],
      ["TIN No",       r.TINNO],
      ["CST No",       r.CSTNO],
      ["Local Tax No", r.LOCALTAXNO],
      ["Remarks",      r.REMARKS],
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT.family }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 24px" }}>
          {fields.map(([label, val]) => (
            <div key={label} style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: COLORS.textSecondary }}>{label}: </span>
              <span style={{ color: COLORS.textPrimary }}>{String(val ?? "—")}</span>
            </div>
          ))}
        </div>

        {r.media && r.media.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.textMuted, marginBottom: 6 }}>
              Media
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {r.media.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  onClick={() => setLightbox({ items: r.media as LightboxItem[], index: idx })}
                  style={{
                    width: 70, height: 70, borderRadius: RADIUS.md, overflow: "hidden",
                    border: `1px solid ${COLORS.cardBorder}`, cursor: "pointer",
                  }}
                >
                  {m.mediaType === "VIDEO" ? (
                    <video src={mediaUrl(m.mediaUrl ?? "")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={mediaUrl(m.mediaUrl ?? "")} alt={`media-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.ID), {
      onSuccess: () => {
        toast.success("Visit Deleted", `"${deleteRow.COMPANYNAME}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  return (
    <>
      <style>{`
        .cv-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: flex-start; justify-content: center;
          z-index: 1000; padding: 10px 16px;
          overflow-y: auto;
        }
        .cv-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          width: 100%; max-width: 860px;
          height: 88vh;
          display: flex; flex-direction: column;
          font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: cv-slide-up 0.18s ease;
        }
        .cv-modal-box form {
          display: flex; flex-direction: column;
          flex: 1; min-height: 0;
        }
        @keyframes cv-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .cv-modal-head {
          padding: 10px 14px 8px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          flex-shrink: 0;
        }
        .cv-modal-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .cv-modal-sub   { font-size: 10px; color: ${COLORS.textMuted}; margin-top: 1px; }
        .cv-modal-body  { padding: 10px 14px; overflow-y: auto; flex: 1; min-height: 0; }
        .cv-modal-footer {
          padding: 8px 14px;
          border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
          flex-shrink: 0;
        }
        .cv-section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${COLORS.textMuted};
          padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder};
          margin-bottom: 6px; margin-top: 10px;
        }
        .cv-section-label:first-of-type { margin-top: 0; }
        .cv-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }
        .cv-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cv-field-row-full { grid-column: 1 / -1; }
        .cv-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }
        .cv-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }
        .cv-existing-media {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;
        }
        .cv-existing-media-item {
          width: 64px; height: 64px; border-radius: ${RADIUS.md};
          overflow: hidden; border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.gray50};
          display: flex; align-items: center; justify-content: center;
        }
        .cv-existing-media-item img, .cv-existing-media-item video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .cv-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md};
          border: none; background: ${COLORS.btnPrimaryBg};
          color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .cv-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .cv-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cv-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};
          background: ${COLORS.btnSecondaryBg}; color: ${COLORS.btnSecondaryText};
          font-size: 12px; font-weight: 500; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .cv-btn-secondary:hover { background: ${COLORS.btnSecondaryHover}; }
        .cv-close-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; color: ${COLORS.textMuted};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .cv-close-btn:hover { background: ${COLORS.errorBg}; color: ${COLORS.error}; }
        .cv-modal-box input, .cv-modal-box textarea, .cv-modal-box select {
          background: ${COLORS.inputBg} !important;
          border: 1px solid ${COLORS.inputBorder} !important;
          color: ${COLORS.inputText} !important;
        }
        .cv-modal-box input::placeholder { color: ${COLORS.inputPlaceholder} !important; }
        .cv-modal-box input:focus {
          border-color: ${COLORS.inputBorderFocus} !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important;
        }
      `}</style>

      {/* Table */}
      <CustomTable
        title="All Client Visits"
        columns={COLUMNS}
        data={visits as ClientVisitRecord_Table[] || []}
        rowKey="ID"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ClientVisitRecord)}
        expandedRowRender={renderExpandedRow}
        searchPlaceholder="Search by name, GST, mobile..."
        emptyMessage="No client visits found."
        toolbarRight={
          <button className="cv-btn-primary" onClick={openCreate}>
            <Plus size={13} /> Add Client Visit
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div className="cv-modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="cv-modal-box">
            <div className="cv-modal-head">
              <div>
                <div className="cv-modal-title">{editRow ? "Edit Client Visit" : "Add Client Visit"}</div>
                <div className="cv-modal-sub">{editRow ? `Editing: ${editRow.COMPANYNAME}` : "Fill in the details below"}</div>
              </div>
              <button className="cv-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, (errs) => {
              const first = Object.values(errs)[0];
              const msg = (first as any)?.message || "Please fix the form errors.";
              toast.error("Validation Error", msg);
            })}>
              <div className="cv-modal-body">
                <div className="cv-section-label">Basic Information</div>
                <div className="cv-grid-2">
                  <div className="cv-field-row">
                    <label className="cv-field-label">Client Name *</label>
                    <Controller
                      name="COMPANYNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="COMPANYNAME"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Full client name"
                          isCapitalized
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.COMPANYNAME && <span className="cv-field-error">{errors.COMPANYNAME.message}</span>}
                  </div>

                  {/* <div className="cv-field-row">
                    <label className="cv-field-label">Cost ID</label>
                    <Controller
                      name="COSTID"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="COSTID"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. BT"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div> */}

                  <div className="cv-field-row">
                    <label className="cv-field-label">Short Key</label>
                    <Controller
                      name="SHORTKEY"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="SHORTKEY"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. B"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Phone</label>
                    <Controller
                      name="PHONE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PHONE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. 04422334455"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Mobile *</label>
                    <Controller
                      name="MOBILE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="MOBILE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="10-digit mobile"
                          inputModeType="mobile"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.MOBILE && <span className="cv-field-error">{errors.MOBILE.message}</span>}
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Email *</label>
                    <Controller
                      name="EMAIL"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="EMAIL"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="email@example.com"
                          inputModeType="email"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.EMAIL && <span className="cv-field-error">{errors.EMAIL.message}</span>}
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Status *</label>
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
                    {errors.ACTIVE && <span className="cv-field-error">{errors.ACTIVE.message}</span>}
                  </div>

                  <div className="cv-field-row cv-field-row-full">
                    <label className="cv-field-label">Remarks</label>
                    <Controller
                      name="REMARKS"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="REMARKS"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Visit notes / remarks"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="cv-section-label">Address</div>
                <div className="cv-grid-2">
                  <div className="cv-field-row">
                    <label className="cv-field-label">Address 1</label>
                    <Controller
                      name="ADDRESS1"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS1"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Street"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Address 2</label>
                    <Controller
                      name="ADDRESS2"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS2"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Area"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Address 3</label>
                    <Controller
                      name="ADDRESS3"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS3"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="City"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Area Code</label>
                    <Controller
                      name="AREACODE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="AREACODE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="PIN code"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="cv-section-label">Tax Information</div>
                <div className="cv-grid-2">
                  <div className="cv-field-row">
                    <label className="cv-field-label">GST No</label>
                    <Controller
                      name="GSTNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="GSTNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="GST number"
                          isCapitalized
                          inputModeType="gst"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">PAN No</label>
                    <Controller
                      name="PANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PANNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="PAN number"
                          isCapitalized
                          inputModeType="pan"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">TAN No</label>
                    <Controller
                      name="TANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TANNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TAN number"
                          isCapitalized
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">TDS No</label>
                    <Controller
                      name="TDSNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TDSNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TDS number"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">TIN No</label>
                    <Controller
                      name="TINNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TINNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TIN number"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">CST No</label>
                    <Controller
                      name="CSTNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="CSTNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="CST number"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="cv-field-row">
                    <label className="cv-field-label">Local Tax No</label>
                    <Controller
                      name="LOCALTAXNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="LOCALTAXNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Local tax number"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="cv-section-label">Visit Media</div>

                {editRow && !!editRow.media?.length && (
                  <div className="cv-existing-media">
                    {editRow.media.map((m, i) => (
                      <div key={m.id ?? i} className="cv-existing-media-item">
                        {m.mediaType === "VIDEO" ? (
                          <video src={mediaUrl(m.mediaUrl ?? "")} muted />
                        ) : (
                          <img src={mediaUrl(m.mediaUrl ?? "")} alt={`Visit media ${i + 1}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <FileUploader
                  mode="multiple"
                  maxFiles={5}
                  acceptTypes={["image", "video"]}
                  showPreview
                  dropzoneText="Drag images or videos here"
                  buttonText="Choose Media"
                  onFilesChange={setMedia}
                  onError={(msg) => toast.error("Media Error", msg)}
                />
              </div>

              <div className="cv-modal-footer">
                <button type="button" className="cv-btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="cv-btn-primary" disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Visit" : "Create Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.COMPANYNAME}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />

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
