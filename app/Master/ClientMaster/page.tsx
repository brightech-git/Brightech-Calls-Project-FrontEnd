"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import {
  useClientList,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "@/hooks/ClientMaster/useClientMaster";
import { ClientRecord, ClientRecord_Table } from "@/types/ClientMaster/ClientMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  CLIENTNAME:   z.string().min(1, "Client name is required"),
  COSTID:       z.string().optional(),
  PHONE:        z.string().optional(),
  MOBILE:       z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  EMAIL:        z.string().email("Enter valid email"),
  ADDRESS1:     z.string().optional(),
  ADDRESS2:     z.string().optional(),
  ADDRESS3:     z.string().optional(),
  REMARKS:      z.string().optional(),
  AREACODE:     z.string().optional(),
  GSTNO:        z.string().optional(),
  PANNO:        z.string().optional(),
  TANNO:        z.string().optional(),
  TDSNO:        z.string().optional(),
  TINNO:        z.string().optional(),
  CSTNO:        z.string().optional(),
  LOCALTAXNO:   z.string().optional(),
  SHORTKEY:     z.string().optional(),
  ACTIVE:       z.enum(["Y", "N"]),
  // CLIENT LOGIN (OPTIONAL - LEAVE BLANK IF THIS CLIENT SHOULDN'T LOG IN YET)
  USERNAME:        z.string().min(0).optional().or(z.literal("")),
  PASSWORD:        z.string().min(0).optional().or(z.literal("")),
  CONFIRMPASSWORD: z.string().min(0).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const username = (data.USERNAME || "").trim();
  const password = data.PASSWORD || "";
  const confirm = data.CONFIRMPASSWORD || "";

  if (username && username.length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Username min 3 chars", path: ["USERNAME"] });
  }
  if (password && password.length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password min 5 chars", path: ["PASSWORD"] });
  }
  if (password !== confirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["CONFIRMPASSWORD"] });
  }
});

