import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/app/_lib/api/appointments.api";
import type { AppointmentCreate, AppointmentUpdate } from "@/app/_lib/types/models";

export const APPOINTMENTS_KEY = ["appointments"] as const;

export function useAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_KEY,
    queryFn: () => appointmentsApi.list(),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentCreate) => appointmentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}
