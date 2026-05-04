import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitsApi } from "@/app/_lib/api/visits.api";
import type { VisitCreate, VisitUpdate } from "@/app/_lib/types/models";

export const VISITS_KEY = ["visits"] as const;
const LIST_STALE_TIME = 1000 * 30;
const DETAIL_STALE_TIME = 1000 * 15;
const QUERY_GC_TIME = 1000 * 60 * 20;

export function useVisits(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: VISITS_KEY,
    queryFn: () => visitsApi.list(),
    staleTime: LIST_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: options?.enabled !== false,
  });
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: [...VISITS_KEY, id],
    queryFn: () => visitsApi.get(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: QUERY_GC_TIME,
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
