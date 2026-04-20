"use client";

import { useAuth } from "@/app/_hooks/useAuth";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import type { UserRole } from "@/app/_lib/types/models";

/**
 * Renders nothing — simply activates the WebSocket connection
 * when the user is authenticated.
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  // Only connect when logged in
  if (isAuthenticated) {
    return <WebSocketInner role={role}>{children}</WebSocketInner>;
  }

  return <>{children}</>;
}

function WebSocketInner({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole | null;
}) {
  useWebSocket(role);
  return <>{children}</>;
}
