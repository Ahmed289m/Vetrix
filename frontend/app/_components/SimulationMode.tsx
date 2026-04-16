"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, Dog, Cat, Clock, Activity, ChevronRight,
  Stethoscope, Pill, X, AlertTriangle, Calendar, User as UserIcon,
  FileText, Info, UserCheck, Inbox, ShieldCheck, ClipboardList,
  Pencil, Trash2, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointments, useUpdateAppointment } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useVisits, useCreateVisit, useUpdateVisit } from "@/app/_hooks/queries/use-visits";
import {
  useCreatePrescription, usePrescriptions,
  useUpdatePrescription, useDeletePrescription,
} from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import type {
  Appointment, Drug, Pet, PrescriptionCreate, User as UserModel, VisitCreate, Visit,
} from "@/app/_lib/types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const formatDose = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "object") {
    try { return JSON.stringify(val).replace(/["{}\[\]]/g, "").replace(/:/g, ": ").replace(/,/g, " · "); }
    catch { return String(val); }
  }
  return String(val);
};

type SimStatus = "confirmed" | "pending-doctor" | "in-progress" | "completed";

interface Props { role: "staff" | "doctor"; }

// ── Portal wrapper — renders modals at document.body to avoid overflow clipping ──
function Modal({ children, open }: { children: React.ReactNode; open: boolean }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          className="bg-background/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SimulationMode({ role }: Props) {
  // ── Visit modal state ──
  const [visitMode,           setVisitMode]           = useState<"create" | "edit">("create");
  const [showVisitModal,      setShowVisitModal]      = useState(false);
  const [activeVisitApptId,   setActiveVisitApptId]   = useState("");
  const [editingVisitId,      setEditingVisitId]      = useState("");
  const [visitNotes,          setVisitNotes]          = useState("");
  const [visitPrescriptionId, setVisitPrescriptionId] = useState("");

  // ── Prescription modal state ──
  const [pressMode,          setPressMode]          = useState<"create" | "edit">("create");
  const [showPressModal,     setShowPressModal]     = useState(false);
  const [activePressApptId,  setActivePressApptId]  = useState("");
  const [editingPressId,     setEditingPressId]     = useState("");
  const [selectedDrugId,     setSelectedDrugId]     = useState("");

  const { t }    = useLang();
  const { user } = useAuth();

  // Keep both roles in live sync via WebSocket → invalidates React Query cache
  useWebSocket();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: apptData }      = useAppointments();
  const { data: petsData }      = usePets();
  const { data: usersData }     = useUsers();
  const { data: drugsData }     = useDrugs();
  const { data: presData }      = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: visitsData }    = useVisits();

  const updateAppointment  = useUpdateAppointment();
  const createVisit        = useCreateVisit();
  const updateVisit        = useUpdateVisit();
  const createPrescription = useCreatePrescription();
  const updatePrescription = useUpdatePrescription();
  const deletePrescription = useDeletePrescription();

  const allAppointments: Appointment[] = apptData?.data      || [];
  const allPets: Pet[]                 = petsData?.data      || [];
  const allUsers: UserModel[]          = usersData?.data     || [];
  const allDrugs: Drug[]               = drugsData?.data     || [];
  const allPrescriptions               = presData?.data      || [];
  const allPresItems                   = presItemsData?.data || [];
  const allVisits: Visit[]             = visitsData?.data    || [];

  // ── Build enriched simAppointments ──────────────────────────────────────
  const simAppointments = useMemo(() => {
    const relevant: SimStatus[] = ["confirmed", "pending-doctor", "in-progress"];
    return allAppointments
      .filter((a) => relevant.includes(a.status as SimStatus))
      .sort((a, b) => {
        const dA = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
        const dB = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
        return dA - dB;
      })
      .map((a, idx) => {
        const pet    = allPets.find((p) => p.pet_id === a.pet_id);
        const client = allUsers.find((u) => u.user_id === a.client_id);
        const doctor = a.doctor_id ? allUsers.find((u) => u.user_id === a.doctor_id) : null;
        return {
          ...a,
          caseNumber:  `APT-${String(idx + 1).padStart(4, "0")}`,
          petName:     pet?.name        || t("unknown_pet"),
          petId:       a.pet_id,
          clientId:    a.client_id,
          species:     (pet?.type || "dog") as "dog" | "cat",
          breed:       pet?.breed       || t("mixed"),
          ownerName:   client?.fullname || t("unknown_owner"),
          complaint:   a.reason         || t("regular_checkup"),
          doctorName:  doctor?.fullname || "",
          simStatus:   a.status as SimStatus,
        };
      });
  }, [allAppointments, allPets, allUsers, t]);

  // ── Role-specific derived data ──────────────────────────────────────────
  const myActiveCase = useMemo(
    () => simAppointments.find((a) => a.simStatus === "in-progress" && a.doctor_id === user?.userId),
    [simAppointments, user?.userId],
  );

  const pendingRequests = useMemo(
    () => simAppointments.filter((a) => a.simStatus === "pending-doctor" && !a.doctor_id),
    [simAppointments],
  );

  // ── Prescription & visit helpers ────────────────────────────────────────
  /** All prescriptions written for a specific pet+client (this case) */
  const getCasePrescriptions = (petId: string, clientId: string) =>
    allPrescriptions.filter((rx) => rx.pet_id === petId && rx.client_id === clientId);

  /** Prescriptions written for this case that are NOT yet linked to any visit */
  const getUnlinkedCasePrescriptions = (petId: string, clientId: string) => {
    const linkedPrescriptionIds = new Set(allVisits.map((v) => v.prescription_id).filter(Boolean));
    return getCasePrescriptions(petId, clientId).filter(
      (rx) => !linkedPrescriptionIds.has(rx.prescription_id),
    );
  };

  const getDrugForRx = (rxId: string): Drug | undefined => {
    const rx   = allPrescriptions.find((p) => p.prescription_id === rxId);
    const item = allPresItems.find((pi) => pi.prescriptionItem_id === rx?.prescriptionItem_id);
    return allDrugs.find((d) => d.drug_id === item?.drug_id);
  };

  const getDrugForItem = (itemId: string): Drug | undefined => {
    const item = allPresItems.find((pi) => pi.prescriptionItem_id === itemId);
    return allDrugs.find((d) => d.drug_id === item?.drug_id);
  };

  const selectedDrug = allDrugs.find((d) => d.drug_id === selectedDrugId);

  // ── Staff actions ────────────────────────────────────────────────────────
  const handleStart = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "pending-doctor" } },
      {
        onSuccess: () => toast.info("Case dispatched — waiting for a doctor to accept"),
        onError:   () => toast.error("Failed to start case"),
      },
    );
  };

  // ── Doctor actions ───────────────────────────────────────────────────────
  const handleAccept = (apptId: string) => {
    if (!user?.userId) return;
    if (myActiveCase) { toast.error("Complete your current case before accepting another."); return; }
    updateAppointment.mutate(
      { id: apptId, data: { status: "in-progress", doctor_id: user.userId } },
      {
        onSuccess: () => toast.success("Case accepted — you are the assigned doctor"),
        onError:   () => toast.error("Failed to accept case"),
      },
    );
  };

  const handleComplete = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "completed" } },
      {
        onSuccess: () => toast.success("Case completed"),
        onError:   () => toast.error("Failed to complete case"),
      },
    );
  };

  // ── Visit modal ──────────────────────────────────────────────────────────
  const openCreateVisit = (apptId: string, petId: string, clientId: string) => {
    const unlinked = getUnlinkedCasePrescriptions(petId, clientId);
    setVisitMode("create");
    setActiveVisitApptId(apptId);
    setEditingVisitId("");
    setVisitPrescriptionId(unlinked[unlinked.length - 1]?.prescription_id || "");
    setVisitNotes("");
    setShowVisitModal(true);
  };

  const openEditVisit = (visit: Visit) => {
    setVisitMode("edit");
    setEditingVisitId(visit.visit_id);
    setActiveVisitApptId("");
    setVisitNotes(visit.notes || "");
    setVisitPrescriptionId(visit.prescription_id || "");
    setShowVisitModal(true);
  };

  const handleSaveVisit = () => {
    if (visitMode === "edit") {
      updateVisit.mutate(
        { id: editingVisitId, data: { notes: visitNotes, prescription_id: visitPrescriptionId || undefined } },
        {
          onSuccess: () => { toast.success("Visit updated."); setShowVisitModal(false); },
          onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update visit."),
        },
      );
    } else {
      const appt = simAppointments.find((a) => a.appointment_id === activeVisitApptId);
      if (!appt || !user) return;
      const payload: VisitCreate = {
        pet_id:    appt.petId,
        client_id: appt.clientId,
        doctor_id: appt.doctor_id || user.userId,
        notes:     visitNotes || t("visit_created_from_simulation_mode"),
        date:      new Date().toISOString(),
        ...(visitPrescriptionId && { prescription_id: visitPrescriptionId }),
      };
      createVisit.mutate(payload, {
        onSuccess: () => { toast.success("Visit recorded."); setShowVisitModal(false); },
        onError:   (err: any) => toast.error(err?.response?.data?.detail || "Failed to record visit."),
      });
    }
  };

  // ── Prescription modal ───────────────────────────────────────────────────
  const openCreatePrescription = (apptId: string) => {
    setPressMode("create");
    setActivePressApptId(apptId);
    setEditingPressId("");
    setSelectedDrugId("");
    setShowPressModal(true);
  };

  const openEditPrescription = (rxId: string, apptId: string) => {
    setPressMode("edit");
    setEditingPressId(rxId);
    setActivePressApptId(apptId);
    // Pre-select the current drug
    const drug = getDrugForRx(rxId);
    setSelectedDrugId(drug?.drug_id || "");
    setShowPressModal(true);
  };

  const handleDeletePrescription = (rxId: string) => {
    if (!confirm("Delete this prescription?")) return;
    deletePrescription.mutate(rxId, {
      onSuccess: () => toast.success("Prescription deleted."),
      onError:   () => toast.error("Failed to delete prescription."),
    });
  };

  const handleSavePrescription = () => {
    const appt = simAppointments.find((a) => a.appointment_id === activePressApptId);
    if (!selectedDrugId) { toast.warning("Select a drug first"); return; }

    if (pressMode === "edit") {
      updatePrescription.mutate(
        { id: editingPressId, data: { pet_id: appt?.petId, client_id: appt?.clientId } },
        {
          onSuccess: () => { toast.success("Prescription updated."); setShowPressModal(false); setSelectedDrugId(""); },
          onError:   () => toast.error("Failed to update prescription."),
        },
      );
    } else {
      if (!appt) return;
      createPrescription.mutate(
        { client_id: appt.clientId, pet_id: appt.petId, drug_id: selectedDrugId } satisfies PrescriptionCreate,
        {
          onSuccess: () => { toast.success("Prescription issued."); setShowPressModal(false); setSelectedDrugId(""); },
          onError:   (err: any) => toast.error(err?.response?.data?.detail || "Failed."),
        },
      );
    }
  };

  // Lookup helpers for modals
  const visitAppt  = simAppointments.find((a) => a.appointment_id === activeVisitApptId);
  const pressAppt  = simAppointments.find((a) => a.appointment_id === activePressApptId);

  // Case prescriptions for the prescription modal (for current case only)
  const pressCasePrescriptions = pressAppt
    ? getCasePrescriptions(pressAppt.petId, pressAppt.clientId)
    : [];

  // Case visits for the active doctor's case
  const myCaseVisits = myActiveCase
    ? allVisits.filter((v) => v.pet_id === myActiveCase.petId && v.client_id === myActiveCase.clientId)
    : [];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={myActiveCase ? { rotate: 360 } : {}}
          transition={{ repeat: myActiveCase ? Infinity : 0, duration: 3, ease: "linear" }}
          className="w-8 h-8 rounded-full gradient-emerald-cyan flex items-center justify-center glow-emerald"
        >
          <Activity className="w-4 h-4 text-primary-foreground" />
        </motion.div>
        <div>
          <h3 className="text-sm font-bold">{t("simulation_mode")}</h3>
          <p className="text-[10px] text-muted-foreground">
            {role === "staff" ? t("staff_controls_short") : t("doctor_view_short")}
          </p>
        </div>
      </div>

      {/* ══════════════════════ STAFF VIEW ══════════════════════════════════ */}
      {role === "staff" && (
        <div className="space-y-3">
          {simAppointments.length === 0 ? (
            <div className="p-8 rounded-xl border-2 border-emerald/30 bg-emerald/5 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald mx-auto" />
              <p className="font-bold text-emerald">{t("no_more_cases")}</p>
            </div>
          ) : (
            simAppointments.map((a, i) => (
              <motion.div
                key={a.appointment_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`p-4 rounded-xl border-2 space-y-3 ${
                  a.simStatus === "confirmed"      ? "border-muted/40 bg-muted/5"   :
                  a.simStatus === "pending-doctor" ? "border-orange/30 bg-orange/5" :
                                                     "border-cyan/30 bg-cyan/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {a.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.petName}</p>
                      <p className="text-xs text-muted-foreground">{a.ownerName} · {a.complaint}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{a.caseNumber}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase whitespace-nowrap ${
                    a.simStatus === "confirmed"      ? "bg-muted/30 text-muted-foreground" :
                    a.simStatus === "pending-doctor" ? "bg-orange/15 text-orange"          :
                                                       "bg-cyan/15 text-cyan"
                  }`}>
                    {a.simStatus === "confirmed" ? t("waiting") : a.simStatus === "pending-doctor" ? "Awaiting Doctor" : t("in_progress")}
                  </span>
                </div>

                {a.simStatus === "in-progress" && a.doctorName && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/10 border border-emerald/20 text-xs text-emerald">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold">Dr. {a.doctorName}</span>
                    <span className="opacity-60 ml-auto">assigned</span>
                  </div>
                )}
                {a.simStatus === "pending-doctor" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange/10 border border-orange/20 text-xs text-orange">
                    <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                    <span className="font-semibold">Waiting for an available doctor…</span>
                  </div>
                )}

                {a.simStatus === "confirmed" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleStart(a.appointment_id)}
                    disabled={updateAppointment.isPending}
                    className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-emerald disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> Start Case
                  </motion.button>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════ DOCTOR VIEW ═════════════════════════════════ */}
      {role === "doctor" && (
        <div className="space-y-4">

          {/* ── My active case ── */}
          {myActiveCase && (
            <motion.div
              key={myActiveCase.appointment_id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl border-2 border-cyan/30 bg-cyan/5 space-y-4"
            >
              <div className="flex items-center gap-1.5">
                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-cyan" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan">{t("current_case")} — {t("in_progress")}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
                    {myActiveCase.species === "dog" ? <Dog className="w-6 h-6" /> : <Cat className="w-6 h-6" />}
                  </motion.div>
                  <div>
                    <p className="text-lg font-extrabold">{myActiveCase.petName}</p>
                    <p className="text-xs text-muted-foreground">{myActiveCase.breed} · {myActiveCase.ownerName}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{myActiveCase.caseNumber}</p>
                  </div>
                </div>
                {myActiveCase.appointment_date && (
                  <span className="text-[10px] text-muted-foreground">{fmtDate(myActiveCase.appointment_date)}</span>
                )}
              </div>

              <p className="text-sm text-foreground/80">{myActiveCase.complaint}</p>

              {/* Assigned badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="font-bold">Assigned to you · Dr. {user?.fullname}</span>
              </div>

              {/* ── Prescriptions for this case ── */}
              {(() => {
                const rxs = getCasePrescriptions(myActiveCase.petId, myActiveCase.clientId);
                if (!rxs.length) return (
                  <div className="text-xs text-muted-foreground/60 italic px-1">No prescriptions issued yet for this case.</div>
                );
                return (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1">
                      <Pill className="w-3 h-3" /> Prescriptions for this case
                    </p>
                    {rxs.map((rx) => {
                      const drug = getDrugForRx(rx.prescription_id);
                      return (
                        <div key={rx.prescription_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs group">
                          <Pill className="w-3.5 h-3.5 text-emerald shrink-0" />
                          <span className="font-bold text-emerald flex-1 truncate">{drug?.name || "Drug"}</span>
                          <span className="text-muted-foreground opacity-60">RX-{rx.prescription_id.slice(0, 6)}</span>
                          <button
                            onClick={() => openEditPrescription(rx.prescription_id, myActiveCase.appointment_id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all ml-1"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeletePrescription(rx.prescription_id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-coral" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ── Visits for this case ── */}
              {myCaseVisits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Visits for this case
                  </p>
                  {myCaseVisits.map((v) => (
                    <div key={v.visit_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/5 border border-cyan/15 text-xs group">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan shrink-0" />
                      <span className="font-bold text-cyan flex-1 truncate">{v.notes || "Visit"}</span>
                      <span className="text-muted-foreground opacity-60">{fmtDate(v.date)}</span>
                      <button
                        onClick={() => openEditVisit(v)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all ml-1"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Doctor action buttons */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => openCreateVisit(myActiveCase.appointment_id, myActiveCase.petId, myActiveCase.clientId)}
                  className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold glow-cyan">
                  <Plus className="w-4 h-4" />{t("create_visit")}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => openCreatePrescription(myActiveCase.appointment_id)}
                  className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold glow-emerald">
                  <Plus className="w-4 h-4" />{t("prescribe")}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleComplete(myActiveCase.appointment_id)}
                  disabled={updateAppointment.isPending}
                  className="flex items-center gap-2 bg-emerald/90 hover:bg-emerald text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" />{t("complete")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Pending requests ── */}
          {!myActiveCase && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange" />
                <span className="text-sm font-bold">Pending Case Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange/15 text-orange font-black">{pendingRequests.length}</span>
                )}
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 rounded-xl border border-border/30 bg-muted/5 text-center space-y-2">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">{t("no_active_cases") || "No pending cases yet"}</p>
                  <p className="text-xs text-muted-foreground/60">{t("waiting_for_confirmed_appointments") || "Staff will dispatch cases here"}</p>
                </div>
              ) : (
                pendingRequests.map((a, i) => (
                  <motion.div key={a.appointment_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl border-2 border-orange/30 bg-orange/5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                          {a.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{a.petName}</p>
                          <p className="text-xs text-muted-foreground">{a.ownerName}</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{a.complaint}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg font-black bg-orange/15 text-orange whitespace-nowrap">Needs Doctor</span>
                    </div>

                    {a.appointment_date && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" /><span>{fmtDate(a.appointment_date)}</span>
                        <span className="font-mono opacity-60 ml-1">{a.caseNumber}</span>
                      </div>
                    )}

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(a.appointment_id)}
                      disabled={updateAppointment.isPending}
                      className="flex items-center justify-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold w-full disabled:opacity-50">
                      <ShieldCheck className="w-4 h-4" /> Accept This Case
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {myActiveCase && pendingRequests.length > 0 && (
            <div className="p-3 rounded-xl border border-border/30 bg-muted/5 border-dashed">
              <div className="flex items-center gap-1.5 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {pendingRequests.length} more case{pendingRequests.length > 1 ? "s" : ""} waiting
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Complete your current case to accept the next one.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ VISIT MODAL (portalled) ═══════════════════════ */}
      <Modal open={showVisitModal}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-cyan-blue flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold">{visitMode === "edit" ? "Edit Visit" : t("create_visit")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("log_clinical_encounter") || "Log clinical encounter"}</p>
              </div>
            </div>
            <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Patient strip (create mode only) */}
          {visitMode === "create" && visitAppt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                {visitAppt.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{visitAppt.petName}</p>
                <p className="text-xs text-muted-foreground truncate">{visitAppt.ownerName} · {visitAppt.complaint}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{visitAppt.caseNumber}</span>
            </div>
          )}

          {/* Doctor + Date (create mode) */}
          {visitMode === "create" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan/5 border border-cyan/15 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-cyan shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Doctor</p>
                  <p className="font-bold text-cyan truncate">{user?.fullname || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Date</p>
                  <p className="font-bold">{fmtDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>
          )}

          {/* ⚠️ No prescription warning */}
          {visitMode === "create" && visitAppt &&
            getUnlinkedCasePrescriptions(visitAppt.petId, visitAppt.clientId).length === 0 &&
            getCasePrescriptions(visitAppt.petId, visitAppt.clientId).length === 0 && (
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{t("no_prescription_for_visit_warning") || "No prescription issued yet. Consider prescribing first."}</span>
            </div>
          )}

          {/* Linked prescription — show only unlinked prescriptions for this case */}
          {visitMode === "create" && visitAppt && (() => {
            const unlinked = getUnlinkedCasePrescriptions(visitAppt.petId, visitAppt.clientId);
            if (!unlinked.length) return null;
            return (
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Link Prescription (this case)
                </label>
                <select
                  value={visitPrescriptionId}
                  onChange={(e) => setVisitPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 font-semibold"
                >
                  <option value="">None</option>
                  {unlinked.map((rx) => {
                    const drug = getDrugForRx(rx.prescription_id);
                    return (
                      <option key={rx.prescription_id} value={rx.prescription_id}>
                        {drug?.name || "Drug"} · RX-{rx.prescription_id.slice(0, 6)}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })()}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {t("clinical_notes_report")}
            </label>
            <textarea
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              placeholder={t("clinical_notes_placeholder") || "Symptoms, diagnosis, treatment notes…"}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan/50 resize-none"
              rows={4}
            />
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-cyan/5 border border-cyan/15 text-xs text-cyan/80">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t("visit_created_by_indicator") || "Recorded under your account, linked to the current case."}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowVisitModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors">
              {t("cancel")}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSaveVisit}
              disabled={createVisit.isPending || updateVisit.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl gradient-cyan-blue text-primary-foreground text-sm font-bold disabled:opacity-50">
              {createVisit.isPending || updateVisit.isPending ? t("creating") : visitMode === "edit" ? "Save Changes" : t("create_visit")}
            </motion.button>
          </div>
        </motion.div>
      </Modal>

      {/* ════════════════════ PRESCRIPTION MODAL (portalled) ════════════════ */}
      <Modal open={showPressModal}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold">{pressMode === "edit" ? "Edit Prescription" : t("prescribe_medication")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("select_drug_auto_dose") || "Dosage auto-filled from formulary"}</p>
              </div>
            </div>
            <button onClick={() => setShowPressModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Patient strip */}
          {pressAppt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                {pressAppt.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{pressAppt.petName}</p>
                <p className="text-xs text-muted-foreground truncate">{pressAppt.ownerName}</p>
              </div>
            </div>
          )}

          {/* Prescribing doctor */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald/5 border border-emerald/15 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-emerald shrink-0" />
            <span className="text-muted-foreground">{t("prescribing_doctor") || "Prescribing doctor"}:</span>
            <span className="font-bold text-emerald">Dr. {user?.fullname || "—"}</span>
          </div>

          {/* Drug selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" /> {pressMode === "edit" ? "Change Drug" : (t("select_drug") || "Select Drug")} *
            </label>
            <select
              value={selectedDrugId}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 font-semibold"
            >
              <option value="">{t("select_a_drug")}</option>
              {allDrugs.map((drug) => (
                <option key={drug.drug_id} value={drug.drug_id}>{drug.name} · {drug.drugClass}</option>
              ))}
            </select>

            {selectedDrug && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald/5 border border-emerald/15 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald">Drug Info · Auto-filled</p>
                {Object.entries(selectedDrug.dosage || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-bold text-emerald">{formatDose(v)}</span>
                  </div>
                ))}
                {selectedDrug.indications?.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-white/5">
                    <span className="font-bold">Indications: </span>
                    {selectedDrug.indications.slice(0, 2).join(", ")}{selectedDrug.indications.length > 2 && "…"}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Prescriptions already issued for this case */}
          {pressCasePrescriptions.length > 0 && (
            <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1.5">
              <p className="font-bold text-foreground/70 flex items-center gap-1">
                <Info className="w-3 h-3" /> Prescriptions issued for this case:
              </p>
              {pressCasePrescriptions.map((rx) => {
                const drug = getDrugForRx(rx.prescription_id);
                return (
                  <div key={rx.prescription_id} className="flex items-center gap-1.5">
                    <Pill className="w-2.5 h-2.5 text-emerald" />
                    <span className="text-emerald font-semibold">{drug?.name || "Drug"}</span>
                    <span className="opacity-50">RX-{rx.prescription_id.slice(0, 6)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowPressModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors">
              {t("cancel")}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSavePrescription}
              disabled={createPrescription.isPending || updatePrescription.isPending || !selectedDrugId}
              className="flex-1 px-4 py-2.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {createPrescription.isPending || updatePrescription.isPending
                ? t("prescribing")
                : pressMode === "edit" ? "Save Changes" : t("prescribe")}
            </motion.button>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}
