"use client";

import { useAuth } from "@/app/_hooks/useAuth";
import { useWebSocket } from "@/app/_hooks/useWebSocket";

/**
 * Renders nothing — simply activates the WebSocket connection
 * when the user is authenticated.
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Only connect when logged in
  if (isAuthenticated) {
    return <WebSocketInner>{children}</WebSocketInner>;
  }

  return <>{children}</>;
}

function WebSocketInner({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}
