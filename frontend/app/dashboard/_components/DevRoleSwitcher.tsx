"use client";

import { Role } from "@/app/_components/RoleContext";

interface DevRoleSwitcherProps {
  currentRole: Role | null;
  onRoleChange: (role: Role) => void;
}

export function DevRoleSwitcher({ currentRole, onRoleChange }: DevRoleSwitcherProps) {
  const roles: Role[] = ["admin", "owner", "staff", "doctor", "client"];

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card/80 backdrop-blur-md border border-border/50 p-2 rounded-xl shadow-2xl flex gap-2 text-xs">
      <span className="font-bold flex items-center px-2 text-muted-foreground">Dev Switcher:</span>
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => onRoleChange(r)}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            currentRole === r
              ? "bg-emerald text-primary-foreground font-bold shadow-md shadow-emerald/20"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );
}