type ClientForm = z.infer<typeof clientSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<ClientRecord_Table>[] = [
  { key: "CLIENTID",   header: "#",           align: "center", width: "50px" },
  { key: "CLIENTNAME", header: "Client Name", sortable: true },
  { key: "MOBILE",     header: "Mobile",      sortable: true },
  { key: "EMAIL",      header: "Email",       sortable: true },
  { key: "GSTNO",      header: "GST No",      sortable: true },
  { key: "ACTIVE",     header: "Status",      sortable: true,
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

const DEFAULTS: ClientForm = {
  CLIENTNAME: "", COSTID: "", SHORTKEY: "",
  PHONE: "", MOBILE: "", EMAIL: "", ACTIVE: "Y",
  ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", AREACODE: "", REMARKS: "",
  GSTNO: "", PANNO: "", TANNO: "", TDSNO: "", TINNO: "", CSTNO: "", LOCALTAXNO: "",
  USERNAME: "", PASSWORD: "", CONFIRMPASSWORD: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientMasterPage() {
  usePageHeader({ title: "Client Master", subtitle: "Manage client records" });

  const toast = useToast();
  const [open, setOpen]           = useState(false);
  const [editRow, setEditRow]     = useState<ClientRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientRecord | null>(null);

  const { data: clients = [], isLoading } = useClientList();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: DEFAULTS,
  });

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };

  const openEdit = (row: ClientRecord_Table) => {
    const r = row as ClientRecord;
    setEditRow(r);
    reset({
      CLIENTNAME:  r.CLIENTNAME  ?? "",
      COSTID:      r.COSTID      ?? "",
      SHORTKEY:    r.SHORTKEY    ?? "",
      PHONE:       r.PHONE       ?? "",
      MOBILE:      r.MOBILE      ?? "",
      EMAIL:       r.EMAIL       ?? "",
      ACTIVE:      r.ACTIVE === "N" ? "N" : "Y",
      ADDRESS1:    r.ADDRESS1    ?? "",
      ADDRESS2:    r.ADDRESS2    ?? "",
      ADDRESS3:    r.ADDRESS3    ?? "",
      AREACODE:    r.AREACODE    ?? "",
      REMARKS:     r.REMARKS     ?? "",
      GSTNO:       r.GSTNO       ?? "",
      PANNO:       r.PANNO       ?? "",
      TANNO:       r.TANNO       ?? "",
      TDSNO:       r.TDSNO       ?? "",
      TINNO:       r.TINNO       ?? "",
      CSTNO:       r.CSTNO       ?? "",
      LOCALTAXNO:  r.LOCALTAXNO  ?? "",
      USERNAME:        r.USERNAME ?? "",
      PASSWORD:        "",
      CONFIRMPASSWORD: "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: ClientForm) => {
    try {
      const userId = Number(localStorage.getItem("userId") || 0);
      const { PASSWORD, CONFIRMPASSWORD, ...rest } = data;
      const payloadBase = { ...rest, PWD: PASSWORD || undefined };

      if (editRow) {
        const payload = { ...payloadBase, CLIENTID: editRow.CLIENTID, USERID: userId };
        const res = await updateMutation.mutateAsync({ id: String(editRow.CLIENTID), payload });
        toast.success("Client Updated", `"${res.CLIENTNAME}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({ ...payloadBase, USERID: userId });
        toast.success("Client Created", `"${res.CLIENTNAME}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.CLIENTID), {
      onSuccess: () => {
        toast.success("Client Deleted", `"${deleteRow.CLIENTNAME}" deleted successfully.`);
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
        .cm-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: flex-start; justify-content: center;
          z-index: 1000; padding: 10px 16px;
          overflow-y: auto;
        }
        .cm-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          width: 100%; max-width: 860px;
          height: 88vh;
          display: flex; flex-direction: column;
          font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: cm-slide-up 0.18s ease;
        }
        .cm-modal-box form {
          display: flex; flex-direction: column;
          flex: 1; min-height: 0;
        }
        @keyframes cm-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .cm-modal-head {
          padding: 10px 14px 8px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          flex-shrink: 0;
        }
        .cm-modal-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .cm-modal-sub   { font-size: 10px; color: ${COLORS.textMuted}; margin-top: 1px; }
        .cm-modal-body  { padding: 10px 14px; overflow-y: auto; flex: 1; min-height: 0; }
        .cm-modal-footer {
          padding: 8px 14px;
          border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
          flex-shrink: 0;
        }
        .cm-section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${COLORS.textMuted};
          padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder};
          margin-bottom: 6px; margin-top: 10px;
        }
        .cm-section-label:first-of-type { margin-top: 0; }
        .cm-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }
        .cm-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cm-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }
        .cm-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }
        .cm-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md};
          border: none; background: ${COLORS.btnPrimaryBg};
          color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .cm-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .cm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cm-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};
          background: ${COLORS.btnSecondaryBg}; color: ${COLORS.btnSecondaryText};
          font-size: 12px; font-weight: 500; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .cm-btn-secondary:hover { background: ${COLORS.btnSecondaryHover}; }
        .cm-close-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; color: ${COLORS.textMuted};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .cm-close-btn:hover { background: ${COLORS.errorBg}; color: ${COLORS.error}; }
        .cm-modal-box input, .cm-modal-box textarea, .cm-modal-box select {
          background: ${COLORS.inputBg} !important;
          border: 1px solid ${COLORS.inputBorder} !important;
          color: ${COLORS.inputText} !important;
        }
        .cm-modal-box input::placeholder { color: ${COLORS.inputPlaceholder} !important; }
        .cm-modal-box input:focus {
          border-color: ${COLORS.inputBorderFocus} !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important;
        }
      `}</style>

      {/* Table */}
      <CustomTable
        title="All Clients"
        columns={COLUMNS}
        data={clients as ClientRecord_Table[]}
        rowKey="CLIENTID"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ClientRecord)}
        searchPlaceholder="Search by name, GST, mobile..."
        emptyMessage="No clients found."
        toolbarRight={
          <button className="cm-btn-primary" onClick={openCreate}>
            <Plus size={13} /> Add Client
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div className="cm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="cm-modal-box">
            <div className="cm-modal-head">
              <div>
                <div className="cm-modal-title">{editRow ? "Edit Client" : "Add Client"}</div>
                <div className="cm-modal-sub">{editRow ? `Editing: ${editRow.CLIENTNAME}` : "Fill in the details below"}</div>
              </div>
              <button className="cm-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, (errs) => {
              const first = Object.values(errs)[0];
              const msg = (first as any)?.message || "Please fix the form errors.";
              toast.error("Validation Error", msg);
            })}>
              <div className="cm-modal-body">
                <div className="cm-section-label">Basic Information</div>
                <div className="cm-grid-2">
                  <div className="cm-field-row">
                    <label className="cm-field-label">Client Name *</label>
                    <Controller
                      name="CLIENTNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="CLIENTNAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Full client name"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.CLIENTNAME && <span className="cm-field-error">{errors.CLIENTNAME.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Cost ID</label>
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
                    {errors.COSTID && <span className="cm-field-error">{errors.COSTID.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Short Key</label>
                    <Controller
                      name="SHORTKEY"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="SHORTKEY"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. A"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.SHORTKEY && <span className="cm-field-error">{errors.SHORTKEY.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Phone</label>
                    <Controller
                      name="PHONE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PHONE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. 04412345678"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PHONE && <span className="cm-field-error">{errors.PHONE.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Mobile *</label>
                    <Controller
                      name="MOBILE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="MOBILE"
                          inputModeType="mobile"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="10-digit mobile"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.MOBILE && <span className="cm-field-error">{errors.MOBILE.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Email *</label>
                    <Controller
                      name="EMAIL"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="EMAIL"
                          inputModeType="email"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="email@example.com"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.EMAIL && <span className="cm-field-error">{errors.EMAIL.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Status *</label>
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
                    {errors.ACTIVE && <span className="cm-field-error">{errors.ACTIVE.message}</span>}
                  </div>
                </div>

                <div className="cm-section-label">Login Access (Optional)</div>
                <div className="cm-grid-2">
                  <div className="cm-field-row">
                    <label className="cm-field-label">Username</label>
                    <Controller
                      name="USERNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value ?? ""}
                          field="USERNAME"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Leave blank if no client login needed"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.USERNAME && <span className="cm-field-error">{errors.USERNAME.message}</span>}
                  </div>

                  <div />

                  <div className="cm-field-row">
                    <label className="cm-field-label">
                      Password {editRow ? "(leave blank to keep)" : ""}
                    </label>
                    <Controller
                      name="PASSWORD"
                      control={control}
                      render={({ field }) => (
                        <PasswordInput
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Min 5 characters"
                        />
                      )}
                    />
                    {errors.PASSWORD && <span className="cm-field-error">{errors.PASSWORD.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Confirm Password</label>
                    <Controller
                      name="CONFIRMPASSWORD"
                      control={control}
                      render={({ field }) => (
                        <PasswordInput
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Re-enter password"
                        />
                      )}
                    />
                    {errors.CONFIRMPASSWORD && <span className="cm-field-error">{errors.CONFIRMPASSWORD.message}</span>}
                  </div>
                </div>

                <div className="cm-section-label">Address</div>
                <div className="cm-grid-2">
                  <div className="cm-field-row">
                    <label className="cm-field-label">Address 1</label>
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
                    {errors.ADDRESS1 && <span className="cm-field-error">{errors.ADDRESS1.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Address 2</label>
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
                    {errors.ADDRESS2 && <span className="cm-field-error">{errors.ADDRESS2.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Address 3</label>
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
                    {errors.ADDRESS3 && <span className="cm-field-error">{errors.ADDRESS3.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Area Code</label>
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
                    {errors.AREACODE && <span className="cm-field-error">{errors.AREACODE.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Remarks</label>
                    <Controller
                      name="REMARKS"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="REMARKS"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Any remarks..."
                          mode="inline"
                          rows={3}
                          isCapitalized={false}
                        />
                      )}
                    />
                    {errors.REMARKS && <span className="cm-field-error">{errors.REMARKS.message}</span>}
                  </div>
                </div>

                <div className="cm-section-label">Tax Information</div>
                <div className="cm-grid-2">
                  <div className="cm-field-row">
                    <label className="cm-field-label">GST No</label>
                    <Controller
                      name="GSTNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="GSTNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="GST number"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.GSTNO && <span className="cm-field-error">{errors.GSTNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">PAN No</label>
                    <Controller
                      name="PANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PANNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="PAN number"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PANNO && <span className="cm-field-error">{errors.PANNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">TAN No</label>
                    <Controller
                      name="TANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TANNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TAN number"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.TANNO && <span className="cm-field-error">{errors.TANNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">TDS No</label>
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
                    {errors.TDSNO && <span className="cm-field-error">{errors.TDSNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">TIN No</label>
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
                    {errors.TINNO && <span className="cm-field-error">{errors.TINNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">CST No</label>
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
                    {errors.CSTNO && <span className="cm-field-error">{errors.CSTNO.message}</span>}
                  </div>

                  <div className="cm-field-row">
                    <label className="cm-field-label">Local Tax No</label>
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
                    {errors.LOCALTAXNO && <span className="cm-field-error">{errors.LOCALTAXNO.message}</span>}
                  </div>
                </div>
              </div>

              <div className="cm-modal-footer">
                <button type="button" className="cm-btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="cm-btn-primary" disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Client" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.CLIENTNAME}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
