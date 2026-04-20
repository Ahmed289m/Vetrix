"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import type { UserRole } from "@/app/_lib/types/models";

type NotificationItem = {
  id: string;
  event: string;
  message: string;
  createdAt: number;
  read: boolean;
};

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const EMPTY_NOTIFICATIONS_CONTEXT: NotificationsContextValue = {
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
};

const NotificationsContext = createContext<NotificationsContextValue>(
  EMPTY_NOTIFICATIONS_CONTEXT,
);

const MAX_NOTIFICATIONS = 30;

function toTitleWords(value: string): string {
  return value
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function singularize(word: string): string {
  return word.endsWith("s") ? word.slice(0, -1) : word;
}

function extractEntityId(data?: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const id = (data as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

function buildNotificationMessage(event: string, data?: unknown): string {
  const [entity = "update", action = "updated"] = event.split(":");
  const entityLabel = singularize(toTitleWords(entity));
  const actionLabel = action.toLowerCase();
  const entityId = extractEntityId(data);

  if (entityId) {
    return `${entityLabel} ${actionLabel} (${entityId}).`;
  }

  return `${entityLabel} ${actionLabel}.`;
}

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

  return (
    <NotificationsContext.Provider value={EMPTY_NOTIFICATIONS_CONTEXT}>
      {children}
    </NotificationsContext.Provider>
  );
}

function WebSocketInner({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole | null;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const sequenceRef = useRef(0);

  const handleRealtimeEvent = useCallback((event: string, data?: unknown) => {
    setNotifications((prev) => {
      sequenceRef.current += 1;

      const nextNotification: NotificationItem = {
        id: `${Date.now()}-${sequenceRef.current}`,
        event,
        message: buildNotificationMessage(event, data),
        createdAt: Date.now(),
        read: false,
      };

      return [nextNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      if (prev.every((item) => item.read)) return prev;
      return prev.map((item) => (item.read ? item : { ...item, read: true }));
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAllAsRead,
    }),
    [notifications, unreadCount, markAllAsRead],
  );

  useWebSocket(role, { onEvent: handleRealtimeEvent });

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
