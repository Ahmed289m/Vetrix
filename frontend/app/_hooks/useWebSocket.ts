"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ??
  "ws://localhost:8000";

/**
 * Maps a WebSocket event name to the React Query key(s) that should be invalidated.
 */
const EVENT_TO_QUERY_KEYS: Record<string, string[]> = {
  "pets:created": ["pets"],
  "pets:updated": ["pets"],
  "pets:deleted": ["pets"],
  "appointments:created": ["appointments"],
  "appointments:updated": ["appointments"],
  "appointments:deleted": ["appointments"],
  "users:created": ["users"],
  "users:updated": ["users"],
  "users:deleted": ["users"],
  "clinics:created": ["clinics"],
  "clinics:updated": ["clinics"],
  "clinics:deleted": ["clinics"],
  "visits:created": ["visits"],
  "visits:updated": ["visits"],
  "visits:deleted": ["visits"],
  "drugs:created": ["drugs"],
  "drugs:updated": ["drugs"],
  "drugs:deleted": ["drugs"],
  "prescriptions:created": ["prescriptions"],
  "prescriptions:updated": ["prescriptions"],
  "prescriptions:deleted": ["prescriptions"],
  "prescription-items:created": ["prescription-items"],
  "prescription-items:updated": ["prescription-items"],
  "prescription-items:deleted": ["prescription-items"],
};

/**
 * Maintains a persistent WebSocket connection to the backend.
 *
 * When the server broadcasts an event (e.g. `"pets:created"`), the
 * corresponding React Query cache key is automatically invalidated
 * so list views refetch in real-time.
 *
 * Reconnects automatically with exponential back-off.
 */
export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const retryDelay = useRef(1000);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelay.current = 1000; // reset back-off on success
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as { event: string; data?: unknown };
        const keys = EVENT_TO_QUERY_KEYS[msg.event];
        if (keys) {
          keys.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] }),
          );
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      // Exponential back-off reconnection (max 30 s)
      reconnectTimer.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
        connect();
      }, retryDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [queryClient]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Send periodic pings to keep the connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect]);
}
