"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import type { MouseEvent } from "react";
import {
  Dog, Cat, Eye, X, FileText, Pill, Plus, Stethoscope,
  Calendar, User, ChevronRight, Activity, AlertCircle,
  AlertTriangle, Zap, FlaskConical, Shield, ShieldCheck,
  ClipboardList, Clock,
} from "lucide-react";
import type { Visit, Drug, Pet } from "@/app/_lib/types/models";
import { cn } from "@/app/_lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const formatDose = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "object") {
    try { return JSON.stringify(val).replace(/["{}\[\]]/g, "").replace(/:/g, ": "); }
    catch { return String(val); }
  }
  return String(val);
};

export const speciesKey = (petType?: string) =>
  petType === "dog" ? "dog" : petType === "cat" ? "cat" : null;

export const severityStyle = (sev?: string) => {
  const s = (sev || "").toLowerCase();
  if (s === "high")   return { bg: "bg-red-500/10",   text: "text-red-400",   border: "border-red-500/20",   label: "High Risk" };
  if (s === "medium") return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Medium Risk" };
  if (s === "low")    return { bg: "bg-yellow-500/10",text: "text-yellow-400",border: "border-yellow-500/20",label: "Low Risk" };
  return { bg: "bg-emerald/10", text: "text-emerald", border: "border-emerald/20", label: "No Risk" };
};

// ── Portal wrapper ─────────────────────────────────────────────────────────────
function Portal({ children, open, onBgClick }: { children: React.ReactNode; open: boolean; onBgClick?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !open) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="visit-modal-bg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          className="bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onBgClick}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Severity badge ─────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity?: string }) {
  const s = severityStyle(severity);
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

// ── Visit Detail Modal (reusable) ─────────────────────────────────────────────
export function VisitDetailModal({
  visit,
  onClose,
  getPet,
  getUser,
  getDrugsForVisit,
  isClient,
}: {
  visit: Visit | null;
  onClose: () => void;
  getPet: (id: string) => Pet | undefined;
  getUser: (id: string) => { fullname: string } | null | undefined;
  getDrugsForVisit: (v: Visit) => { drug: Drug; dose: string }[];
  isClient: boolean;
}) {
  if (!visit) return null;

  const pet    = getPet(visit.pet_id);
  const doctor = getUser(visit.doctor_id);
  const owner  = getUser(visit.client_id);
  const pDrugs = getDrugsForVisit(visit);

  const PetIcon = pet?.type === "cat" ? Cat : pet?.type === "dog" ? Dog : FlaskConical;

  return (
    <Portal open={!!visit} onBgClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-card border border-border/40 rounded-3xl shadow-[0_0_80px_-20px_rgba(16,185,129,0.15)] p-6 space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald/25 to-cyan-500/15 flex items-center justify-center shadow-inner shrink-0">
              <PetIcon className="w-7 h-7 text-emerald" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">
                {pet?.name || "Visit Record"}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {pet?.type && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-white/5 border border-white/5 text-muted-foreground capitalize">
                    {pet.type}
                  </span>
                )}
                {pet?.breed && (
                  <span className="text-xs text-muted-foreground">{pet.breed}</span>
                )}
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald/15 text-emerald border border-emerald/20">
                  Completed
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                {visit.visit_id.toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Date */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </p>
            <p className="text-sm font-bold">{fmtDate(visit.date)}</p>
          </div>

          {/* Status */}
          <div className="p-3 rounded-2xl bg-emerald/5 border border-emerald/15 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" /> Status
            </p>
            <p className="text-sm font-bold text-emerald">Completed</p>
          </div>

          {/* Doctor — col-span-2 */}
          <div className="p-3 rounded-2xl bg-cyan/5 border border-cyan/15 space-y-1 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> Attending Doctor
            </p>
            <p className="text-sm font-bold text-cyan">
              Dr. {doctor?.fullname || "Not assigned"}
            </p>
          </div>

          {/* Owner — hidden for client (they are the owner) */}
          {!isClient && owner && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1 col-span-2 sm:col-span-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Owner
              </p>
              <p className="text-sm font-bold">{owner.fullname}</p>
            </div>
          )}
        </div>

        {/* ── Clinical Notes ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Clinical Notes
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {visit.notes || "No clinical notes recorded for this visit."}
            </p>
          </div>
        </div>

        {/* ── Prescribed Drugs ── */}
        {pDrugs.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Prescribed Medication{pDrugs.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-4">
              {pDrugs.map(({ drug, dose }, idx) => {
                const sKey    = speciesKey(pet?.type);
                const specDose = sKey ? (drug.dosage as any)?.[sKey] : null;
                const specTox  = sKey ? (drug.toxicity as any)?.[sKey] : null;
                const sevKey   = sKey ? `severity${sKey.charAt(0).toUpperCase() + sKey.slice(1)}` : null;
                const sev      = sevKey ? (drug.toxicity as any)?.[sevKey] : undefined;
                const styles   = severityStyle(sev);

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-emerald/5 border border-emerald/15 space-y-4">
                    {/* Drug header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                          <Pill className="w-5 h-5 text-emerald" />
                        </div>
                        <div>
                          <p className="font-black text-base">{drug.name}</p>
                          <p className="text-xs text-muted-foreground">{drug.drugClass}</p>
                        </div>
                      </div>
                      {sev && <SeverityBadge severity={sev} />}
                    </div>

                    {/* Species-specific dosage */}
                    {specDose ? (
                      <div className="p-3 rounded-xl bg-cyan/5 border border-cyan/15">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-1 capitalize">
                          <FlaskConical className="w-3 h-3 inline mr-1" />
                          Dosage for {pet?.type}
                        </p>
                        <p className="text-sm font-bold text-cyan">{specDose}</p>
                      </div>
                    ) : dose ? (
                      <div className="p-3 rounded-xl bg-emerald/5 border border-emerald/10 font-mono text-xs text-emerald">
                        Dose: {dose}
                      </div>
                    ) : null}

                    {/* Species-specific toxicity */}
                    {specTox && (
                      <div className={`p-3 rounded-xl border ${styles.bg} ${styles.border}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 capitalize flex items-center gap-1 ${styles.text}`}>
                          <AlertTriangle className="w-3 h-3" />
                          Toxicity for {pet?.type}
                        </p>
                        <p className={`text-sm font-bold ${styles.text}`}>{specTox}</p>
                      </div>
                    )}

                    {/* Interactions */}
                    {drug.drugInteractions?.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Known Drug Interactions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {drug.drugInteractions.map((name, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/15">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contraindications */}
                    {drug.contraindications?.length > 0 && (
                      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1.5 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Contraindications
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {drug.contraindications.slice(0, 4).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/10">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client side-effects watch */}
                    {isClient && drug.sideEffects?.length > 0 && (
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Watch for these side effects
                        </p>
                        <ul className="space-y-1">
                          {drug.sideEffects.slice(0, 4).map((se, i) => (
                            <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                              <ChevronRight className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                              {se}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Full dosage by species (non-client) */}
                    {!isClient && drug.dosage && Object.keys(drug.dosage).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> All species dosages
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(drug.dosage).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center p-2 rounded-xl bg-white/5 text-xs">
                              <span className="text-muted-foreground capitalize font-semibold">{k}</span>
                              <span className="font-bold text-emerald">{formatDose(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : visit.prescription_id ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/10 border border-border/30 text-sm text-muted-foreground">
            <Pill className="w-4 h-4 shrink-0" />
            <span>Prescription linked — drug details unavailable</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/10 border border-border/30 text-sm text-muted-foreground">
            <Pill className="w-4 h-4 shrink-0 opacity-40" />
            <span>No prescription linked to this visit</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </Portal>
  );
}
