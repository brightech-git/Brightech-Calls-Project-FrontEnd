"use client";

import { ui } from "@/utils/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useCompanyList, useCreateCompany, useUpdateCompany, useDeleteCompany } from "@/hooks/CompanyMaster/useCompanyMaster";
import { CompanyRecord, CompanyRecord_Table } from "@/types/CompanyMaster/CompanyMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const companySchema = z.object({
  COMPANYID: z.string().min(1, "Company ID is required"),
  COMPANYNAME: z.string().min(1, "Company name is required"),
  COSTID: z.string().optional(),
  PHONE: z.string().optional(),
  MOBILE: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  EMAIL: z.string().email("Enter valid email"),
  ADDRESS1: z.string().optional(),
  ADDRESS2: z.string().optional(),
  ADDRESS3: z.string().optional(),
  ADDRESS4: z.string().optional(),
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
type CompanyForm = z.infer<typeof companySchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<CompanyRecord_Table>[] = [{
  key: "COMPID",
  header: "#",
  align: "center",
  width: "50px"
}, {
  key: "COMPANYID",
  header: "Company ID",
  sortable: true,
  width: "100px"
}, {
  key: "COMPANYNAME",
  header: "Name",
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

const DEFAULTS: CompanyForm = {
  COMPANYID: "",
  COMPANYNAME: "",
  COSTID: "",
  SHORTKEY: "",
  PHONE: "",
  MOBILE: "",
  EMAIL: "",
  ACTIVE: "Y",
  ADDRESS1: "",
  ADDRESS2: "",
  ADDRESS3: "",
  ADDRESS4: "",
  AREACODE: "",
  GSTNO: "",
  PANNO: "",
  TANNO: "",
  TDSNO: "",
  TINNO: "",
  CSTNO: "",
  LOCALTAXNO: ""
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyMasterPage() {
  usePageHeader({
    title: "Company Master",
    subtitle: "Manage company records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<CompanyRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<CompanyRecord | null>(null);
  const {
    data: companies = [],
    isLoading
  } = useCompanyList();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const isPending = createMutation.isPending || updateMutation.isPending;
  console.log(companies, 'companies');
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: DEFAULTS
  });
  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: CompanyRecord_Table) => {
    const r = row as CompanyRecord;
    setEditRow(r);
    reset({
      COMPANYID: r.COMPANYID ?? "",
      COMPANYNAME: r.COMPANYNAME ?? "",
      COSTID: r.COSTID ?? "",
      SHORTKEY: r.SHORTKEY ?? "",
      PHONE: r.PHONE ?? "",
      MOBILE: r.MOBILE ?? "",
      EMAIL: r.EMAIL ?? "",
      ACTIVE: r.ACTIVE === "N" ? "N" : "Y",
      ADDRESS1: r.ADDRESS1 ?? "",
      ADDRESS2: r.ADDRESS2 ?? "",
      ADDRESS3: r.ADDRESS3 ?? "",
      ADDRESS4: r.ADDRESS4 ?? "",
      AREACODE: r.AREACODE ?? "",
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
  const onSubmit = async (data: CompanyForm) => {
    try {
      if (editRow) {
        const payload = {
          ...data,
          COMPID: editRow.COMPID,
          USERID: editRow.USERID
        };
        console.log("[CompanyMaster] UPDATE payload:", payload);
        const res = await updateMutation.mutateAsync({
          id: String(editRow.COMPID),
          payload
        });
        console.log("[CompanyMaster] UPDATE response:", res);
        toast.success("Company Updated", `"${res.COMPANYNAME}" updated successfully.`);
      } else {
        console.log("[CompanyMaster] CREATE payload:", data);
        const res = await createMutation.mutateAsync(data);
        console.log("[CompanyMaster] CREATE response:", res);
        toast.success("Company Created", `"${res.COMPANYNAME}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      console.error("[CompanyMaster] ERROR:", err?.response ?? err);
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };
  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.COMPID), {
      onSuccess: () => {
        toast.success("Company Deleted", `"${deleteRow.COMPANYNAME}" deleted successfully.`);
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
      <CustomTable title="All Companies" columns={COLUMNS} data={companies as CompanyRecord_Table[] || []} rowKey="COMPID" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as CompanyRecord)} searchPlaceholder="Search by name, GST, mobile..." emptyMessage="No companies found." toolbarRight={<button className={ui("cm-btn-primary")} onClick={openCreate}>
            <Plus size={13} /> Add Company
          </button>} />

      {/* Modal */}
      {open && <div className={ui("cm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("cm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Company details">
            <div className={ui("cm-modal-head")}>
              <div>
                <div className={ui("cm-modal-title")}>{editRow ? "Edit Company" : "Add Company"}</div>
                <div className={ui("cm-modal-sub")}>{editRow ? `Editing: ${editRow.COMPANYNAME}` : "Fill in the details below"}</div>
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
                    <label className={ui("cm-field-label")}>Company ID *</label>
                    <Controller name="COMPANYID" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="COMPANYID" onChange={(_, value) => field.onChange(value)} placeholder="e.g. BTS" isCapitalized disabled={!!editRow} className={ui("[max-width:100%]!")} />} />
                    {errors.COMPANYID && <span className={ui("cm-field-error")}>{errors.COMPANYID.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Company Name *</label>
                    <Controller name="COMPANYNAME" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="COMPANYNAME" onChange={(_, value) => field.onChange(value)} placeholder="Full company name" isCapitalized className={ui("[max-width:100%]!")} />} />
                    {errors.COMPANYNAME && <span className={ui("cm-field-error")}>{errors.COMPANYNAME.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Cost ID</label>
                    <Controller name="COSTID" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="COSTID" onChange={(_, value) => field.onChange(value)} placeholder="e.g. BT" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Short Key</label>
                    <Controller name="SHORTKEY" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="SHORTKEY" onChange={(_, value) => field.onChange(value)} placeholder="e.g. B" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Phone</label>
                    <Controller name="PHONE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PHONE" onChange={(_, value) => field.onChange(value)} placeholder="e.g. 04422334455" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Mobile *</label>
                    <Controller name="MOBILE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="MOBILE" onChange={(_, value) => field.onChange(value)} placeholder="10-digit mobile" inputModeType="mobile" className={ui("[max-width:100%]!")} />} />
                    {errors.MOBILE && <span className={ui("cm-field-error")}>{errors.MOBILE.message}</span>}
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Email *</label>
                    <Controller name="EMAIL" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="EMAIL" onChange={(_, value) => field.onChange(value)} placeholder="email@example.com" inputModeType="email" className={ui("[max-width:100%]!")} />} />
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
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 2</label>
                    <Controller name="ADDRESS2" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS2" onChange={(_, value) => field.onChange(value)} placeholder="Area" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 3</label>
                    <Controller name="ADDRESS3" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS3" onChange={(_, value) => field.onChange(value)} placeholder="City" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Address 4</label>
                    <Controller name="ADDRESS4" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS4" onChange={(_, value) => field.onChange(value)} placeholder="State" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Area Code</label>
                    <Controller name="AREACODE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="AREACODE" onChange={(_, value) => field.onChange(value)} placeholder="PIN code" className={ui("[max-width:100%]!")} />} />
                  </div>
                </div>

                <div className={ui("cm-section-label")}>Tax Information</div>
                <div className={ui("cm-grid-2 workspace-form-grid")}>
                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>GST No</label>
                    <Controller name="GSTNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="GSTNO" onChange={(_, value) => field.onChange(value)} placeholder="GST number" isCapitalized inputModeType="gst" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>PAN No</label>
                    <Controller name="PANNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PANNO" onChange={(_, value) => field.onChange(value)} placeholder="PAN number" isCapitalized inputModeType="pan" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TAN No</label>
                    <Controller name="TANNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TANNO" onChange={(_, value) => field.onChange(value)} placeholder="TAN number" isCapitalized className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TDS No</label>
                    <Controller name="TDSNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TDSNO" onChange={(_, value) => field.onChange(value)} placeholder="TDS number" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>TIN No</label>
                    <Controller name="TINNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="TINNO" onChange={(_, value) => field.onChange(value)} placeholder="TIN number" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>CST No</label>
                    <Controller name="CSTNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="CSTNO" onChange={(_, value) => field.onChange(value)} placeholder="CST number" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cm-field-row")}>
                    <label className={ui("cm-field-label")}>Local Tax No</label>
                    <Controller name="LOCALTAXNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="LOCALTAXNO" onChange={(_, value) => field.onChange(value)} placeholder="Local tax number" className={ui("[max-width:100%]!")} />} />
                  </div>
                </div>
              </div>

              <div className={ui("cm-modal-footer")}>
                <button type="button" className={ui("cm-btn-secondary")} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={ui("cm-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Company" : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.COMPANYNAME}"? This action cannot be undone.`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
