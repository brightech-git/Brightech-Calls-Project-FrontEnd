"use client";

import { ui } from "@/utils/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { DataExport, ExportColumn } from "@/components/DataExport";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useProjectLinkList, useCreateProjectLink, useUpdateProjectLink, useDeleteProjectLink } from "@/hooks/ProjectLink/useProjectLink";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { useProjectTypeList } from "@/hooks/ProjectTypeMaster/useProjectTypeMaster";
import { ProjectLinkRecord, ProjectLinkRecord_Table } from "@/types/ProjectLink/ProjectLink";
import { NativeSelect } from "@chakra-ui/react";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectLinkSchema = z.object({
  CLIENTID: z.number().min(1, "CLIENT is required"),
  projectTypeId: z.number().min(1, "Project type is required"),
  url: z.string().optional(),
  userName: z.string().optional(),
  password: z.string().optional(),
  authPassword: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  active: z.boolean()
});
const TypeCollections = [{
  label: "Desktop",
  value: "D"
}, {
  label: "Mobile",
  value: "M"
}, {
  label: "Website",
  value: "W"
}];
const ProjectStatuses = [{
  label: "Live",
  value: "L"
}, {
  label: "Test",
  value: "T"
}];
const ActiveFilterOptions = [{
  label: "Active",
  value: "true"
}, {
  label: "Inactive",
  value: "false"
}, {
  label: "All",
  value: ""
}];
interface ProjectLinkFilterState {
  active: string;
  clientId: string;
  projectTypeId: string;
  deviceType: string;
}
const FILTER_DEFAULTS: ProjectLinkFilterState = {
  active: "true",
  clientId: "",
  projectTypeId: "",
  deviceType: ""
};
type ProjectLinkForm = z.infer<typeof projectLinkSchema>;

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectLinkForm = {
  CLIENTID: 0,
  projectTypeId: 0,
  url: "",
  userName: "",
  password: "",
  authPassword: "",
  status: "L",
  type: "W",
  active: true
};

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectLinkRecord_Table>[] = [{
  key: "linkId",
  header: "ID",
  width: "70px",
  align: "center"
}, {
  key: "company",
  header: "Client Name",
  render: row => row?.clientName ?? row.clientId ?? "—"
}, {
  key: "projectType",
  header: "Project Type",
  render: row => row.projectTypeName ?? row.projectTypeId ?? "—"
}, {
  key: "url",
  header: "URL",
  render: row => <a href={row.url} target="_blank" rel="noopener noreferrer" className={ui("[color:#34445d] [text-decoration:none]")}>
        {row.url}
      </a>
}, {
  key: "userName",
  header: "User Name"
}, {
  key: "password",
  header: "Password"
}, {
  key: "authPassword",
  header: "Auth Password"
},
// { key: "status", header: "Status",  },
{
  key: "type",
  header: "Type",
  render: row => {
    switch (row.type) {
      case "W":
        return "website";
      case "M":
        return "mobile";
      case "D":
        return "desktop";
      default:
        return row.type;
    }
  }
}, {
  key: "active",
  header: "Active",
  render: row => <span style={{
    background: row.active ? COLORS.successBg : COLORS.errorBg,
    color: row.active ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.active ? "Active" : "Inactive"}
      </span>
}];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ProjectLinkRecord_Table>[] = [{
  key: "linkId",
  label: "ID"
}, {
  key: "Client Name",
  label: "Company",
  exportValue: (_, row) => row?.clientName ?? row.clientId ?? "-"
}, {
  key: "projectType",
  label: "Project Type",
  exportValue: (_, row) => row.projectTypeName ?? "—"
}, {
  key: "url",
  label: "URL"
}, {
  key: "userName",
  label: "User Name"
}, {
  key: "status",
  label: "Status"
}, {
  key: "type",
  label: "Type"
}, {
  key: "active",
  label: "Active",
  exportValue: v => v ? "Active" : "Inactive"
}];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectLinkPage() {
  usePageHeader({
    title: "Project Links",
    subtitle: "Manage project link credentials"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectLinkRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectLinkRecord | null>(null);
  const [filterInputs, setFilterInputs] = useState<ProjectLinkFilterState>(FILTER_DEFAULTS);
  const updateFilter = (key: keyof ProjectLinkFilterState, value: string) => setFilterInputs(prev => ({
    ...prev,
    [key]: value
  }));
  const resetFilters = () => setFilterInputs(FILTER_DEFAULTS);
  const {
    data: clients = []
  } = useClientList();
  const {
    data: projectTypes = []
  } = useProjectTypeList();
  const {
    data: projectLinks = [],
    isLoading
  } = useProjectLinkList({
    active: filterInputs.active === "" ? undefined : filterInputs.active === "true",
    clientId: filterInputs.clientId ? Number(filterInputs.clientId) : undefined,
    projectTypeId: filterInputs.projectTypeId ? Number(filterInputs.projectTypeId) : undefined,
    deviceType: filterInputs.deviceType || undefined
  });
  const clientItems = clients.map(c => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID)
  }));
  const projectTypeItems = projectTypes.map(p => ({
    label: p.projectTypeName,
    value: String(p.projectTypeId)
  }));
  const createMutation = useCreateProjectLink();
  const updateMutation = useUpdateProjectLink();
  const deleteMutation = useDeleteProjectLink();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<ProjectLinkForm>({
    resolver: zodResolver(projectLinkSchema),
    defaultValues: DEFAULTS
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: ProjectLinkRecord_Table) => {
    const r = row as ProjectLinkRecord;
    setEditRow(r);
    reset({
      CLIENTID: r.clientId ?? 0,
      projectTypeId: r.projectTypeId ?? 0,
      url: r.url ?? "",
      userName: r.userName ?? "",
      password: r.password ?? "",
      authPassword: r.authPassword ?? "",
      status: r.status ?? "",
      type: r.type ?? "",
      active: r.active ?? true
    });
    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ProjectLinkForm) => {
    const payload = {
      clientId: data.CLIENTID,
      projectTypeId: data.projectTypeId,
      url: data.url,
      userName: data.userName,
      password: data.password,
      authPassword: data.authPassword,
      status: data.status,
      type: data.type,
      active: data.active
    };
    console.log(payload, 'payload');
    try {
      if (editRow) {
        await updateMutation.mutateAsync({
          id: String(editRow.linkId),
          payload
        });
        toast.success("Project Link Updated", "Project link updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Project Link Created", "Project link created successfully.");
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.linkId), {
      onSuccess: () => {
        toast.success("Project Link Deleted", "Project link deleted successfully.");
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      }
    });
  };

  // ─────────────────────────

  return <>
      

      {/* Table */}
      <div className={ui("workspace-filterbar")}>
        <div className={ui("[display:flex] [flex-direction:column] [align-items:center]")}>
          <div>
            Manage Project Links
          </div>
          <div className={ui("[color:#34445d] [margin-bottom:8px]")}>
            Total Links: <span className={ui("[color:var(--text-main)] [font-weight:600]")}>{projectLinks.length}</span>
          </div>
        </div>
        <div className={ui("[display:flex] [align-items:flex-end] [gap:8px] [flex-wrap:wrap]")}>
          <div className={ui("pl-filter-field")}>
            <label className={ui("pl-filter-label")}>Client</label>
            <SelectCombobox value={filterInputs.clientId || undefined} onChange={val => updateFilter("clientId", val)} items={clientItems} placeholder="All clients" className={ui("[min-width:250px]!")} />
          </div>

          <div className={ui("pl-filter-field")}>
            <label className={ui("pl-filter-label")}>Project Type</label>
            <SelectCombobox value={filterInputs.projectTypeId || undefined} onChange={val => updateFilter("projectTypeId", val)} items={projectTypeItems} placeholder="All types" className={ui("[max-width:250px]!")} />
          </div>

          <div className={ui("pl-filter-field")}>
            <label className={ui("pl-filter-label")}>Device Type</label>
            <NativeSelectWrapper value={filterInputs.deviceType} onChange={e => updateFilter("deviceType", e.target.value)} items={[{
            label: "All Devices",
            value: ""
          }, ...TypeCollections]} className={ui("[max-width:200px]!")} />
          </div>

          <div className={ui("pl-filter-field")}>
            <label className={ui("pl-filter-label")}>Status</label>
            <NativeSelectWrapper value={filterInputs.active} onChange={e => updateFilter("active", e.target.value)} items={ActiveFilterOptions} className={ui("[max-width:110px]!")} />
          </div>

          {(filterInputs.clientId || filterInputs.projectTypeId || filterInputs.deviceType || filterInputs.active !== FILTER_DEFAULTS.active) && <button type="button" className={ui("pl-btn-secondary")} onClick={resetFilters}>
                Clear
              </button>}

          <DataExport data={projectLinks as ProjectLinkRecord_Table[]} columns={EXPORT_COLUMNS} filename="project-links" title="Project Links" showButtons={["excel", "pdf", "print"]} buttonSize="sm" />
          <button className={ui("pl-btn-primary")} onClick={openCreate}>
            <Plus size={13} />
            Add Project Link
          </button>
        </div>
      </div>
     
     
      <CustomTable columns={COLUMNS} data={projectLinks as ProjectLinkRecord_Table[]} rowKey="linkId" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as ProjectLinkRecord)} emptyMessage="No project links found." showSearch={false} />

      {/* Modal */}

      {open && <div className={ui("pl-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("pl-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Project link details">
            <div className={ui("pl-modal-head")}>
              <div>
                <div className={ui("pl-modal-title")}>
                  {editRow ? "Edit Project Link" : "Add Project Link"}
                </div>

                <div className={ui("pl-modal-sub")}>
                  {editRow ? `Editing: Link #${editRow.linkId}` : "Fill project link details"}
                </div>
              </div>

              <button className={ui("pl-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("pl-modal-body")}>
                <div className={ui("pl-grid workspace-form-grid")}>
                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Company *</label>
                    <Controller name="CLIENTID" control={control} render={({
                  field
                }) => <SelectCombobox value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? Number(val) : 0)} editId={editRow?.linkId ?? null} items={clientItems} placeholder="Select company" className={ui("[max-width:100%]!")} />} />
                    {errors.CLIENTID && <span className={ui("pl-field-error")}>{errors.CLIENTID.message}</span>}
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Project Type *</label>
                    <Controller name="projectTypeId" control={control} render={({
                  field
                }) => <SelectCombobox value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? Number(val) : 0)} editId={editRow?.linkId ?? null} items={projectTypeItems} placeholder="Select project type" className={ui("[max-width:100%]!")} />} />
                    {errors.projectTypeId && <span className={ui("pl-field-error")}>{errors.projectTypeId.message}</span>}
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>URL</label>
                    <Controller name="url" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="url" onChange={(_, value) => field.onChange(value)} placeholder="Enter URL" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>User Name</label>
                    <Controller name="userName" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="userName" onChange={(_, value) => field.onChange(value)} placeholder="Enter user name" className={ui("[max-width:100%]!")} />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Password</label>
                    <Controller name="password" control={control} render={({
                  field
                }) => <PasswordInput value={field.value} onChange={e => field.onChange(e.target.value)} placeholder="Enter password" size="xs" />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Auth Password</label>
                    <Controller name="authPassword" control={control} render={({
                  field
                }) => <PasswordInput value={field.value} onChange={e => field.onChange(e.target.value)} placeholder="Enter authorization password" size="xs" />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Status</label>
                    <Controller name="status" control={control} render={({
                  field
                }) =>
                // <CapitalizedInput
                //   value={field.value}
                //   field="status"
                //   isCapitalized
                //   onChange={(_, value) => field.onChange(value)}
                //   placeholder="Enter status"
                //   maxWidth="100%"
                // />
                <NativeSelectWrapper value={field.value ?? ""} onChange={value => field.onChange(value)} items={ProjectStatuses} className={ui("border-[#222]" + " " + "[font-size:var(--font-sm)]!")} placeholder="Select status" css={{
                  border: "1px solid #DDD",
                  bg: "#EEE"
                }} />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Type</label>
                    <Controller name="type" control={control} render={({
                  field
                }) =>
                // <CapitalizedInput
                //   value={field.value}
                //   field="type"
                //   isCapitalized
                //   onChange={(_, value) => field.onChange(value)}
                //   placeholder="Enter type"
                //   maxWidth="100%"
                // />
                <NativeSelectWrapper value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} items={TypeCollections} className={ui("border-[#222]" + " " + "[font-size:var(--font-sm)]!")} css={{
                  border: "1px solid #DDD",
                  bg: "#EEE"
                }} />} />
                  </div>

                  <div className={ui("pl-field-row")}>
                    <label className={ui("pl-field-label")}>Active</label>
                    <Controller name="active" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                  </div>
                </div>
              </div>

              <div className={ui("pl-modal-footer")}>
                <button type="button" className={ui("pl-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className={ui("pl-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />

                  {isPending ? "Saving..." : editRow ? "Update Link" : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}

      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete link #${deleteRow?.linkId}?`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
