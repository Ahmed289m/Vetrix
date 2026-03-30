import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "@/app/_lib/api/pets.api";
import type { PetCreate, PetUpdate } from "@/app/_lib/types/models";

export const PETS_KEY = ["pets"] as const;
const LIST_STALE_TIME = 1000 * 60;
const DETAIL_STALE_TIME = 1000 * 30;
const QUERY_GC_TIME = 1000 * 60 * 30;

export function usePets() {
  return useQuery({
    queryKey: PETS_KEY,
    queryFn: () => petsApi.list(),
    staleTime: LIST_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: [...PETS_KEY, id],
    queryFn: () => petsApi.get(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PetCreate) => petsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PETS_KEY }),
  });
}

export function useUpdatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PetUpdate }) =>
      petsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PETS_KEY }),
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PETS_KEY }),
  });
}
