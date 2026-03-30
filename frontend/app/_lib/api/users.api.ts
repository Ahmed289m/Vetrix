import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";
import type {
  User,
  UserCreate,
  UserUpdate,
  UserCreated,
} from "../types/models";

export const usersApi = {
  list: () => api.get<ApiResponse<User[]>>("/users").then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) =>
    api.post<ApiResponse<UserCreated>>("/users", data).then((r) => r.data.data),

  update: (id: string, data: UserUpdate) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<ApiResponse<{ user_id: string }>>(`/users/${id}`)
      .then((r) => r.data),

  resetPassword: (id: string) =>
    api
      .post<ApiResponse<UserCreated>>(`/users/${id}/show-password`, {})
      .then((r) => r.data),
};
