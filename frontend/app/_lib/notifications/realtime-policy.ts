import type { UserRole } from "@/app/_lib/types/models";

const CLIENT_EVENT_PREFIXES = [
  "appointments:",
  "prescriptions:",
  "visits:",
  "pets:",
] as const;

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

/**
 * Filters realtime events to role-relevant entities.
 *
 * - client: only events that affect client-facing features
 * - admin/owner/doctor/staff: full realtime sync
 */
export function shouldHandleRealtimeEvent(
  event: string | null | undefined,
  role: UserRole | null | undefined,
): boolean {
  if (!role || typeof event !== "string") return false;

  if (role === "client") {
    return startsWithAny(event, CLIENT_EVENT_PREFIXES);
  }

  return true;
}
