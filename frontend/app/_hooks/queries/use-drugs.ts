import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { drugsApi } from "@/app/_lib/api/drugs.api";
import type { DrugCreate, DrugUpdate } from "@/app/_lib/types/models";

export const DRUGS_KEY = ["drugs"] as const;

export function useDrugs() {
  return useQuery({
    queryKey: DRUGS_KEY,
    queryFn: () => drugsApi.list(),
  });
}

export function useDrug(id: string) {
  return useQuery({
    queryKey: [...DRUGS_KEY, id],
    queryFn: () => drugsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDrug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DrugCreate) => drugsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRUGS_KEY }),
  });
}

export function useUpdateDrug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DrugUpdate }) =>
      drugsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRUGS_KEY }),
  });
}

export function useDeleteDrug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => drugsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRUGS_KEY }),
  });
}
