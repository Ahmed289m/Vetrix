import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_KEY = "vetrix_access_token";
const REFRESH_TOKEN_KEY = "vetrix_refresh_token";

/** Public routes that don't require authentication. */
const PUBLIC_PATHS = ["/login", "/"];

/**
 * Dashboard pages blocked per role.
 * This enforces removal at route level (not only sidebar visibility).
 */
const BLOCKED_DASHBOARD_PATHS_BY_ROLE: Record<string, string[]> = {
  owner: [
    "/dashboard/appointments",
    "/dashboard/prescriptions",
    "/dashboard/reports",
    "/dashboard/finances",
  ],
  doctor: ["/dashboard/pets"],
};

/**
 * Decode a JWT payload without verification (server-side, we only need
 * the claims for routing decisions — actual verification happens on the
 * backend when the API is called).
 */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getTokenExpiry(
  payload: Record<string, unknown> | null,
): number | null {
  if (!payload) return null;
  const exp = payload.exp;
  if (typeof exp !== "number") return null;
  return exp;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Ignore speculative route prefetches to avoid caching auth redirects
  // for routes that will be visited shortly by an authenticated user.
  if (isPrefetch) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  // ── No token → redirect to login ─────────────────────────────────
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Decode token to check expiry & role ───────────────────────────
  const payload = decodePayload(accessToken);
  if (!payload) {
    // Access token may be malformed while a valid refresh token still exists.
    // Let client-side refresh flow recover in that case.
    if (!refreshToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const refreshPayload = decodePayload(refreshToken);
    const refreshExp = getTokenExpiry(refreshPayload);
    if (!refreshExp || Date.now() >= refreshExp * 1000) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Check expiry
  const accessExp = getTokenExpiry(payload);
  if (accessExp && Date.now() >= accessExp * 1000) {
    // Access token expired. Only allow through when refresh token is still valid.
    if (!refreshToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const refreshPayload = decodePayload(refreshToken);
    const refreshExp = getTokenExpiry(refreshPayload);
    if (!refreshExp || Date.now() >= refreshExp * 1000) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Attach role header so server components can read it ───────────
  const role = String(payload.role ?? "").toLowerCase();
  const blockedPaths = BLOCKED_DASHBOARD_PATHS_BY_ROLE[role] ?? [];
  const isBlocked = blockedPaths.some((blockedPath) => {
    return pathname === blockedPath || pathname.startsWith(`${blockedPath}/`);
  });

  if (isBlocked) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-user-role", role);
  response.headers.set("x-user-email", String(payload.email ?? ""));
  response.headers.set("x-user-clinic", String(payload.clinic_id ?? ""));

  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
