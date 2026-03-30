import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Prescription, PrescriptionCreate, PrescriptionUpdate } from "../types/models";

export const prescriptionsApi = {
  list: () =>
    api.get<ApiResponse<Prescription[]>>("/prescriptions").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`).then((r) => r.data),

  create: (data: PrescriptionCreate) =>
    api.post<ApiResponse<Prescription>>("/prescriptions", data).then((r) => r.data),

  update: (id: string, data: PrescriptionUpdate) =>
    api.put<ApiResponse<Prescription>>(`/prescriptions/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<ApiResponse<{ prescription_id: string }>>(`/prescriptions/${id}`)
      .then((r) => r.data),
};
