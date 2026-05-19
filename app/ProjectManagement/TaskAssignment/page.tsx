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
  useCallsBookingList,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useDeleteCallsBooking,
} from "@/hooks/TaskAssignment/useTaskAssignment";

import {
  CallsBookingRecord,
  CallsBookingRecord_Table,
} from "@/types/TaskAssignment/TaskAssignment";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const callsBookingSchema = z.object({
  TKTID: z.number().min(1, "Ticket ID is required"),

  TKTDATE: z.string().optional(),

  COMPID: z.number().min(1, "Company ID is required"),

  PROJECTID: z.string().optional(),

  PROJECTNAME: z.string().optional(),

  MODULEID: z.string().optional(),

  MODULENAME: z.string().optional(),

  DESCRIPTION: z.string().optional(),

  REMARK: z.string().optional(),

  STAFFID: z.string().min(
    1,
    "Staff ID is required"
  ),

  STATUS: z.string().optional(),

  USERID: z.string().min(
    1,
    "User ID is required"
  ),

  ACTIVE: z.enum(["Y", "N"]),
});

type CallsBookingForm = z.infer<
  typeof callsBookingSchema
>;

// ─────────────────────────────────────────────
// Fields
// ─────────────────────────────────────────────

const LW = "120px";

const FIELDS: FieldConfig<CallsBookingForm>[] =
  [
    {
      name: "TKTID",
      label: "Ticket ID",
      type: "number",
      placeholder: "Enter ticket id",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 1,
    },

    {
      name: "TKTDATE",
      label: "Ticket Date",
      type: "date",
      placeholder: "Select date",
      inline: true,
      labelWidth: LW,
      tabIndex: 2,
    },

    {
      name: "COMPID",
      label: "Company ID",
      type: "number",
      placeholder: "Enter company id",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 3,
    },

    {
      name: "PROJECTID",
      label: "Project ID",
      type: "text",
      placeholder: "Enter project id",
      inline: true,
      labelWidth: LW,
      tabIndex: 4,
    },

    {
      name: "PROJECTNAME",
      label: "Project Name",
      type: "text",
      placeholder: "Enter project name",
      inline: true,
      labelWidth: LW,
      tabIndex: 5,
    },

    {
      name: "MODULEID",
      label: "Module ID",
      type: "text",
      placeholder: "Enter module id",
      inline: true,
      labelWidth: LW,
      tabIndex: 6,
    },

    {
      name: "MODULENAME",
      label: "Module Name",
      type: "text",
      placeholder: "Enter module name",
      inline: true,
      labelWidth: LW,
      tabIndex: 7,
    },

    {
      name: "STAFFID",
      label: "Staff ID",
      type: "text",
      placeholder: "Enter staff id",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 8,
    },

    {
      name: "USERID",
      label: "User ID",
      type: "text",
      placeholder: "Enter user id",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 9,
    },

    {
      name: "STATUS",
      label: "Status",
      type: "select",
      placeholder: "Select status",
      inline: true,
      labelWidth: LW,
      tabIndex: 10,

      options: [
        {
          label: "Open",
          value: "OPEN",
        },
        {
          label: "In Progress",
          value: "INPROGRESS",
        },
        {
          label: "Completed",
          value: "COMPLETED",
        },
        {
          label: "Cancelled",
          value: "CANCELLED",
        },
      ],
    },

    {
      name: "ACTIVE",
      label: "Active",
      type: "select",
      placeholder: "Select status",
      required: true,
      inline: true,
      labelWidth: LW,
      tabIndex: 11,

      options: [
        {
          label: "Active",
          value: "Y",
        },
        {
          label: "Inactive",
          value: "N",
        },
      ],
    },

    {
      name: "DESCRIPTION",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      inline: true,
      labelWidth: LW,
      tabIndex: 12,
    },

    {
      name: "REMARK",
      label: "Remark",
      type: "textarea",
      placeholder: "Enter remarks",
      inline: true,
      labelWidth: LW,
      tabIndex: 13,
    },
  ];

// ─────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────

