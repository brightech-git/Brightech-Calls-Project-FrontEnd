import { axiosInstance } from "@/api/axiosInstance";
import { ClientPayload, ClientRecord } from "@/types/ClientMaster/ClientMaster";

export const createClient = async (payload: ClientPayload): Promise<ClientRecord> => {
  const response = await axiosInstance.post<ClientRecord>("/client", payload);
  return response.data;
};

export const getAllClients = async (): Promise<ClientRecord[]> => {
  const response = await axiosInstance.get<ClientRecord[]>("/client");
  return response.data;
};

export const getClientById = async (id: string): Promise<ClientRecord> => {
  const response = await axiosInstance.get<ClientRecord>(`/client/${id}`);
  return response.data;
};

export const updateClient = async (id: string, payload: ClientPayload): Promise<ClientRecord> => {
  const response = await axiosInstance.put<ClientRecord>(`/client/${id}`, payload);
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/client/${id}`);
};
