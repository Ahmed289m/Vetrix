import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicsApi } from "@/app/_lib/api/clinics.api";
import type { ClinicCreate, ClinicUpdate } from "@/app/_lib/types/models";

export const CLINICS_KEY = ["clinics"] as const;

export function useClinics() {
  return useQuery({
    queryKey: CLINICS_KEY,
    queryFn: () => clinicsApi.list(),
  });
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: [...CLINICS_KEY, id],
    queryFn: () => clinicsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClinicCreate) => clinicsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLINICS_KEY }),
  });
}

export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClinicUpdate }) =>
      clinicsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLINICS_KEY }),
  });
}

export function useDeleteClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clinicsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLINICS_KEY }),
  });
}
