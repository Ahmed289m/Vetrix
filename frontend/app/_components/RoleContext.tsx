"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "doctor",
  setRole: () => {},
});

function parseToken(token: string): Role | null {
  const valid: Role[] = ["admin", "owner", "staff", "doctor", "client"];
  if (valid.includes(token as Role)) return token as Role;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return valid.includes(payload.role) ? payload.role : null;
  } catch {
    return null;
  }
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("doctor");

  useEffect(() => {
    const token = localStorage.getItem("vetrix_token");
    if (!token) {
      localStorage.setItem("vetrix_token", "doctor");
    } else {
      const decoded = parseToken(token);
      if (decoded) setRoleState(decoded);
    }
  }, []);

  const setRole = (newRole: Role) => {
    localStorage.setItem("vetrix_token", newRole);
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
