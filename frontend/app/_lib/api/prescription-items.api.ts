import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type {
  PrescriptionItem,
  PrescriptionItemCreate,
  PrescriptionItemUpdate,
} from "../types/models";

export const prescriptionItemsApi = {
  list: () =>
    api.get<ApiResponse<PrescriptionItem[]>>("/prescription-items").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<PrescriptionItem>>(`/prescription-items/${id}`).then((r) => r.data),

  create: (data: PrescriptionItemCreate) =>
    api.post<ApiResponse<PrescriptionItem>>("/prescription-items", data).then((r) => r.data),

  update: (id: string, data: PrescriptionItemUpdate) =>
    api
      .put<ApiResponse<PrescriptionItem>>(`/prescription-items/${id}`, data)
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<ApiResponse<{ prescriptionItem_id: string }>>(`/prescription-items/${id}`)
      .then((r) => r.data),
};
