"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  BookOpen,
  X,
  FileText,
  Dog,
  Cat,
  FlaskConical,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Pill,
} from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";
import type { CaseHistoryVisit } from "@/app/_lib/api/crew.api";

export interface CaseHistoryPatient {
  petName: string;
  species: "dog" | "cat" | string;
  breed?: string;
  ownerName?: string;
  caseNumber?: string;
}

interface CaseHistoryModalProps {
  open: boolean;
  onClose: () => void;
  patient: CaseHistoryPatient | null;
  visits?: CaseHistoryVisit[];
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function CaseHistoryModal({
  open,
  onClose,
  patient,
  visits = [],
  isLoading = false,
  errorMessage = null,
}: CaseHistoryModalProps) {
  const { t } = useLang();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-10000 bg-background/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {t("case_history") || "Case History"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {t("case_summary_description") ||
                        "Full summary of the current case"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient info strip */}
              {patient && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-tint/5 border border-tint/5">
                  <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    {patient.species.toLowerCase() === "dog" ? (
                      <Dog className="w-5 h-5" />
                    ) : patient.species.toLowerCase() === "cat" ? (
                      <Cat className="w-5 h-5" />
                    ) : (
                      <FlaskConical className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {patient.petName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex gap-1">
                      {patient.breed && <span>{patient.breed} ·</span>}
                      {patient.ownerName && <span>{patient.ownerName}</span>}
                    </p>
                  </div>
                  {patient.caseNumber && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {patient.caseNumber}
                    </span>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="p-8 rounded-xl border border-violet-500/20 bg-violet-500/5 text-center space-y-3">
                  <Loader2 className="w-7 h-7 text-violet-400 mx-auto animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Loading case history...
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Fetching visit summary for this pet.
                    </p>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Failed to load case history
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              ) : visits.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-400/90 px-1">
                    {visits.length} visit{visits.length > 1 ? "s" : ""} in
                    timeline
                  </p>
                  {visits.map((visit, index) => (
                    <div
                      key={`${visit.date}-${index}`}
                      className="p-3 rounded-xl border border-violet-500/15 bg-violet-500/5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {visit.date || "Unknown date"}
                        </span>
                        {visit.medications && (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald/10 border border-emerald/20 text-emerald font-bold uppercase tracking-wide flex items-center gap-1">
                            <Pill className="w-3 h-3" />
                            {visit.medications}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">
                        {visit.notes || "No notes recorded for this visit."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl border-2 border-dashed border-violet-500/20 bg-violet-500/5 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7 text-violet-400/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {t("case_summary_coming") || "Case Summary"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      No previous visits found for this pet.
                    </p>
                  </div>
                </div>
              )}

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
              >
                {t("close") || "Close"}
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
