"use client";

import { ui } from "@/utils/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useClientList, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/ClientMaster/useClientMaster";
import { ClientRecord, ClientRecord_Table } from "@/types/ClientMaster/ClientMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  CLIENTNAME: z.string().min(1, "Client name is required"),
  COSTID: z.string().optional(),
  PHONE: z.string().optional(),
  MOBILE: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  EMAIL: z.string().email("Enter valid email"),
  ADDRESS1: z.string().optional(),
  ADDRESS2: z.string().optional(),
  ADDRESS3: z.string().optional(),
  REMARKS: z.string().optional(),
  AREACODE: z.string().optional(),
  GSTNO: z.string().optional(),
  PANNO: z.string().optional(),
  TANNO: z.string().optional(),
  TDSNO: z.string().optional(),
  TINNO: z.string().optional(),
  CSTNO: z.string().optional(),
  LOCALTAXNO: z.string().optional(),
  SHORTKEY: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"])
});
type ClientForm = z.infer<typeof clientSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<ClientRecord_Table>[] = [{
  key: "CLIENTID",
  header: "#",
  align: "center",
  width: "50px"
}, {
  key: "CLIENTNAME",
  header: "Client Name",
  sortable: true
}, {
  key: "MOBILE",
  header: "Mobile",
  sortable: true
}, {
  key: "EMAIL",
  header: "Email",
  sortable: true
}, {
  key: "GSTNO",
  header: "GST No",
  sortable: true
}, {
  key: "ACTIVE",
  header: "Status",
  sortable: true,
  render: row => <span style={{
    background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
    color: row.ACTIVE === "Y" ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
}];

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULTS: ClientForm = {
  CLIENTNAME: "",
  COSTID: "",
  SHORTKEY: "",
  PHONE: "",
  MOBILE: "",
  EMAIL: "",
  ACTIVE: "Y",
  ADDRESS1: "",
  ADDRESS2: "",
  ADDRESS3: "",
  AREACODE: "",
  REMARKS: "",
  GSTNO: "",
  PANNO: "",
  TANNO: "",
  TDSNO: "",
  TINNO: "",
  CSTNO: "",
  LOCALTAXNO: ""
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientMasterPage() {
  usePageHeader({
    title: "Client Master",
    subtitle: "Manage client records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ClientRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientRecord | null>(null);
  const {
    data: clients = [],
    isLoading
  } = useClientList();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: DEFAULTS
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
      CLIENTNAME: r.CLIENTNAME ?? "",
      COSTID: r.COSTID ?? "",
      SHORTKEY: r.SHORTKEY ?? "",
      PHONE: r.PHONE ?? "",
      MOBILE: r.MOBILE ?? "",
      EMAIL: r.EMAIL ?? "",
      ACTIVE: r.ACTIVE === "N" ? "N" : "Y",
      ADDRESS1: r.ADDRESS1 ?? "",
      ADDRESS2: r.ADDRESS2 ?? "",
      ADDRESS3: r.ADDRESS3 ?? "",
      AREACODE: r.AREACODE ?? "",
      REMARKS: r.REMARKS ?? "",
      GSTNO: r.GSTNO ?? "",
      PANNO: r.PANNO ?? "",
      TANNO: r.TANNO ?? "",
      TDSNO: r.TDSNO ?? "",
      TINNO: r.TINNO ?? "",
      CSTNO: r.CSTNO ?? "",
      LOCALTAXNO: r.LOCALTAXNO ?? ""
    });
    setOpen(true);
  };
  const onSubmit = async (data: ClientForm) => {
    try {
      const userId = Number(localStorage.getItem("userId") || 0);
      if (editRow) {
        console.log(data, editRow, userId, 'updatePayload');
        const payload = {
          ...data,
          CLIENTID: editRow.CLIENTID,
          USERID: userId
        };
        const res = await updateMutation.mutateAsync({
          id: String(editRow.CLIENTID),
          payload
        });
        toast.success("Client Updated", `"${res.CLIENTNAME}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({
          ...data,
          USERID: userId
        });
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
      }
    });
  };
  return <>
      

      {/* Table */}
      <CustomTable title="All Clients" columns={COLUMNS} data={clients as ClientRecord_Table[]} rowKey="CLIENTID" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as ClientRecord)} searchPlaceholder="Search by name, GST, mobile..." emptyMessage="No clients found." toolbarRight={<button className={ui("cm-btn-primary")} onClick={openCreate}>
            <Plus size={13} /> Add Client
          </button>} />

      {/* Modal */}
      {open && <div className={ui("cm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("cm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Client details">
            <div className={ui("cm-modal-head")}>
              <div>
                <div className={ui("cm-modal-title")}>{editRow ? "Edit Client" : "Add Client"}</div>
                <div className={ui("cm-modal-sub")}>{editRow ? `Editing: ${editRow.CLIENTNAME}` : "Fill in the details below"}</div>
              </div>
              <button className={ui("cm-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, errs => {
          const first = Object.values(errs)[0];
          const msg = (first as any)?.message || "Please fix the form errors.";
          toast.error("Validation Error", msg);
        })}>
              <div className={ui("cm-modal-body")}>
                <div className={ui("cm-section-label")}>Basic Information</div>
                <div className={ui("cm-grid-2 workspace-form-grid")}>
                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Client Name *</label>
                    <Controller name="CLIENTNAME" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="CLIENTNAME" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="Full client name" className={ui("[max-width:100%]!")} />} />
                    {errors.CLIENTNAME && <span className={ui("cm-field-error")}>{errors.CLIENTNAME.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Cost ID</label>
                    <Controller name="COSTID" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="COSTID" onChange={(_, value) => field.onChange(value)} placeholder="e.g. BT" className={ui("[max-width:100%]!")} />} />
                    {errors.COSTID && <span className={ui("cm-field-error")}>{errors.COSTID.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Short Key</label>
                    <Controller name="SHORTKEY" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="SHORTKEY" onChange={(_, value) => field.onChange(value)} placeholder="e.g. A" className={ui("[max-width:100%]!")} />} />
                    {errors.SHORTKEY && <span className={ui("cm-field-error")}>{errors.SHORTKEY.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Phone</label>
                    <Controller name="PHONE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PHONE" onChange={(_, value) => field.onChange(value)} placeholder="e.g. 04412345678" className={ui("[max-width:100%]!")} />} />
                    {errors.PHONE && <span className={ui("cm-field-error")}>{errors.PHONE.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Mobile *</label>
                    <Controller name="MOBILE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="MOBILE" inputModeType="mobile" onChange={(_, value) => field.onChange(value)} placeholder="10-digit mobile" className={ui("[max-width:100%]!")} />} />
                    {errors.MOBILE && <span className={ui("cm-field-error")}>{errors.MOBILE.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Email *</label>
                    <Controller name="EMAIL" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="EMAIL" inputModeType="email" onChange={(_, value) => field.onChange(value)} placeholder="email@example.com" className={ui("[max-width:100%]!")} />} />
                    {errors.EMAIL && <span className={ui("cm-field-error")}>{errors.EMAIL.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Status *</label>
                    <Controller name="ACTIVE" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} trueValue="Y" falseValue="N" labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                    {errors.ACTIVE && <span className={ui("cm-field-error")}>{errors.ACTIVE.message}</span>}
                  </div>
                </div>

                <div className={ui("cm-section-label")}>Address</div>
                <div className={ui("cm-grid-2 workspace-form-grid")}>
                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 1</label>
                    <Controller name="ADDRESS1" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS1" onChange={(_, value) => field.onChange(value)} placeholder="Street" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS1 && <span className={ui("cm-field-error")}>{errors.ADDRESS1.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 2</label>
                    <Controller name="ADDRESS2" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS2" onChange={(_, value) => field.onChange(value)} placeholder="Area" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS2 && <span className={ui("cm-field-error")}>{errors.ADDRESS2.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 3</label>
                    <Controller name="ADDRESS3" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS3" onChange={(_, value) => field.onChange(value)} placeholder="City" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS3 && <span className={ui("cm-field-error")}>{errors.ADDRESS3.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Area Code</label>
                    <Controller name="AREACODE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="AREACODE" onChange={(_, value) => field.onChange(value)} placeholder="PIN code" className={ui("[max-width:100%]!")} />} />
                    {errors.AREACODE && <span className={ui("cm-field-error")}>{errors.AREACODE.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Remarks</label>
                    <Controller name="REMARKS" control={control} render={({
                  field
                }) => <TextareaField value={field.value} field="REMARKS" onChange={(_, value) => field.onChange(value)} placeholder="Any remarks..." mode="inline" rows={3} isCapitalized={false} />} />
                    {errors.REMARKS && <span className={ui("cm-field-error")}>{errors.REMARKS.message}</span>}
                  </div>
                </div>

                <div className={ui("cm-section-label")}>Tax Information</div>
                <div className={ui("cm-grid-2 workspace-form-grid")}>
                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>GST No</label>
                    <Controller name="GSTNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="GSTNO" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="GST number" className={ui("[max-width:100%]!")} />} />
                    {errors.GSTNO && <span className={ui("cm-field-error")}>{errors.GSTNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>PAN No</label>
                    <Controller name="PANNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PANNO" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="PAN number" className={ui("[max-width:100%]!")} />} />
                    {errors.PANNO && <span className={ui("cm-field-error")}>{errors.PANNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TAN No</label>
                    <Controller name="TANNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TANNO" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="TAN number" className={ui("[max-width:100%]!")} />} />
                    {errors.TANNO && <span className={ui("cm-field-error")}>{errors.TANNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TDS No</label>
                    <Controller name="TDSNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TDSNO" onChange={(_, value) => field.onChange(value)} placeholder="TDS number" className={ui("[max-width:100%]!")} />} />
                    {errors.TDSNO && <span className={ui("cm-field-error")}>{errors.TDSNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TIN No</label>
                    <Controller name="TINNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TINNO" onChange={(_, value) => field.onChange(value)} placeholder="TIN number" className={ui("[max-width:100%]!")} />} />
                    {errors.TINNO && <span className={ui("cm-field-error")}>{errors.TINNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>CST No</label>
                    <Controller name="CSTNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="CSTNO" onChange={(_, value) => field.onChange(value)} placeholder="CST number" className={ui("[max-width:100%]!")} />} />
                    {errors.CSTNO && <span className={ui("cm-field-error")}>{errors.CSTNO.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Local Tax No</label>
                    <Controller name="LOCALTAXNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="LOCALTAXNO" onChange={(_, value) => field.onChange(value)} placeholder="Local tax number" className={ui("[max-width:100%]!")} />} />
                    {errors.LOCALTAXNO && <span className={ui("cm-field-error")}>{errors.LOCALTAXNO.message}</span>}
                  </div>
                </div>
              </div>

              <div className={ui("cm-modal-footer")}>
                <button type="button" className={ui("cm-btn-secondary")} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={ui("cm-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Client" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.CLIENTNAME}"? This action cannot be undone.`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
