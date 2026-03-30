"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  CheckCircle2,
  Dog,
  Cat,
  Eye,
  X,
  FileText,
  Pill,
  Stethoscope,
  BriefcaseMedical
} from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";

import { useVisits, useUpdateVisit } from "@/app/_hooks/queries/use-visits";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import type { Visit } from "@/app/_lib/types/models";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function VisitsPage() {
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const { t } = useLang();

  const { data: visitsData, isLoading: visitsLoading } = useVisits();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();
  const { data: prescriptionsData } = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();

  const updateVisit = useUpdateVisit();

  const visits = visitsData?.data || [];
  const petsList = petsData?.data || [];
  const usersList = usersData?.data || [];
  const prescriptionsList = prescriptionsData?.data || [];
  const presItemsList = presItemsData?.data || [];
  const drugsList = drugsData?.data || [];

  const filtered = filter === "all" ? visits : visits.filter((v) => {
    // Backend doesn't have native "status" in Visit model, assuming all are completed for now
    // or simulate status if needed. We'll simulate by filtering all as "completed".
    return filter === "completed";
  });

  const inProgressCount = 0; // Simulated

  const handleComplete = (id: string) => {
    // If backend supported status: updateVisit.mutate({ id, data: { status: 'completed' } })
  };

  const getPet = (id: string) => petsList.find((p) => p.pet_id === id);
  const getUser = (id: string) => usersList.find((u) => u.user_id === id);
  
  const getPrescriptionTextForVisit = (visit: Visit) => {
    if (!visit.prescription_id) return [];
    const rx = prescriptionsList.find((p) => p.prescription_id === visit.prescription_id);
    if (!rx) return [];
    const item = presItemsList.find((pi) => pi.prescriptionItem_id === rx.prescriptionItem_id);
    if (!item) return [];
    const drug = drugsList.find((d) => d.drug_id === item.drug_id);
    return [`${drug?.drugName || "Unknown Drug"} - ${item.drugDose}`];
  };

  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
          {t("visit_management") || "Visit Management"}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t("visits_history") || "Clinical Visits"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {visits.length} total recorded visits
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2">
        {(["all", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {visitsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading visits data...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No visits found.</div>
        ) : (
          filtered.map((visit, i) => {
            const pet = getPet(visit.pet_id);
            const owner = getUser(visit.client_id);
            const doctor = getUser(visit.doctor_id);
            const Icon = pet?.type.toLowerCase() === "cat" ? Cat : Dog;
            const isInProgress = false; 

            return (
              <motion.div
                key={visit.visit_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card p-4 sm:p-5 border ${isInProgress ? "border-cyan/20" : "border-border/30"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isInProgress ? "bg-cyan/10" : "bg-muted/30"}`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isInProgress ? "text-cyan" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ID-{visit.visit_id.slice(0,8).toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${isInProgress ? "bg-cyan/15 text-cyan" : "bg-emerald/15 text-emerald"}`}
                        >
                          Completed
                        </span>
                      </div>
                      <p className="text-sm font-bold mt-0.5">Clinical Visit</p>
                      <p className="text-xs text-muted-foreground">
                        {pet?.name || "Unknown Pet"} · {owner?.fullname || "Unknown Owner"} · {doctor?.fullname || "Unknown Doctor"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 bg-white/5 py-1 px-3 rounded-full">
                      {visit.date || "No date recorded"}
                    </span>
                    <button
                      onClick={() => setSelectedVisit(visit)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50 hover:border-emerald/30 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Visit Detail Modal */}
      <AnimatePresence>
        {selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVisit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-5 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] rounded-[2.5rem]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">
                    Visit ID: {selectedVisit.visit_id.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold mt-1">
                    Clinical Record Overview
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getPet(selectedVisit.pet_id)?.name} · {getUser(selectedVisit.client_id)?.fullname}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Date
                  </p>
                  <p className="text-sm font-semibold">{selectedVisit.date}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Time
                  </p>
                  <p className="text-sm font-semibold">Anytime</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Doctor
                  </p>
                  <p className="text-sm font-semibold">
                    {getUser(selectedVisit.doctor_id)?.fullname || "Dr. Assigned"}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Status
                  </p>
                  <p className={`text-sm font-semibold text-emerald`}>
                    Completed
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Clinical Notes / Report
                    </span>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                    {selectedVisit.notes || "No additional clinical notes recorded for this visit session."}
                  </p>
                </div>

                {getPrescriptionTextForVisit(selectedVisit).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Prescribed Medicine
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {getPrescriptionTextForVisit(selectedVisit).map((rx, j) => (
                        <li
                          key={j}
                          className="text-sm text-emerald font-semibold font-mono bg-emerald/5 px-4 py-3 rounded-xl border border-emerald/10 shadow-inner"
                        >
                          {rx}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
