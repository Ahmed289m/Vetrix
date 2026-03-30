import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "../types/models";

export const appointmentsApi = {
  list: () =>
    api.get<ApiResponse<Appointment[]>>("/appointments").then((r) => r.data),

  create: (data: AppointmentCreate) =>
    api.post<ApiResponse<Appointment>>("/appointments", data).then((r) => r.data),

  update: (id: string, data: AppointmentUpdate) =>
    api.put<ApiResponse<Appointment>>(`/appointments/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ appointment_id: string }>>(`/appointments/${id}`).then((r) => r.data),
};
