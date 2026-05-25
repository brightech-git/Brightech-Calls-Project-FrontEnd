"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { FormField, FieldConfig } from "@/components/FormField";
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
});

type ClientForm = z.infer<typeof clientSchema>;

// ─── Fields ───────────────────────────────────────────────────────────────────

const LW = "120px";

const FIELDS: FieldConfig<ClientForm>[] = [
  { name: "CLIENTNAME",  label: "Client Name",  type: "text",   placeholder: "Full client name",   required: true, inline: true, labelWidth: LW, capitalize: true, tabIndex: 1 },
  { name: "COSTID",      label: "Cost ID",       type: "text",   placeholder: "e.g. BT",            inline: true, labelWidth: LW, tabIndex: 2 },
  { name: "SHORTKEY",    label: "Short Key",     type: "text",   placeholder: "e.g. A",             inline: true, labelWidth: LW, tabIndex: 3 },
  { name: "PHONE",       label: "Phone",         type: "text",   placeholder: "e.g. 04412345678",   inline: true, labelWidth: LW, tabIndex: 4 },
  { name: "MOBILE",      label: "Mobile",        type: "tel",    placeholder: "10-digit mobile",    required: true, inline: true, labelWidth: LW, tabIndex: 5 },
  { name: "EMAIL",       label: "Email",         type: "email",  placeholder: "email@example.com",  required: true, inline: true, labelWidth: LW, tabIndex: 6 },
  { name: "ACTIVE",      label: "Status",        type: "select", placeholder: "Select status",      required: true, inline: true, labelWidth: LW, tabIndex: 7,
    options: [{ label: "Active", value: "Y" }, { label: "Inactive", value: "N" }],
  },
  { name: "ADDRESS1",    label: "Address 1",     type: "text",   placeholder: "Street",             inline: true, labelWidth: LW, tabIndex: 8 },
  { name: "ADDRESS2",    label: "Address 2",     type: "text",   placeholder: "Area",               inline: true, labelWidth: LW, tabIndex: 9 },
  { name: "ADDRESS3",    label: "Address 3",     type: "text",   placeholder: "City",               inline: true, labelWidth: LW, tabIndex: 10 },
  { name: "AREACODE",    label: "Area Code",     type: "text",   placeholder: "PIN code",           inline: true, labelWidth: LW, tabIndex: 11 },
  { name: "REMARKS",     label: "Remarks",       type: "textarea", placeholder: "Any remarks...",   inline: true, labelWidth: LW, tabIndex: 12 },
  { name: "GSTNO",       label: "GST No",        type: "text",   placeholder: "GST number",         inline: true, labelWidth: LW, capitalize: true, tabIndex: 13 },
  { name: "PANNO",       label: "PAN No",        type: "text",   placeholder: "PAN number",         inline: true, labelWidth: LW, capitalize: true, tabIndex: 14 },
  { name: "TANNO",       label: "TAN No",        type: "text",   placeholder: "TAN number",         inline: true, labelWidth: LW, capitalize: true, tabIndex: 15 },
  { name: "TDSNO",       label: "TDS No",        type: "text",   placeholder: "TDS number",         inline: true, labelWidth: LW, tabIndex: 16 },
  { name: "TINNO",       label: "TIN No",        type: "text",   placeholder: "TIN number",         inline: true, labelWidth: LW, tabIndex: 17 },
  { name: "CSTNO",       label: "CST No",        type: "text",   placeholder: "CST number",         inline: true, labelWidth: LW, tabIndex: 18 },
  { name: "LOCALTAXNO",  label: "Local Tax No",  type: "text",   placeholder: "Local tax number",   inline: true, labelWidth: LW, tabIndex: 19 },
];

const BASIC   = ["CLIENTNAME", "COSTID", "SHORTKEY", "PHONE", "MOBILE", "EMAIL", "ACTIVE"];
const ADDRESS = ["ADDRESS1", "ADDRESS2", "ADDRESS3", "AREACODE", "REMARKS"];
const TAX     = ["GSTNO", "PANNO", "TANNO", "TDSNO", "TINNO", "CSTNO", "LOCALTAXNO"];

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
    });
    setOpen(true);
  };

  const onSubmit = async (data: ClientForm) => {
    try {
      const userId = Number(localStorage.getItem("userId") || 0);
      if (editRow) {
        const payload = { ...data, CLIENTID: editRow.CLIENTID, USERID: userId };
        const res = await updateMutation.mutateAsync({ id: String(editRow.CLIENTID), payload });
        toast.success("Client Updated", `"${res.CLIENTNAME}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({ ...data, USERID: userId });
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
                  {FIELDS.filter((f) => BASIC.includes(f.name)).map((f) => (
                    <FormField key={f.name} field={f} control={control} errors={errors} />
                  ))}
                </div>

                <div className="cm-section-label">Address</div>
                <div className="cm-grid-2">
                  {FIELDS.filter((f) => ADDRESS.includes(f.name)).map((f) => (
                    <FormField key={f.name} field={f} control={control} errors={errors} />
                  ))}
                </div>

                <div className="cm-section-label">Tax Information</div>
                <div className="cm-grid-2">
                  {FIELDS.filter((f) => TAX.includes(f.name)).map((f) => (
                    <FormField key={f.name} field={f} control={control} errors={errors} />
                  ))}
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
