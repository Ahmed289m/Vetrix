import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionItemsApi } from "@/app/_lib/api/prescription-items.api";
import type {
  PrescriptionItemCreate,
  PrescriptionItemUpdate,
} from "@/app/_lib/types/models";

export const PRESCRIPTION_ITEMS_KEY = ["prescription-items"] as const;
const LIST_STALE_TIME = 1000 * 60;
const DETAIL_STALE_TIME = 1000 * 30;
const QUERY_GC_TIME = 1000 * 60 * 30;

export function usePrescriptionItems() {
  return useQuery({
    queryKey: PRESCRIPTION_ITEMS_KEY,
    queryFn: () => prescriptionItemsApi.list(),
    staleTime: LIST_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function usePrescriptionItem(id: string) {
  return useQuery({
    queryKey: [...PRESCRIPTION_ITEMS_KEY, id],
    queryFn: () => prescriptionItemsApi.get(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useCreatePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionItemCreate) =>
      prescriptionItemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}

export function useUpdatePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PrescriptionItemUpdate }) =>
      prescriptionItemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}

export function useDeletePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionItemsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}
