import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitsApi } from "@/app/_lib/api/visits.api";
import type { VisitCreate, VisitUpdate } from "@/app/_lib/types/models";

export const VISITS_KEY = ["visits"] as const;

export function useVisits() {
  return useQuery({
    queryKey: VISITS_KEY,
    queryFn: () => visitsApi.list(),
  });
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: [...VISITS_KEY, id],
    queryFn: () => visitsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VisitCreate) => visitsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}

export function useUpdateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VisitUpdate }) =>
      visitsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}

export function useDeleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}
