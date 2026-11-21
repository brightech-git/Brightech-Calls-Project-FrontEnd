'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from '@/src/module/client-master/api/client-master.api';
import { ClientPayload } from '@/src/module/client-master/type/client-master.types';

const CLIENT_KEY = ['client-list'];

export const useClientList = () =>
  useQuery({ queryKey: CLIENT_KEY, queryFn: getAllClients, select: (res) => res.data });

export const useGetClientById = (id: string) =>
  useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id),
    enabled: !!id,
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEY }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientPayload }) =>
      updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEY }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEY }),
  });
};
