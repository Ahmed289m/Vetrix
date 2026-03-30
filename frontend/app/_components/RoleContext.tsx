"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import type { UserRole } from "@/app/_lib/types/api.types";

/* ── Types ────────────────────────────────────────────────────────── */

export type Role = UserRole;

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "doctor",
  setRole: () => {},
});

/* ── Provider ─────────────────────────────────────────────────────── */

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();

  // setRole is kept for dev/simulation mode — in production the role
  // is always derived from the JWT and cannot be changed client-side.
  const setRole = () => {
    console.warn(
      "[RoleContext] setRole() is a no-op in production. Role is read from the JWT.",
    );
  };

  return (
    <RoleContext.Provider value={{ role: role ?? "doctor", setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────────── */

export function useRole() {
  return useContext(RoleContext);
}
