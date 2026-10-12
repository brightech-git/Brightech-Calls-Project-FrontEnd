"use client";

import { ui } from "@/utils/ui";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Image as ImageIcon, Search, RotateCcw } from "lucide-react";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { FileUploader } from "@/components/ui/FileUploadInput";
import { MediaLightbox, LightboxItem } from "@/components/ui/MediaLightbox";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useClientVisitList, useCreateClientVisit, useUpdateClientVisit, useDeleteClientVisit } from "@/hooks/ApiHooks/ClientVisit/useClientVisit";
import { ClientVisitRecord, ClientVisitRecord_Table } from "@/types/ClientVisit/ClientVisit";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";
import InputField from "@/components/ui/InputField";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

// ─── Media URL helper ──────────────────────────────────────────────────────────
// Media paths come back server-relative (e.g. "/uploads/clientvisit/xxx.jpg"),
// rooted at the API host, not under the "/api/v1" prefix used for JSON calls.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8111/api/v1";
const MEDIA_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");
const mediaUrl = (path: string) => path.startsWith("http") ? path : `${MEDIA_ORIGIN}${path}`;
const today = new Date().toISOString().split("T")[0];

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientVisitSchema = z.object({
  COMPANYNAME: z.string().min(1, "Client name is required"),
  COMPANYID: z.string().optional(),
  PHONE: z.string().optional(),
  MOBILE: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  EMAIL: z.string().optional(),
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
  status: z.string().optional().or(z.literal("")),
  existingSoftware: z.string().optional(),
  remainder: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"])
});
function getStatusDesc(val?: string): string {
  if (!val) return "";
  switch (val) {
    case "P":
      return "PENDING";
    case "I":
      return "IN PROGRESS";
    case "O":
      return "ON GOING";
    case "C":
      return "COMPLETED";
    case "R":
      return "REJECTED";
    default:
      return val;
  }
}
type ClientVisitForm = z.infer<typeof clientVisitSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

function buildColumns(onToggleActive: (row: ClientVisitRecord_Table) => void): TableColumn<ClientVisitRecord_Table>[] {
  return [{
    key: "ID",
    header: "S.NO",
    align: "center",
    width: "50px"
  }, {
    key: "COMPANYNAME",
    header: "Client Name"
  }, {
    key: "MOBILE",
    header: "Mobile"
  }, {
    key: "REMARKS",
    header: "Remark"
  }, {
    key: "ADDRESS2",
    header: "Area"
  }, {
    key: "ADDRESS3",
    header: "City"
  }, {
    key: "EMAIL",
    header: "Email"
  }, {
    key: "existingSoftware",
    header: "Exisiting S/w"
  }, {
    key: "status",
    header: "Status",
    render: row => <div>
          {getStatusDesc(row.status)}
        </div>
  }, {
    key: "remainder",
    header: "Remainder"
  }, {
    key: "CREATEDAT",
    header: "Created",
    render: row => <div className={ui("[font-size:12px]")}>
        {formatDateForShow(row.CREATEDAT)}
        </div>
  }, {
    key: "media",
    header: "Media",
    align: "center",
    width: "80px",
    render: row => <span className={ui("[display:inline-flex] [align-items:center] [gap:4px] [font-size:11px] [color:var(--text-muted)]")}>
          <ImageIcon size={13} /> {row.media?.length ?? 0}
        </span>
  }, {
    key: "ACTIVE",
    header: "Active",
    render: row => <span onClick={e => {
      e.stopPropagation();
      onToggleActive(row);
    }} title={row.ACTIVE === "Y" ? "Click to deactivate" : "Click to activate"} style={{
      background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
      color: row.ACTIVE === "Y" ? COLORS.success : COLORS.error
    }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:11px] [font-weight:600] [cursor:pointer] [user-select:none]")}>
          {row.ACTIVE === "Y" ? "Active" : "Inactive"}
        </span>
  }];
}

