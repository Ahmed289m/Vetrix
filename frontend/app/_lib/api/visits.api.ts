import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Visit, VisitCreate, VisitUpdate } from "../types/models";

export const visitsApi = {
  list: () =>
    api.get<ApiResponse<Visit[]>>("/visits").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Visit>>(`/visits/${id}`).then((r) => r.data),

  create: (data: VisitCreate) =>
    api.post<ApiResponse<Visit>>("/visits", data).then((r) => r.data),

  update: (id: string, data: VisitUpdate) =>
    api.put<ApiResponse<Visit>>(`/visits/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ visit_id: string }>>(`/visits/${id}`).then((r) => r.data),
};
