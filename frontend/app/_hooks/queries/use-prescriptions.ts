import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionsApi } from "@/app/_lib/api/prescriptions.api";
import { PRESCRIPTION_ITEMS_KEY } from "./use-prescription-items";
import type {
  PrescriptionCreate,
  PrescriptionUpdate,
} from "@/app/_lib/types/models";

export const PRESCRIPTIONS_KEY = ["prescriptions"] as const;
const LIST_STALE_TIME = 1000 * 60;
const DETAIL_STALE_TIME = 1000 * 30;
const QUERY_GC_TIME = 1000 * 60 * 30;

export function usePrescriptions() {
  return useQuery({
    queryKey: PRESCRIPTIONS_KEY,
    queryFn: () => prescriptionsApi.list(),
    staleTime: LIST_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, id],
    queryFn: () => prescriptionsApi.get(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionCreate) => prescriptionsApi.create(data),
    onSuccess: () => {
      // Backend creates prescription items alongside the prescription,
      // so both caches must be invalidated for the UI to resolve drug IDs.
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY });
      qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY });
    },
  });
}

export function useUpdatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PrescriptionUpdate }) =>
      prescriptionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  });
}

export function useDeletePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY });
      qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY });
    },
  });
}
