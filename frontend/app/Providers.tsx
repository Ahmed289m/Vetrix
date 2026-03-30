"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/app/_lib/query-client";
import { AuthProvider } from "@/app/_hooks/useAuth";
import { LangProvider } from "@/app/_hooks/useLanguage";
import { TooltipProvider } from "@/app/_components/ui/tooltip";
import { RoleProvider } from "@/app/_components/RoleContext";
import { WebSocketProvider } from "@/app/_components/WebSocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <LangProvider>
            <TooltipProvider>
              <WebSocketProvider>{children}</WebSocketProvider>
            </TooltipProvider>
          </LangProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
