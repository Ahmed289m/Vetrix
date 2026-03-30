import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Clinic, ClinicCreate, ClinicUpdate } from "../types/models";

export const clinicsApi = {
  list: () =>
    api.get<ApiResponse<Clinic[]>>("/clinics").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Clinic>>(`/clinics/${id}`).then((r) => r.data),

  create: (data: ClinicCreate) =>
    api.post<ApiResponse<Clinic>>("/clinics", data).then((r) => r.data),

  update: (id: string, data: ClinicUpdate) =>
    api.put<ApiResponse<Clinic>>(`/clinics/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ clinic_id: string }>>(`/clinics/${id}`).then((r) => r.data),
};
