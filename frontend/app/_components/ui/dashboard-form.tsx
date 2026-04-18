"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { cn } from "@/app/_lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardFormProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function DashboardForm({
  title,
  description,
  isOpen,
  onOpenChange,
  onSubmit,
  children,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  className,
}: DashboardFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-2.5rem)] sm:w-full max-w-xl bg-card/95 backdrop-blur-3xl border border-border p-0 overflow-hidden rounded-3xl sm:rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]",
          className,
        )}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex flex-col h-auto max-h-[92vh]"
            >
              <DialogHeader className="p-4 sm:p-6 border-b border-border bg-tint/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald/0 via-emerald/50 to-emerald/0" />
                <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-muted-foreground/80 font-medium text-sm sm:text-base mt-2">
                    {description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <form
                onSubmit={onSubmit}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 sm:p-8 space-y-5 sm:space-y-6">
                  {children}
                </div>

                <DialogFooter className="p-4 sm:p-6 border-t border-border bg-tint/5 flex items-center gap-3 sm:gap-4 sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="w-full sm:w-auto font-bold hover:bg-tint/10 text-foreground h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all"
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-emerald hover:bg-emerald/90 text-white font-black px-6 sm:px-10 h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-2xl shadow-emerald/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submitLabel}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
