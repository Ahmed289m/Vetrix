"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/app/_lib/api/auth.api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/app/_lib/axios";
import type {
  ApiResponse,
  LoginRequest,
  TokenPayload,
  UserRole,
} from "@/app/_lib/types/api.types";

/* ── JWT helpers ──────────────────────────────────────────────────── */

function decodeJwt(token: string): TokenPayload | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: TokenPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

/* ── Auth context shape ───────────────────────────────────────────── */

interface AuthUser {
  userId: string;
  email: string;
  fullname: string;
  clinicName: string;
  role: UserRole;
  clinicId: string | null;
  isSuperuser: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => void;
  logout: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
  isLoggingOut: boolean;
  logoutError: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => { },
  logout: () => { },
  isLoggingIn: false,
  loginError: null,
  isLoggingOut: false,
  logoutError: null,
});

/* ── Provider ─────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Keep first render deterministic between SSR and client to avoid hydration mismatch.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Hydrate user from existing cookie on mount */
  useEffect(() => {
    let cancelled = false;

    const hydrateAuth = async () => {
      // Move state writes off the synchronous effect body.
      await Promise.resolve();

      const token = getAccessToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const payload = decodeJwt(token);
      if (payload && !isTokenExpired(payload)) {
        if (!cancelled) {
          setUser({
            userId: payload.sub,
            email: payload.email,
            fullname: payload.fullname,
            clinicName: payload.clinic_name,
            role: payload.role,
            clinicId: payload.clinic_id,
            isSuperuser: payload.is_superuser,
          });
          setIsLoading(false);
        }
        return;
      }

      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.refresh(refresh);
        const { access_token, refresh_token } = res.data;
        setTokens(access_token, refresh_token);
        const newPayload = decodeJwt(access_token);
        if (newPayload && !cancelled) {
          setUser({
            userId: newPayload.sub,
            email: newPayload.email,
            fullname: newPayload.fullname,
            clinicName: newPayload.clinic_name,
            role: newPayload.role,
            clinicId: newPayload.clinic_id,
            isSuperuser: newPayload.is_superuser,
          });
        }
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Login mutation */
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      const { access_token, refresh_token } = res.data;
      setTokens(access_token, refresh_token);

      const payload = decodeJwt(access_token);
      if (payload) {
        setUser({
          userId: payload.sub,
          email: payload.email,
          fullname: payload.fullname,
          clinicName: payload.clinic_name,
          role: payload.role,
          clinicId: payload.clinic_id,
          isSuperuser: payload.is_superuser,
        });
      }

      // Get redirect URL from URL params if available, otherwise go to dashboard
      const searchParams = new URLSearchParams(window?.location?.search);
      const redirectUrl = searchParams?.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    },
  });

  /* Logout */
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearTokens();
      setUser(null);
      queryClient.clear();
      router.push("/login");
    },
    onError: () => {
      // Even on error, clear local auth data for security
      clearTokens();
      setUser(null);
      queryClient.clear();
      router.push("/login");
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  /* Derive login error message */
  const loginError = useMemo(() => {
    if (!loginMutation.error) return null;
    const err = loginMutation.error as {
      response?: { data?: ApiResponse<unknown> | { message?: string } };
      message?: string;
    };
    const responseMessage =
      typeof err?.response?.data === "object" &&
        err.response?.data !== null &&
        "message" in err.response.data
        ? (err.response.data as { message?: string }).message
        : undefined;
    return responseMessage || err?.message || "Login failed. Please try again.";
  }, [loginMutation.error]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      login: loginMutation.mutate,
      logout,
      isLoggingIn: loginMutation.isPending,
      loginError,
      isLoggingOut: logoutMutation.isPending,
      logoutError: logoutMutation.error
        ? "Logout failed. Please try again."
        : null,
    }),
    [
      user,
      isLoading,
      loginMutation.mutate,
      loginMutation.isPending,
      logout,
      loginError,
      logoutMutation.isPending,
      logoutMutation.error,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────────────────────── */

export function useAuth() {
  return useContext(AuthContext);
}
