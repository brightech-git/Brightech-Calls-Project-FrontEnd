"use client";

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

import {
  useProjectLinkList,
  useCreateProjectLink,
  useUpdateProjectLink,
  useDeleteProjectLink,
} from "@/hooks/ProjectLink/useProjectLink";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { useProjectTypeList } from "@/hooks/ProjectTypeMaster/useProjectTypeMaster";

import {
  ProjectLinkRecord,
  ProjectLinkRecord_Table,
} from "@/types/ProjectLink/ProjectLink";
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
  status: z.string().optional(),
  type: z.string().optional(),
  active: z.boolean(),
});

const TypeCollections = [
  {label:"Desktop",value:"D"},
  {label:"Mobile",value:"M"},
  {label:"Website",value:"W"}
]

const ProjectStatuses = [
  {label:"Live",value:"A"},
  {label:"Test",value:"I"},
]

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
  status: "",
  type: "W",
  active: true,
};

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectLinkRecord_Table>[] = [
  { key: "linkId", header: "ID",  width: "70px", align: "center" },
  {
    key: "company", header: "Company", 
    render: (row) => row?.CLIENTNAME ?? row.clientId ?? "—",
  },
  {
    key: "projectType", header: "Project Type", 
    render: (row) => row.projectTypeName ?? row.projectTypeId ?? "—",
  },
  {
    key: "url",
    header: "URL",

    render: (row) => (
      <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.textSecondary, textDecoration: "none" }}>
        {row.url}
      </a>
    ),
  },
  { key: "userName", header: "User Name",  },
  { key: "password", header: "Password",  },
  { key: "status", header: "Status",  },
  { key: "type", header: "Type",  },
  {
    key: "active",
    header: "Active",
    
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.active ? COLORS.successBg : COLORS.errorBg,
        color:      row.active ? COLORS.success   : COLORS.error,
      }}>
        {row.active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ProjectLinkRecord_Table>[] = [
  { key: "linkId", label: "ID" },
  // { key: "company", label: "Company", exportValue: (_, row) => row.client?.CLIENTNAME ?? "—" },
  { key: "projectType", label: "Project Type", exportValue: (_, row) => row.projectTypeName ?? "—" },
  { key: "url", label: "URL" },
  { key: "userName", label: "User Name" },
  { key: "status", label: "Status" },
  { key: "type", label: "Type" },
  { key: "active", label: "Active", exportValue: (v) => v ? "Active" : "Inactive" },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectLinkPage() {
  usePageHeader({
    title: "Project Links",
    subtitle: "Manage project link credentials",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [editRow, setEditRow] =
    useState<ProjectLinkRecord | null>(null);

  const [deleteRow, setDeleteRow] =
    useState<ProjectLinkRecord | null>(null);

  const { data: clients = [] } = useClientList();
  const { data: projectTypes = [] } = useProjectTypeList();
  const { data: projectLinks = [], isLoading } = useProjectLinkList();

  console.log(projectLinks,'projectLinks')
  const clientItems = clients.map((c) => ({ label: c.CLIENTNAME, value: String(c.CLIENTID) }));

  console.log(clientItems,'clientItems')
  const projectTypeItems = projectTypes.map((p) => ({ label: p.projectTypeName, value: String(p.projectTypeId) }));

  const createMutation = useCreateProjectLink();
  const updateMutation = useUpdateProjectLink();
  const deleteMutation = useDeleteProjectLink();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<ProjectLinkForm>({
    resolver: zodResolver(projectLinkSchema),
    defaultValues: DEFAULTS,
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);

    reset(DEFAULTS);

    setOpen(true);
  };

  const openEdit = (
    row: ProjectLinkRecord_Table
  ) => {
    const r = row as ProjectLinkRecord;

    setEditRow(r);

    reset({
      CLIENTID: r.clientId ?? 0,
      projectTypeId: r.projectTypeId ?? 0,
      url: r.url ?? "",
      userName: r.userName ?? "",
      password: r.password ?? "",
      status: r.status ?? "",
      type: r.type ?? "",
      active: r.active ?? true,
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: ProjectLinkForm
  ) => {
    const payload = {
      clientId:  data.CLIENTID ,
      projectTypeId:data.projectTypeId ,
      url: data.url,
      userName: data.userName,
      password: data.password,
      status: data.status,
      type: data.type,
      active: data.active,
    };
    console.log(payload,'payload')

    try {
      if (editRow) {
        await updateMutation.mutateAsync({
          id: String(editRow.linkId),
          payload,
        });

        toast.success(
          "Project Link Updated",
          "Project link updated successfully."
        );
      } else {
        await createMutation.mutateAsync(payload);

        toast.success(
          "Project Link Created",
          "Project link created successfully."
        );
      }

      setOpen(false);

      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow
          ? "Update Failed"
          : "Create Failed",

        err?.response?.data?.message ||
          err?.message ||
          "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(
      String(deleteRow.linkId),

      {
        onSuccess: () => {
          toast.success(
            "Project Link Deleted",
            "Project link deleted successfully."
          );

          setDeleteRow(null);
        },

        onError: (err: any) => {
          toast.error(
            "Delete Failed",
            err?.response?.data?.message ||
              "Delete failed."
          );

          setDeleteRow(null);
        },
      }
    );
  };

  // ─────────────────────────

  return (
    <>
      <style>{`
        .pl-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
          padding: 16px;
        }

        .pl-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 720px;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: pl-slide-up 0.18s ease;
        }

        @keyframes pl-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pl-modal-head {
          padding: 12px 16px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }

        .pl-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
        }

        .pl-modal-sub {
          font-size: 11px;
          color: ${COLORS.textMuted};
          margin-top: 2px;
        }

        .pl-modal-body {
          padding: 16px;
        }

        .pl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }

        .pl-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pl-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .pl-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .pl-modal-footer {
          padding: 12px 16px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }

        .pl-btn-primary {
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

        .pl-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .pl-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pl-btn-secondary {
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

        .pl-close-btn {
          width: 26px;
          height: 26px;

          border-radius: 6px;

          border: 1px solid ${COLORS.cardBorder};

          background: ${COLORS.cardBg};

          cursor: pointer;
        }
      `}</style>

      {/* Table */}

      <CustomTable
        title="All Project Links"
        columns={COLUMNS}
        data={projectLinks as ProjectLinkRecord_Table[]}
        rowKey="linkId"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(row as ProjectLinkRecord)
        }
        searchPlaceholder="Search project link..."
        emptyMessage="No project links found."
        
        toolbarRight={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DataExport
              data={projectLinks as ProjectLinkRecord_Table[]}
              columns={EXPORT_COLUMNS}
              filename="project-links"
              title="Project Links"
              showButtons={["excel", "pdf", "print"]}
              buttonSize="sm"
            />
            <button
              className="pl-btn-primary"
              onClick={openCreate}
            >
              <Plus size={13} />
              Add Project Link
            </button>
          </div>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="pl-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="pl-modal-box">
            <div className="pl-modal-head">
              <div>
                <div className="pl-modal-title">
                  {editRow
                    ? "Edit Project Link"
                    : "Add Project Link"}
                </div>

                <div className="pl-modal-sub">
                  {editRow
                    ? `Editing: Link #${editRow.linkId}`
                    : "Fill project link details"}
                </div>
              </div>

              <button
                className="pl-close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="pl-modal-body">
                <div className="pl-grid">
                  <div className="pl-field-row">
                    <label className="pl-field-label">Company *</label>
                    <Controller
                      name="CLIENTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.linkId ?? null}
                          items={clientItems}
                          placeholder="Select company"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.CLIENTID && <span className="pl-field-error">{errors.CLIENTID.message}</span>}
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">Project Type *</label>
                    <Controller
                      name="projectTypeId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.linkId ?? null}
                          items={projectTypeItems}
                          placeholder="Select project type"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.projectTypeId && <span className="pl-field-error">{errors.projectTypeId.message}</span>}
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">URL</label>
                    <Controller
                      name="url"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="url"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter URL"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">User Name</label>
                    <Controller
                      name="userName"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="userName"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter user name"
                          maxWidth="100%"
                        />
                      )}
                    />
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">Password</label>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <PasswordInput
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Enter password"
                          size="xs"
                        />
                      )}
                    />
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">Status</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        // <CapitalizedInput
                        //   value={field.value}
                        //   field="status"
                        //   isCapitalized
                        //   onChange={(_, value) => field.onChange(value)}
                        //   placeholder="Enter status"
                        //   maxWidth="100%"
                        // />
                        <NativeSelectWrapper 
                          value={field.value ?? ""}
                          onChange={(value)=>field.onChange(value)}
                          items={ProjectStatuses}
                          fontSize="sm"
                          className="border-[#222]"
                          placeholder="Select status"
                          css={{
                            border :"1px solid #DDD",
                            bg :"#EEE"
                          }}
                        />

                      )}
                    />
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">Type</label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        // <CapitalizedInput
                        //   value={field.value}
                        //   field="type"
                        //   isCapitalized
                        //   onChange={(_, value) => field.onChange(value)}
                        //   placeholder="Enter type"
                        //   maxWidth="100%"
                        // />
                        <NativeSelectWrapper
                          value={field.value ?? ""}
                          fontSize="sm"
                          onChange={(e) => field.onChange(e.target.value)}
                          items={TypeCollections}
                          className="border-[#222]"
                          css={{
                            border: "1px solid #DDD",
                            bg: "#EEE"
                          }}
                        />
                      )}
                    />
                  </div>

                  <div className="pl-field-row">
                    <label className="pl-field-label">Active</label>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          labels={{ on: "Active", off: "Inactive" }}
                          size="sm"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="pl-modal-footer">
                <button
                  type="button"
                  className="pl-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pl-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Link"
                    : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete link #${deleteRow?.linkId}?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
