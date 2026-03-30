import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionItemsApi } from "@/app/_lib/api/prescription-items.api";
import type {
  PrescriptionItemCreate,
  PrescriptionItemUpdate,
} from "@/app/_lib/types/models";

export const PRESCRIPTION_ITEMS_KEY = ["prescription-items"] as const;

export function usePrescriptionItems() {
  return useQuery({
    queryKey: PRESCRIPTION_ITEMS_KEY,
    queryFn: () => prescriptionItemsApi.list(),
  });
}

export function usePrescriptionItem(id: string) {
  return useQuery({
    queryKey: [...PRESCRIPTION_ITEMS_KEY, id],
    queryFn: () => prescriptionItemsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionItemCreate) =>
      prescriptionItemsApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}

export function useUpdatePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PrescriptionItemUpdate }) =>
      prescriptionItemsApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}

export function useDeletePrescriptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionItemsApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: PRESCRIPTION_ITEMS_KEY }),
  });
}
