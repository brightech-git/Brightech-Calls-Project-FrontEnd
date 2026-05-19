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
  useProjectList,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/ProjectMaster/useProjectMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";

import {
  ProjectRecord,
  ProjectRecord_Table,
} from "@/types/ProjectMaster/ProjectMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectSchema = z.object({
  CLIENTID: z.number().min(1, "Client is required"),
  PROJECTNAME: z.string().min(1, "Project name is required"),
  ACTIVE: z.enum(["Y", "N"]),
});

type ProjectForm = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// Fields
// ─────────────────────────────────────────────

const LW = "120px";

const BASE_FIELDS: FieldConfig<ProjectForm>[] = [
  {
    name: "PROJECTNAME",
    label: "Project Name",
    type: "text",
    placeholder: "Enter project name",
    required: true,
    inline: true,
    labelWidth: LW,
    capitalize: true,
    tabIndex: 2,
  },
  {
    name: "ACTIVE",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    required: true,
    inline: true,
    labelWidth: LW,
    tabIndex: 3,
    options: [
      { label: "Active", value: "Y" },
      { label: "Inactive", value: "N" },
    ],
  },
];

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectRecord_Table>[] = [
  { key: "projectId",   header: "ID",           sortable: true, width: "60px", align: "center" },
  { key: "clientName",  header: "Client Name",  sortable: true },
  { key: "projectName", header: "Project Name", sortable: true },
  {
    key: "updated",
    header: "Updated",
    sortable: true,
    render: (row) => row.updated ? new Date(row.updated as string).toLocaleDateString() : "-",
  },
  {
    key: "active",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
        color:      row.active === "Y" ? COLORS.success   : COLORS.error,
      }}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectForm = {
  CLIENTID: 0,
  PROJECTNAME: "",
  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectMasterPage() {
  usePageHeader({
    title: "Project Master",
    subtitle: "Manage project records",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [editRow, setEditRow] =
    useState<ProjectRecord | null>(null);

  const [deleteRow, setDeleteRow] =
    useState<ProjectRecord | null>(null);

  const { data: clients = [] } = useClientList();
  const {
    data: projects = [],
    isLoading,
  } = useProjectList();

  const FIELDS: FieldConfig<ProjectForm>[] = [
    {
      name: "CLIENTID",
      label: "Client",
      type: "select",
      placeholder: "Select client",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 1,
      options: clients.map((c) => ({ label: c.CLIENTNAME, value: c.CLIENTID })),
    },
    ...BASE_FIELDS,
  ];

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULTS,
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);

    reset(DEFAULTS);

    setOpen(true);
  };

  const openEdit = (
    row: ProjectRecord_Table
  ) => {
    const r = row as ProjectRecord;

    setEditRow(r);

    reset({
      CLIENTID: r.clientId,
      PROJECTNAME: r.projectName ?? "",
      ACTIVE: r.active === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: ProjectForm
  ) => {
    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync({
            id: String(editRow.sno),
            payload: data,
          });

        toast.success("Project Updated", `"${res.projectName}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success("Project Created", `"${res.projectName}" created successfully.`);
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
      String(deleteRow.sno),

      {
        onSuccess: () => {
          toast.success("Project Deleted", `"${deleteRow.projectName}" deleted successfully.`);

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
        .pm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
          padding: 16px;
        }

        .pm-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 700px;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: pm-slide-up 0.18s ease;
        }

        @keyframes pm-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pm-modal-head {
          padding: 12px 16px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }

        .pm-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
        }

        .pm-modal-sub {
          font-size: 11px;
          color: ${COLORS.textMuted};
          margin-top: 2px;
        }

        .pm-modal-body {
          padding: 16px;
        }

        .pm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }

        .pm-modal-footer {
          padding: 12px 16px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }

        .pm-btn-primary {
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

        .pm-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .pm-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pm-btn-secondary {
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

        .pm-close-btn {
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
        title="All Projects"
        columns={COLUMNS}
        data={projects as ProjectRecord_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(row as ProjectRecord)
        }
        searchPlaceholder="Search project..."
        emptyMessage="No projects found."
        toolbarRight={
          <button
            className="pm-btn-primary"
            onClick={openCreate}
          >
            <Plus size={13} />
            Add Project
          </button>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="pm-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="pm-modal-box">
            <div className="pm-modal-head">
              <div>
                <div className="pm-modal-title">
                  {editRow
                    ? "Edit Project"
                    : "Add Project"}
                </div>

                <div className="pm-modal-sub">
                  {editRow
                    ? `Editing: ${editRow.projectName}`
                    : "Fill project details"}
                </div>
              </div>

              <button
                className="pm-close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="pm-modal-body">
                <div className="pm-grid">
                  {FIELDS.map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
                </div>
              </div>

              <div className="pm-modal-footer">
                <button
                  type="button"
                  className="pm-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pm-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Project"
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.projectName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}