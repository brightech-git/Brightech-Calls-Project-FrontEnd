"use client";

import { useState } from "react";
import { Box, HStack, Text, VStack, Grid } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, UserPlus } from "lucide-react";

import { FormField, FieldConfig } from "@/components/FormField";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/StaffMaster/useStaffMaster";
import { StaffRecord, StaffRecord_Table } from "@/types/StaffMaster/StaffMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  STAFFNAME: z.string().min(1, "Name is required"),
  MOBILENO:  z.string().min(10, "Enter a valid mobile number"),
  ROLE:      z.string().min(1, "Role is required"),
  ADDRESS1:  z.string().min(1, "Address line 1 is required"),
  ADDRESS2:  z.string(),
  ADDRESS3:  z.string(),
  DOJ:       z.string(),
  ACTIVE:    z.enum(["Y", "N"]),
});

type StaffForm = z.infer<typeof staffSchema>;

// ─── Fields ───────────────────────────────────────────────────────────────────

const FIELDS: FieldConfig<StaffForm>[] = [
  { name: "STAFFNAME", label: "Staff Name",   type: "text",   placeholder: "e.g. Sathyapriya", required: true, colSpan: 1 },
  { name: "MOBILENO",  label: "Mobile No",    type: "tel",    placeholder: "e.g. 9659721856",  required: true, colSpan: 1 },
  { name: "ROLE",      label: "Role",         type: "select", placeholder: "Pick a role",      required: true, colSpan: 1,
    options: [
      { label: "Admin",    value: "ADMIN" },
      { label: "Manager",  value: "MANAGER" },
      { label: "Operator", value: "OPERATOR" },
      { label: "Staff",    value: "STAFF" },
    ],
  },
  { name: "ACTIVE",    label: "Status",       type: "select", placeholder: "Pick status",      required: true, colSpan: 1,
    options: [
      { label: "Active",   value: "Y" },
      { label: "Inactive", value: "N" },
    ],
  },
  { name: "DOJ",       label: "Date of Join", type: "date",   colSpan: 1 },
  { name: "ADDRESS1",  label: "Address Line 1", type: "text", placeholder: "Street",           required: true, colSpan: 1 },
  { name: "ADDRESS2",  label: "Address Line 2", type: "text", placeholder: "Area",             colSpan: 1 },
  { name: "ADDRESS3",  label: "City",           type: "text", placeholder: "City",             colSpan: 1 },
];

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<StaffRecord_Table>[] = [
  { key: "SNO",       header: "#",        align: "center", width: "50px" },
  { key: "STAFFID",   header: "Staff ID", sortable: true,  width: "80px" },
  { key: "STAFFNAME", header: "Name",     sortable: true },
  { key: "MOBILENO",  header: "Mobile",   sortable: true },
  { key: "ROLE",      header: "Role",     sortable: true },
  { key: "ADDRESS1",  header: "Address",  sortable: true },
  { key: "DOJ",       header: "DOJ",      sortable: true },
  { key: "ACTIVE",    header: "Status",   sortable: true,  isStatus: true,
    render: (row) => (row.ACTIVE === "Y" ? "Active" : "Inactive"),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffMasterPage() {
  const [open, setOpen]       = useState(false);
  const [editRow, setEditRow] = useState<StaffRecord | null>(null);

  const { data: staffList = [], isLoading } = useStaffList();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffForm, unknown, StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { STAFFNAME: "", MOBILENO: "", ROLE: "", ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", DOJ: "", ACTIVE: "Y" },
  });

  const openCreate = () => {
    setEditRow(null);
    reset({ STAFFNAME: "", MOBILENO: "", ROLE: "", ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", DOJ: "", ACTIVE: "Y" });
    setOpen(true);
  };

  const openEdit = (row: StaffRecord_Table) => {
    const r = row as StaffRecord;
    setEditRow(r);
    reset({
      STAFFNAME: r.STAFFNAME ?? "",
      MOBILENO:  r.MOBILENO  ?? "",
      ROLE:      r.ROLE      ?? "",
      ADDRESS1:  r.ADDRESS1  ?? "",
      ADDRESS2:  r.ADDRESS2  ?? "",
      ADDRESS3:  r.ADDRESS3  ?? "",
      DOJ:       r.DOJ       ?? "",
      ACTIVE:    r.ACTIVE === "N" ? "N" : "Y",
    });
    setOpen(true);
  };

  const onSubmit = async (data: StaffForm) => {
    if (editRow) {
      await updateMutation.mutateAsync({ id: editRow.SNO, payload: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setOpen(false);
    reset();
  };

  const handleDelete = (row: StaffRecord_Table) => {
    if (confirm(`Delete staff "${row.STAFFNAME}"?`)) {
      deleteMutation.mutate((row as StaffRecord).SNO);
    }
  };

  const tableData = staffList as StaffRecord_Table[];

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(30,58,95,0.35);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 40px 16px; z-index: 1000; overflow-y: auto;
        }
        .modal-box {
          background: #ffffff; border: 1px solid #dbeafe;
          border-radius: 14px; width: 100%; max-width: 740px;
          font-family: 'DM Sans','Inter',sans-serif; margin: auto;
          box-shadow: 0 8px 32px rgba(59,130,246,0.12);
        }
        .modal-head {
          padding: 18px 22px 14px; border-bottom: 1px solid #dbeafe;
          display: flex; align-items: center; justify-content: space-between;
          background: #eff6ff; border-radius: 14px 14px 0 0;
        }
        .modal-body  { padding: 22px; background: #ffffff; }
        .modal-footer {
          padding: 14px 22px; border-top: 1px solid #dbeafe;
          display: flex; justify-content: flex-end; gap: 10px;
          background: #f8faff; border-radius: 0 0 14px 14px;
        }
        .section-divider {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #3b82f6;
          padding-bottom: 8px; border-bottom: 1px solid #dbeafe;
          margin-bottom: 14px; margin-top: 20px;
        }
        .section-divider:first-of-type { margin-top: 0; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 36px; border-radius: 8px; border: none;
          background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
          box-shadow: 0 2px 8px rgba(59,130,246,0.2);
        }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 36px; border-radius: 8px;
          border: 1px solid #dbeafe; background: #ffffff; color: #64748b;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .btn-ghost:hover { background: #eff6ff; color: #3b82f6; }
        .close-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid #dbeafe; background: #ffffff; color: #93c5fd;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .close-btn:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
        .modal-box input, .modal-box textarea, .modal-box select {
          background: #f8faff !important; border: 1px solid #bfdbfe !important; color: #1e3a5f !important;
        }
        .modal-box input::placeholder, .modal-box textarea::placeholder { color: #93c5fd !important; }
        .modal-box input:focus, .modal-box textarea:focus {
          border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.15) !important;
        }
        .modal-box label { color: #3b82f6 !important; }
      `}</style>

      {/* Page header */}
      <HStack justify="space-between" mb="20px" align="center">
        <Box>
          <Text fontSize="18px" fontWeight="700" color="#1e3a5f" letterSpacing="-0.02em">
            Staff Master
          </Text>
          <Text fontSize="12px" color="#93c5fd" mt="2px">
            Manage your staff records
          </Text>
        </Box>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={14} /> Add Staff
        </button>
      </HStack>

      {/* Table */}
      <CustomTable
        title="All Staff"
        columns={COLUMNS}
        data={tableData}
        rowKey="SNO"
        selectable
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search by name, role, mobile..."
        emptyMessage="No staff found. Add your first record."
        toolbarRight={
          <button className="btn-primary" onClick={openCreate}>
            <UserPlus size={13} /> Add Staff
          </button>
        }
        bulkActionSlot={(rows, clear) => (
          <HStack gap="8px">
            <Text fontSize="12px" color="#1d4ed8">{rows.length} selected</Text>
            <button className="btn-ghost" style={{ height: 28, padding: "0 12px", fontSize: 12 }} onClick={clear}>
              Clear
            </button>
          </HStack>
        )}
      />

      {/* Modal */}
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <Box>
                <Text fontSize="15px" fontWeight="700" color="#1e3a5f">
                  {editRow ? "Edit Staff" : "Add New Staff"}
                </Text>
                <Text fontSize="11px" color="#93c5fd" mt="1px">
                  {editRow ? `Editing: ${editRow.STAFFNAME}` : "Fill in the details below"}
                </Text>
              </Box>
              <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="section-divider">Basic Information</div>
                <Grid templateColumns="1fr 1fr" gap="14px">
                  {FIELDS.filter((f) => ["STAFFNAME", "MOBILENO", "ROLE", "ACTIVE", "DOJ"].includes(f.name)).map((f) => (
                    <Box key={f.name}>
                      <FormField field={f} control={control} errors={errors} />
                    </Box>
                  ))}
                </Grid>

                <div className="section-divider">Address</div>
                <Grid templateColumns="1fr 1fr" gap="14px">
                  {FIELDS.filter((f) => ["ADDRESS1", "ADDRESS2", "ADDRESS3"].includes(f.name)).map((f) => (
                    <Box key={f.name}>
                      <FormField field={f} control={control} errors={errors} />
                    </Box>
                  ))}
                </Grid>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {isSubmitting || createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editRow ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