// ─── Default values ───────────────────────────────────────────────────────────

// ─── Filter defaults ──────────────────────────────────────────────────────────

interface ClientVisitFilterState {
  fromDate: string;
  toDate: string;
  search: string;
  mobile: string;
  area: string;
  city: string;
  active: "" | "Y" | "N";
  status: string;
}
const FILTER_DEFAULTS: ClientVisitFilterState = {
  fromDate: new Date().toISOString().split("T")[0],
  toDate: new Date().toISOString().split("T")[0],
  search: "",
  mobile: "",
  area: "",
  city: "",
  active: "Y",
  status: ""
};
const DEFAULTS: ClientVisitForm = {
  COMPANYNAME: "",
  COMPANYID: "",
  SHORTKEY: "",
  PHONE: "",
  MOBILE: "",
  EMAIL: "",
  ACTIVE: "Y",
  ADDRESS1: "",
  ADDRESS2: "",
  ADDRESS3: "",
  REMARKS: "",
  AREACODE: "",
  GSTNO: "",
  PANNO: "",
  remainder: today,
  existingSoftware: "",
  status: ""
  //  TANNO: "", TDSNO: "", TINNO: "", CSTNO: "", LOCALTAXNO: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientVisitMasterPage() {
  usePageHeader({
    title: "Client Visit Master",
    subtitle: "Manage client visit records"
  });
  const statusList = [{
    label: "PENDING",
    value: "P"
  }, {
    label: "INPROGRESS",
    value: "I"
  }, {
    label: "ONGOING",
    value: "O"
  }, {
    label: "COMPLETED",
    value: "C"
  }, {
    label: "REJECTED",
    value: "R"
  }];
  console.log(today, "new date");
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ClientVisitRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientVisitRecord | null>(null);
  const [media, setMedia] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  // ── Filters ──
  const [filterInputs, setFilterInputs] = useState<ClientVisitFilterState>(FILTER_DEFAULTS);
  const [filters, setFilters] = useState<ClientVisitFilterState>(FILTER_DEFAULTS);

  // Debounce the free-text filter fields so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setFilters(filterInputs), 400);
    return () => clearTimeout(timer);
  }, [filterInputs]);
  const updateFilter = (key: keyof ClientVisitFilterState, value: string) => setFilterInputs(prev => ({
    ...prev,
    [key]: value
  }));
  const resetFilters = () => setFilterInputs(FILTER_DEFAULTS);

  // const handleApplyFilters = () =>{}

  const {
    data: visits = [],
    isLoading
  } = useClientVisitList({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    search: filters.search || undefined,
    mobile: filters.mobile || undefined,
    area: filters.area || undefined,
    city: filters.city || undefined,
    active: filters.active || undefined,
    status: filters.status || undefined
  });
  console.log(visits, 'visits');
  visits.map(v => console.log(formatDateForShow(v.CREATEDAT), 'created'));
  const createMutation = useCreateClientVisit();
  const updateMutation = useUpdateClientVisit();
  const deleteMutation = useDeleteClientVisit();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const toggleActive = (row: ClientVisitRecord_Table) => {
    const r = row as ClientVisitRecord;
    const nextActive = r.ACTIVE === "Y" ? "N" : "Y";
    updateMutation.mutate({
      id: String(r.ID),
      payload: {
        COMPANYNAME: r.COMPANYNAME ?? "",
        COMPANYID: r.COMPANYID ?? "",
        SHORTKEY: r.SHORTKEY ?? "",
        PHONE: r.PHONE ?? "",
        MOBILE: r.MOBILE ?? "",
        EMAIL: r.EMAIL ?? "",
        ADDRESS1: r.ADDRESS1 ?? "",
        ADDRESS2: r.ADDRESS2 ?? "",
        ADDRESS3: r.ADDRESS3 ?? "",
        REMARKS: r.REMARKS ?? "",
        AREACODE: r.AREACODE ?? "",
        GSTNO: r.GSTNO ?? "",
        PANNO: r.PANNO ?? "",
        ACTIVE: nextActive
      }
    }, {
      onSuccess: () => {
        toast.success(nextActive === "Y" ? "Visit Activated" : "Visit Deactivated", `"${r.COMPANYNAME}" is now ${nextActive === "Y" ? "active" : "inactive"}.`);
      },
      onError: (err: any) => {
        toast.error("Update Failed", err?.response?.data?.message || "Could not change status.");
      }
    });
  };
  const COLUMNS = buildColumns(toggleActive);
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<ClientVisitForm>({
    resolver: zodResolver(clientVisitSchema),
    defaultValues: DEFAULTS
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
      COMPANYNAME: r.COMPANYNAME ?? "",
      COMPANYID: r.COMPANYID ?? "",
      //   COSTID:      r.COSTID      ?? "",
      SHORTKEY: r.SHORTKEY ?? "",
      PHONE: r.PHONE ?? "",
      MOBILE: r.MOBILE ?? "",
      EMAIL: r.EMAIL ?? "",
      ACTIVE: r.ACTIVE === "N" ? "N" : "Y",
      ADDRESS1: r.ADDRESS1 ?? "",
      ADDRESS2: r.ADDRESS2 ?? "",
      ADDRESS3: r.ADDRESS3 ?? "",
      REMARKS: r.REMARKS ?? "",
      AREACODE: r.AREACODE ?? "",
      GSTNO: r.GSTNO ?? "",
      PANNO: r.PANNO ?? "",
      // TANNO:       r.TANNO       ?? "",
      // TDSNO:       r.TDSNO       ?? "",
      // TINNO:       r.TINNO       ?? "",
      // CSTNO:       r.CSTNO       ?? "",
      // LOCALTAXNO:  r.LOCALTAXNO  ?? "",
      remainder: r.remainder ?? today,
      existingSoftware: r.existingSoftware,
      status: r.status
    });
    setOpen(true);
  };
  const onSubmit = async (data: ClientVisitForm) => {
    console.log(data, 'form data');
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.ID),
          payload: data,
          media
        });
        toast.success("Visit Updated", `"${res.COMPANYNAME}" updated successfully.`);
      } else {
        console.log(data, 'form data');
        const res = await createMutation.mutateAsync({
          payload: data,
          media
        });
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
    console.log(r, "rowdetails");
    const fields: [string, unknown][] = [["Short Key", r.SHORTKEY], ["Phone", r.PHONE], ["Mobile", r.MOBILE], ["Email", r.EMAIL], ["Address 1", r.ADDRESS1], ["Area", r.ADDRESS2], ["City", r.ADDRESS3], ["PINCODE", r.AREACODE], ["GST No", r.GSTNO], ["PAN No", r.PANNO],
    // ["TAN No",       r.TANNO],
    // ["TDS No",       r.TDSNO],
    // ["TIN No",       r.TINNO],
    // ["CST No",       r.CSTNO],
    // ["Local Tax No", r.LOCALTAXNO],
    ["Remarks", r.REMARKS], ["Existing S/w", r.existingSoftware]];
    return <div className={ui("[display:flex] [flex-direction:column] [gap:10px] [font-family:var(--font-poppins),_'Poppins',_sans-serif]")}>
        <div className={ui("[display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:6px_24px]")}>
          {fields.map(([label, val]) => <div key={label} className={ui("[font-size:12px]")}>
              <span className={ui("[font-weight:600] [color:#34445d]")}>{label}: </span>
              <span className={ui("[color:var(--text-main)]")}>{String(val ?? "—")}</span>
            </div>)}
        </div>

        {r.media && r.media.length > 0 && <div>
            <div className={ui("[font-size:10px] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.08em] [color:var(--text-muted)] [margin-bottom:6px]")}>
              Media
            </div>
            <div className={ui("[display:flex] [flex-wrap:wrap] [gap:8px]")}>
              {r.media.map((m, idx) => <div key={m.id ?? idx} onClick={() => setLightbox({
            items: r.media as LightboxItem[],
            index: idx
          })} style={{
            border: `1px solid ${COLORS.cardBorder}`
          }} className={ui("[width:70px] [height:70px] [border-radius:10px] [overflow:hidden] [cursor:pointer]")}>
                  {m.mediaType === "VIDEO" ? <video src={mediaUrl(m.mediaUrl ?? "")} muted className={ui("[width:100%] [height:100%] [object-fit:cover]")} /> : <img src={mediaUrl(m.mediaUrl ?? "")} alt={`media-${idx}`} className={ui("[width:100%] [height:100%] [object-fit:cover]")} />}
                </div>)}
            </div>
          </div>}
      </div>;
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
      }
    });
  };
  return <>
      

      {/* Filters */}
      <div className={ui("mb-3 rounded-xl border border-gray-200 bg-white p-2 shadow-sm workspace-filterbar" + " " + "[padding:1rem]")}>
        <div className={ui("flex flex-wrap items-end gap-3")}>

          {/* From Date */}
          <div className={ui("flex min-w-[140px] flex-col gap-1.5")}>
            <label className={ui("text-xs font-semibold text-gray-700")}>
              From Date
            </label>

            <DatePickerInput onChange={val => updateFilter("fromDate", val)} value={filterInputs.fromDate} defaultValue={today} maxDate={today} />
          </div>

          {/* To Date */}
          <div className={ui("flex min-w-[140px] flex-col gap-1.5")}>
            <label className={ui("text-xs font-semibold text-gray-700")}>
              To Date
            </label>

            <DatePickerInput onChange={val => updateFilter("toDate", val)} value={filterInputs.toDate} defaultValue={today} minDate={filterInputs.fromDate} maxDate={today} />
          </div>

          {/* Status */}
          <div className={ui("flex min-w-[150px] flex-col gap-1.5")}>
            <label className={ui("text-xs font-semibold text-gray-700")}>
              Status
            </label>

            <SelectCombobox items={statusList} value={filterInputs.status} onChange={val => updateFilter("status", val)} />
          </div>

          {/* Search */}
          <div className={ui("min-w-[180px]")}>
            <InputField label="Search" placeholder="Search by name..." value={filterInputs.search} onChange={e => updateFilter("search", e.target.value)} />
          </div>

          {/* Mobile */}
          <div className={ui("min-w-[160px]")}>
            <InputField label="Mobile" placeholder="Enter mobile number" value={filterInputs.mobile} onChange={e => updateFilter("mobile", e.target.value)} />
          </div>

          {/* Area */}
          <div className={ui("min-w-[150px]")}>
            <InputField label="Area" placeholder="Enter area" value={filterInputs.area} onChange={e => updateFilter("area", e.target.value)} />
          </div>

          {/* City */}
          <div className={ui("min-w-[150px]")}>
            <InputField label="City" placeholder="Enter city" value={filterInputs.city} onChange={e => updateFilter("city", e.target.value)} />
          </div>

          {/* Active */}
          <div className={ui("flex min-w-[125px] flex-col gap-1.5")}>
            <label className={ui("text-xs font-semibold text-gray-700")}>
              Active
            </label>

            <select value={filterInputs.active} onChange={e => updateFilter("active", e.target.value)} className={ui("\r\n          h-9 w-full rounded-md\r\n          border border-gray-300\r\n          bg-white px-3\r\n          text-sm text-gray-700\r\n          outline-none\r\n          transition\r\n          focus:border-blue-500\r\n          focus:ring-2\r\n          focus:ring-blue-100\r\n        ")}>
              <option value="">All</option>
              <option value="Y">Active</option>
              <option value="N">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className={ui("ml-auto flex items-center gap-2")}>

            {/* Reset */}
            <button type="button" onClick={resetFilters} className={ui("cv-btn-secondary")}>
              <RotateCcw size={14} />
              Reset
            </button>

            {/* Apply */}
            {/* <button
              type="button"
              onClick={handleApplyFilters}
              className="
             inline-flex h-9 items-center gap-1.5
             rounded-md
             bg-blue-600 px-3.5
             text-sm font-medium text-white
             shadow-sm
             transition
             hover:bg-blue-700
             active:scale-[0.98]
             "
             >
              <Search size={14} />
              Apply
             </button> */}

            {/* Add Client */}
            <button type="button" onClick={openCreate} className={ui("cv-btn-primary")}>
              <Plus size={14} />
              Add Client Visit
            </button>

          </div>
        </div>
      </div>

      {/* Table */}
      <CustomTable
    // title="All Client Visits"
    columns={COLUMNS} data={visits as ClientVisitRecord_Table[] || []} rowKey="ID" isLoading={isLoading} onEdit={openEdit}
    // onDelete={(row) => setDeleteRow(row as ClientVisitRecord)}
    expandedRowRender={renderExpandedRow}
    // searchPlaceholder="Search by name, GST, mobile..."
    emptyMessage="No client visits found."
    // toolbarRight={
    //   <button className="cv-btn-primary" onClick={openCreate}>
    //     <Plus size={13} /> Add Client Visit
    //   </button>
    // }
    showSearch={false} />

      {/* Modal */}
      {open && <div className={ui("cv-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("cv-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Client visit details">
            <div className={ui("cv-modal-head")}>
              <div>
                <div className={ui("cv-modal-title")}>{editRow ? "Edit Client Visit" : "Add Client Visit"}</div>
                <div className={ui("cv-modal-sub")}>{editRow ? `Editing: ${editRow.COMPANYNAME}` : "Fill in the details below"}</div>
              </div>
              <button className={ui("cv-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, errs => {
          const first = Object.values(errs)[0];
          const msg = (first as any)?.message || "Please fix the form errors.";
          toast.error("Validation Error", msg);
        })}>
              <div className={ui("cv-modal-body")}>
                <div className={ui("cv-section-label")}>Basic Information</div>
                <div className={ui("cv-grid-2 workspace-form-grid")}>
                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Client Name *</label>
                    <Controller name="COMPANYNAME" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="COMPANYNAME" onChange={(_, value) => field.onChange(value)} placeholder="Full client name" isCapitalized className={ui("[max-width:100%]!")} />} />
                    {errors.COMPANYNAME && <span className={ui("cv-field-error")}>{errors.COMPANYNAME.message}</span>}
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

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Short Key</label>
                    <Controller name="SHORTKEY" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="SHORTKEY" onChange={(_, value) => field.onChange(value)} placeholder="e.g. B" max={3} className={ui("[max-width:100%]!")} />} />
                  </div>

                  {/* <div className="cv-field-row">
                    <label className="cv-field-label">Mobile</label>
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
                          max={9999999999}
                          type="number"
                        />
                      )}
                    />
                   </div> */}

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Mobile *</label>
                    <Controller name="MOBILE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="MOBILE" onChange={(_, value) => field.onChange(value)} placeholder="10-digit mobile" inputModeType="mobile" max={9999999999} type="number" className={ui("[max-width:100%]!")} />} />
                    {errors.MOBILE && <span className={ui("cv-field-error")}>{errors.MOBILE.message}</span>}
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Email *</label>
                    <Controller name="EMAIL" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="EMAIL" onChange={(_, value) => field.onChange(value)} placeholder="email@example.com" inputModeType="email" className={ui("[max-width:100%]!")} />} />
                    {errors.EMAIL && <span className={ui("cv-field-error")}>{errors.EMAIL.message}</span>}
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Active *</label>
                    <Controller name="ACTIVE" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} trueValue="Y" falseValue="N" labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                    {errors.ACTIVE && <span className={ui("cv-field-error")}>{errors.ACTIVE.message}</span>}
                  </div>

                  <div className={ui("cv-field-row cv-field-row-full")}>
                    <label className={ui("cv-field-label")}>Remarks</label>
                    <Controller name="REMARKS" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="REMARKS" onChange={(_, value) => field.onChange(value)} placeholder="Visit notes / remarks" className={ui("[max-width:100%]!")} />} />
                  </div>
                </div>

                <div className={ui("cv-section-label")}>Address</div>
                <div className={ui("cv-grid-2 workspace-form-grid")}>
                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Address 1</label>
                    <Controller name="ADDRESS1" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS1" onChange={(_, value) => field.onChange(value)} placeholder="Street" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>AREA</label>
                    <Controller name="ADDRESS2" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS2" onChange={(_, value) => field.onChange(value)} placeholder="Enter area" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>CITY</label>
                    <Controller name="ADDRESS3" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS3" onChange={(_, value) => field.onChange(value)} placeholder="Enter city" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>Area code</label>
                    <Controller name="AREACODE" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="AREACODE" onChange={(_, value) => field.onChange(value)} placeholder="Enter area code" className={ui("[max-width:100%]!")} />} />
                  </div>
                </div>

                <div className={ui("cv-section-label")}>Tax Information</div>
                <div className={ui("cv-grid-2 workspace-form-grid")}>
                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>GST No</label>
                    <Controller name="GSTNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="GSTNO" onChange={(_, value) => field.onChange(value)} placeholder="GST number" isCapitalized inputModeType="gst" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>PAN No</label>
                    <Controller name="PANNO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PANNO" onChange={(_, value) => field.onChange(value)} placeholder="PAN number" isCapitalized inputModeType="pan" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>STATUS</label>
                    <Controller name="status" control={control} render={({
                  field
                }) => <SelectCombobox value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? String(val) : "")}
                //editId={editRow?.status ?? null}
                items={statusList} size="md" />} />
                    </div>
                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>EXISTING SOFTWARE</label>
                    <Controller name="existingSoftware" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="existingSoftware" onChange={(_, value) => field.onChange(value)} placeholder="existingSoftware" className={ui("[max-width:100%]!")} />} />
                  </div>
                  <div className={ui("cv-field-row")}>
                    <label className={ui("cv-field-label")}>REMAINDER</label>
                    <Controller name="remainder" control={control} render={({
                  field
                }) => <DatePickerInput minDate={today} value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? String(val) : "")} placeholder="remainder" className={ui("[max-width:100%]!")} />} />
                  </div>

                  {/* <div className="cv-field-row">
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
                   </div> */}
                </div>

                <div className={ui("cv-section-label")}>Visit Media</div>

                {editRow && !!editRow.media?.length && <div className={ui("cv-existing-media")}>
                    {editRow.media.map((m, i) => <div key={m.id ?? i} className={ui("cv-existing-media-item")}>
                        {m.mediaType === "VIDEO" ? <video src={mediaUrl(m.mediaUrl ?? "")} muted /> : <img src={mediaUrl(m.mediaUrl ?? "")} alt={`Visit media ${i + 1}`} />}
                      </div>)}
                  </div>}

                <FileUploader mode="multiple" maxFiles={5} acceptTypes={["image", "video"]} showPreview dropzoneText="Drag images or videos here" buttonText="Choose Media" onFilesChange={setMedia} onError={msg => toast.error("Media Error", msg)} />
              </div>

              <div className={ui("cv-modal-footer")}>
                <button type="button" className={ui("cv-btn-secondary")} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={ui("cv-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Visit" : "Create Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.COMPANYNAME}"? This action cannot be undone.`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />

      {lightbox && <MediaLightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(prev => prev ? {
      ...prev,
      index: i
    } : prev)} />}
    </>;
}