const BASIC = [
  "TKTID",
  "TKTDATE",
  "COMPID",
  "PROJECTID",
  "PROJECTNAME",
  "MODULEID",
  "MODULENAME",
];

const ASSIGNMENT = [
  "STAFFID",
  "USERID",
  "STATUS",
  "ACTIVE",
];

const DETAILS = [
  "DESCRIPTION",
  "REMARK",
];

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] =
  [
    {
      key: "TKTID",
      header: "Ticket ID",
      sortable: true,
      width: "100px",
    },

    {
      key: "PROJECTNAME",
      header: "Project",
      sortable: true,
    },

    {
      key: "MODULENAME",
      header: "Module",
      sortable: true,
    },

    {
      key: "STAFFID",
      header: "Staff",
      sortable: true,
    },

    {
      key: "STATUS",
      header: "Status",
      sortable: true,

      render: (row) => (
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,

            background:
              row.STATUS ===
              "COMPLETED"
                ? COLORS.successBg
                : row.STATUS ===
                  "CANCELLED"
                ? COLORS.errorBg
                : COLORS.warningBg,

            color:
              row.STATUS ===
              "COMPLETED"
                ? COLORS.success
                : row.STATUS ===
                  "CANCELLED"
                ? COLORS.error
                : COLORS.warning,
          }}
        >
          {row.STATUS || "OPEN"}
        </span>
      ),
    },

    {
      key: "ACTIVE",
      header: "Active",

      render: (row) => (
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,

            background:
              row.ACTIVE === "Y"
                ? COLORS.successBg
                : COLORS.errorBg,

            color:
              row.ACTIVE === "Y"
                ? COLORS.success
                : COLORS.error,
          }}
        >
          {row.ACTIVE === "Y"
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },
  ];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  TKTID: 0,
  TKTDATE: "",

  COMPID: 0,

  PROJECTID: "",
  PROJECTNAME: "",

  MODULEID: "",
  MODULENAME: "",

  DESCRIPTION: "",
  REMARK: "",

  STAFFID: "",
  USERID: "",

  STATUS: "OPEN",

  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  usePageHeader({
    title: "Calls Booking",
    subtitle:
      "Manage calls & task assignments",
  });

  const toast = useToast();

  const [open, setOpen] =
    useState(false);

  const [editRow, setEditRow] =
    useState<CallsBookingRecord | null>(
      null
    );

  const [deleteRow, setDeleteRow] =
    useState<CallsBookingRecord | null>(
      null
    );

  const {
    data: bookings = [],
    isLoading,
  } = useCallsBookingList();

  const createMutation =
    useCreateCallsBooking();

  const updateMutation =
    useUpdateCallsBooking();

  const deleteMutation =
    useDeleteCallsBooking();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<CallsBookingForm>({
    resolver: zodResolver(
      callsBookingSchema
    ),

    defaultValues: DEFAULTS,
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);

    reset(DEFAULTS);

    setOpen(true);
  };

  const openEdit = (
    row: CallsBookingRecord_Table
  ) => {
    const r =
      row as CallsBookingRecord;

    setEditRow(r);

    reset({
      TKTID: r.TKTID,
      TKTDATE:
        r.TKTDATE?.split("T")[0] || "",

      COMPID: r.COMPID,

      PROJECTID: r.PROJECTID || "",
      PROJECTNAME:
        r.PROJECTNAME || "",

      MODULEID: r.MODULEID || "",
      MODULENAME:
        r.MODULENAME || "",

      DESCRIPTION:
        r.DESCRIPTION || "",

      REMARK: r.REMARK || "",

      STAFFID: r.STAFFID || "",

      USERID: r.USERID || "",

      STATUS: r.STATUS || "OPEN",

      ACTIVE:
        r.ACTIVE === "N"
          ? "N"
          : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: CallsBookingForm
  ) => {
    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync(
            {
              id: String(editRow.SNO),
              payload: data,
            }
          );

        toast.success(
          "Booking Updated",
          `"${res.TKTID}" updated successfully.`
        );
      } else {
        const res =
          await createMutation.mutateAsync(
            data
          );

        toast.success(
          "Booking Created",
          `"${res.TKTID}" created successfully.`
        );
      }

      setOpen(false);

      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow
          ? "Update Failed"
          : "Create Failed",

        err?.response?.data
          ?.message ||
          err?.message ||
          "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(
      String(deleteRow.SNO),

      {
        onSuccess: () => {
          toast.success(
            "Booking Deleted",
            `Ticket "${deleteRow.TKTID}" deleted successfully.`
          );

          setDeleteRow(null);
        },

        onError: (err: any) => {
          toast.error(
            "Delete Failed",

            err?.response?.data
              ?.message ||
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
        .cb-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: flex-start;
          justify-content: center;

          z-index: 1000;

          padding: 10px 16px;

          overflow-y: auto;
        }

        .cb-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 960px;

          height: 90vh;

          display: flex;
          flex-direction: column;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: cb-slide-up 0.18s ease;
        }

        .cb-modal-box form {
          display: flex;
          flex-direction: column;

          flex: 1;
          min-height: 0;
        }

        @keyframes cb-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cb-modal-head {
          padding: 10px 14px 8px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl}
            ${RADIUS.xl} 0 0;

          flex-shrink: 0;
        }

        .cb-modal-title {
          font-size: 13px;
          font-weight: 700;

          color: ${COLORS.textPrimary};
        }

        .cb-modal-sub {
          font-size: 10px;
          color: ${COLORS.textMuted};

          margin-top: 1px;
        }

        .cb-modal-body {
          padding: 10px 14px;

          overflow-y: auto;

          flex: 1;
          min-height: 0;
        }

        .cb-modal-footer {
          padding: 8px 14px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0
            ${RADIUS.xl}
            ${RADIUS.xl};

          flex-shrink: 0;
        }

        .cb-section-label {
          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.1em;

          text-transform: uppercase;

          color: ${COLORS.textMuted};

          padding-bottom: 4px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          margin-bottom: 6px;
          margin-top: 10px;
        }

        .cb-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }

        .cb-btn-primary {
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

        .cb-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .cb-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cb-btn-secondary {
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

        .cb-close-btn {
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
        title="All Calls Bookings"
        columns={COLUMNS}
        data={
          bookings as CallsBookingRecord_Table[]
        }
        rowKey="SNO"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(
            row as CallsBookingRecord
          )
        }
        searchPlaceholder="Search ticket, project, module..."
        emptyMessage="No bookings found."
        toolbarRight={
          <button
            className="cb-btn-primary"
            onClick={openCreate}
          >
            <Plus size={13} />
            Add Booking
          </button>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="cb-modal-overlay"
          onClick={(e) =>
            e.target ===
              e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="cb-modal-box">
            <div className="cb-modal-head">
              <div>
                <div className="cb-modal-title">
                  {editRow
                    ? "Edit Booking"
                    : "Add Booking"}
                </div>

                <div className="cb-modal-sub">
                  {editRow
                    ? `Editing Ticket: ${editRow.TKTID}`
                    : "Fill booking details"}
                </div>
              </div>

              <button
                className="cb-close-btn"
                onClick={() =>
                  setOpen(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                onSubmit
              )}
            >
              <div className="cb-modal-body">
                <div className="cb-section-label">
                  Basic Information
                </div>

                <div className="cb-grid-2">
                  {FIELDS.filter((f) =>
                    BASIC.includes(f.name)
                  ).map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
                </div>

                <div className="cb-section-label">
                  Assignment
                </div>

                <div className="cb-grid-2">
                  {FIELDS.filter((f) =>
                    ASSIGNMENT.includes(
                      f.name
                    )
                  ).map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
                </div>

                <div className="cb-section-label">
                  Details
                </div>

                <div className="cb-grid-2">
                  {FIELDS.filter((f) =>
                    DETAILS.includes(
                      f.name
                    )
                  ).map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  className="cb-btn-secondary"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="cb-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Booking"
                    : "Create Booking"}
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
        isPending={
          deleteMutation.isPending
        }
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteRow(null)
        }
      />
    </>
  );
}