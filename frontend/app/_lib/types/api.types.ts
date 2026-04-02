/* ── Generic API envelope (matches backend response shape) ─────────── */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* ── Auth ──────────────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

/**
 * Decoded JWT payload — mirrors the claims set by the backend.
 */
export interface TokenPayload {
  sub: string;
  role: UserRole;
  clinic_id: string | null;
  email: string;
  is_superuser: boolean;
  fullname: string;
  clinic_name: string;
  exp: number;
  type?: string; // "refresh" on refresh tokens
}

/* ── User roles ───────────────────────────────────────────────────── */

export type UserRole = "admin" | "owner" | "doctor" | "staff" | "client";
