import axios from "axios";
import Cookies from "js-cookie";

/* ── Cookie key names ─────────────────────────────────────────────── */
export const ACCESS_TOKEN_KEY = "vetrix_access_token";
export const REFRESH_TOKEN_KEY = "vetrix_refresh_token";

/* ── Cookie helpers ───────────────────────────────────────────────── */
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { ...COOKIE_OPTIONS, expires: 1 }); // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { ...COOKIE_OPTIONS, expires: 7 }); // 7 days
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
}

/* ── Axios instance ───────────────────────────────────────────────── */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://vetrix.up.railway.app/";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/* ── Request interceptor: attach access token ─────────────────────── */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Response interceptor: silent refresh on 401 ──────────────────── */
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 responses (not on auth endpoints themselves)
    const isAuthUrl =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || isAuthUrl || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = data.data;
      setTokens(access_token, refresh_token);
      processQueue(null, access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();

      // Redirect to login (only on client side)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
