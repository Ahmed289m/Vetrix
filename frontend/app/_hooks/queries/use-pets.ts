import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "@/app/_lib/api/pets.api";
import type { PetCreate, PetUpdate } from "@/app/_lib/types/models";

export const PETS_KEY = ["pets"] as const;

export function usePets() {
  return useQuery({
    queryKey: PETS_KEY,
    queryFn: () => petsApi.list(),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: [...PETS_KEY, id],
    queryFn: () => petsApi.get(id),
    enabled: !!id,
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
