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
  LoginRequest,
  TokenPayload,
  UserRole,
} from "@/app/_lib/types/api.types";

/* ── JWT helpers ──────────────────────────────────────────────────── */

function decodeJwt(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
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
  login: () => {},
  logout: () => {},
  isLoggingIn: false,
  loginError: null,
  isLoggingOut: false,
  logoutError: null,
});

/* ── Provider ─────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Hydrate user from existing cookie on mount */
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwt(token);
      if (payload && !isTokenExpired(payload)) {
        setUser({
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
          clinicId: payload.clinic_id,
          isSuperuser: payload.is_superuser,
        });
      } else {
        // Try silent refresh
        const refresh = getRefreshToken();
        if (refresh) {
          authApi
            .refresh(refresh)
            .then((res) => {
              const { access_token, refresh_token } = res.data;
              setTokens(access_token, refresh_token);
              const newPayload = decodeJwt(access_token);
              if (newPayload) {
                setUser({
                  userId: newPayload.sub,
                  email: newPayload.email,
                  role: newPayload.role,
                  clinicId: newPayload.clinic_id,
                  isSuperuser: newPayload.is_superuser,
                });
              }
            })
            .catch(() => {
              clearTokens();
            });
        } else {
          clearTokens();
        }
      }
    }
    setIsLoading(false);
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
    onError: (error) => {
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
    const err = loginMutation.error as any;
    return (
      err?.response?.data?.message ||
      err?.message ||
      "Login failed. Please try again."
    );
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
