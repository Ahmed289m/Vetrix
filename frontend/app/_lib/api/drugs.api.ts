import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Drug, DrugCreate, DrugUpdate, DrugInteractionResult } from "../types/models";

export const drugsApi = {
  list: () =>
    api.get<ApiResponse<Drug[]>>("/drugs").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Drug>>(`/drugs/${id}`).then((r) => r.data),

  create: (data: DrugCreate) =>
    api.post<ApiResponse<Drug>>("/drugs", data).then((r) => r.data),

  update: (id: string, data: DrugUpdate) =>
    api.put<ApiResponse<Drug>>(`/drugs/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ drug_id: string }>>(`/drugs/${id}`).then((r) => r.data),

  checkInteractions: (drug_ids: string[]) =>
    api.post<ApiResponse<DrugInteractionResult>>("/drugs/check-interactions", { drug_ids }).then((r) => r.data),
};
