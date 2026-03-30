import { api } from "../axios";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
} from "../types/api.types";

export const authApi = {
  login: (data: LoginRequest) =>
    api
      .post<ApiResponse<LoginResponse>>("/auth/login", data)
      .then((r) => r.data),

  refresh: (refreshToken: string) =>
    api
      .post<
        ApiResponse<LoginResponse>
      >("/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),

  logout: () =>
    api.post<ApiResponse<null>>("/auth/logout", {}).then((r) => r.data),
};
