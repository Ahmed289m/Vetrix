"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/app/_lib/query-client";
import { LangProvider } from "@/app/_hooks/useLanguage";
import { TooltipProvider } from "@/app/_components/ui/tooltip";
import { RoleProvider } from "@/app/_components/RoleContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <RoleProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </RoleProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
