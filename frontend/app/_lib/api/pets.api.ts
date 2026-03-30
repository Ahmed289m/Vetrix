import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type { Pet, PetCreate, PetUpdate } from "../types/models";

export const petsApi = {
  list: () =>
    api.get<ApiResponse<Pet[]>>("/pets").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Pet>>(`/pets/${id}`).then((r) => r.data),

  create: (data: PetCreate) =>
    api.post<ApiResponse<Pet>>("/pets", data).then((r) => r.data),

  update: (id: string, data: PetUpdate) =>
    api.put<ApiResponse<Pet>>(`/pets/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ pet_id: string }>>(`/pets/${id}`).then((r) => r.data),
};
