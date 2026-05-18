import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
} from "@/services/StaffMasterService";
import { StaffPayload } from "@/types/StaffMaster/StaffMaster";

const STAFF_KEY = ["staff-list"];

export const useStaffList = () =>
  useQuery({ queryKey: STAFF_KEY, queryFn: getAllStaff });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffPayload) => createStaff(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StaffPayload }) =>
      updateStaff(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
};
