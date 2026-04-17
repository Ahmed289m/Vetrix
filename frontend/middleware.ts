import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_KEY = "vetrix_access_token";

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
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

  // ── No token → redirect to login ─────────────────────────────────
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Decode token to check expiry & role ───────────────────────────
  const payload = decodePayload(token);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check expiry
  const exp = payload.exp as number;
  if (exp && Date.now() >= exp * 1000) {
    // Token expired — let the client-side interceptor handle refresh.
    // We still allow the request so the Axios interceptor can do its job.
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
