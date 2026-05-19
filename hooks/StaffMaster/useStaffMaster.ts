import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "@/services/StaffMasterService";
import { StaffPayload } from "@/types/StaffMaster/StaffMaster";

const STAFF_KEY = ["staff-list"];

export const useStaffList = () =>
  useQuery({ queryKey: STAFF_KEY, queryFn: getAllStaff });

export const useGetStaffById = (id: string) =>
  useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaffById(id),
    enabled: !!id,
  });

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
    mutationFn: ({ id, payload }: { id: string; payload: StaffPayload }) =>
      updateStaff(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
};
