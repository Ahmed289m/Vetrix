"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  Dog,
  Cat,
  Clock,
  Activity,
  ChevronRight,
  Stethoscope,
  Pill,
  X,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  FileText,
  Info,
  UserCheck,
  Inbox,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointments, useUpdateAppointment } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useCreateVisit } from "@/app/_hooks/queries/use-visits";
import { useCreatePrescription, usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { useAuth } from "@/app/_hooks/useAuth";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import { useLang } from "@/app/_hooks/useLanguage";
import type {
  Appointment,
  Drug,
  Pet,
  PrescriptionCreate,
  User as UserModel,
  VisitCreate,
} from "@/app/_lib/types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const formatDose = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val)
        .replace(/["{}\[\]]/g, "")
        .replace(/:/g, ": ")
        .replace(/,/g, " · ");
    } catch {
      return String(val);
    }
  }
  return String(val);
};

/** Appointment statuses used by the simulation */
type SimStatus = "confirmed" | "pending-doctor" | "in-progress" | "completed";

interface Props {
  role: "staff" | "doctor";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SimulationMode({ role }: Props) {
  // Visit modal
  const [showVisitModal, setShowVisitModal]             = useState(false);
  const [activeVisitApptId, setActiveVisitApptId]       = useState("");
  const [visitNotes, setVisitNotes]                     = useState("");
  const [visitPrescriptionId, setVisitPrescriptionId]   = useState("");

  // Prescription modal
  const [showPressModal, setShowPressModal]   = useState(false);
  const [activePressApptId, setActivePressApptId] = useState("");
  const [selectedDrugId, setSelectedDrugId]   = useState("");

  const { t }    = useLang();
  const { user } = useAuth();

  // Keep React Query cache in sync with all other users in real-time.
  // When Staff patches an appointment (pending-doctor / in-progress),
  // the WS event "appointments:updated" fires → invalidates ["appointments"]
  // → Doctor's useAppointments() refetches and the Accept button appears.
  useWebSocket();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: apptData }      = useAppointments();
  const { data: petsData }      = usePets();
  const { data: usersData }     = useUsers();
  const { data: drugsData }     = useDrugs();
  const { data: presData }      = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();

  const updateAppointment  = useUpdateAppointment();
  const createVisit        = useCreateVisit();
  const createPrescription = useCreatePrescription();

  const allAppointments: Appointment[] = apptData?.data      || [];
  const allPets: Pet[]                 = petsData?.data      || [];
  const allUsers: UserModel[]          = usersData?.data     || [];
  const allDrugs: Drug[]               = drugsData?.data     || [];
  const allPrescriptions               = presData?.data      || [];
  const allPresItems                   = presItemsData?.data || [];

  // ── Build enriched appointment list ──────────────────────────────────────
  /**
   * Staff sees: confirmed + pending-doctor + in-progress (the full queue)
   * Doctor sees: pending-doctor (requests) + their own in-progress case
   */
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

  // ── Role-specific filtered lists ─────────────────────────────────────────
  /** My active case (doctor accepted it) */
  const myActiveCase = useMemo(
    () => simAppointments.find((a) => a.simStatus === "in-progress" && a.doctor_id === user?.userId),
    [simAppointments, user?.userId],
  );

  /** Cases awaiting any doctor (no doctor assigned yet) */
  const pendingRequests = useMemo(
    () => simAppointments.filter((a) => a.simStatus === "pending-doctor" && !a.doctor_id),
    [simAppointments],
  );

  // ── Prescription helpers ─────────────────────────────────────────────────
  const getCasePrescriptions = (petId: string, clientId: string) =>
    allPrescriptions.filter((rx) => rx.pet_id === petId && rx.client_id === clientId);

  const getDrugForRx = (rxId: string): Drug | undefined => {
    const rx   = allPrescriptions.find((p) => p.prescription_id === rxId);
    const item = allPresItems.find((pi) => pi.prescriptionItem_id === rx?.prescriptionItem_id);
    return allDrugs.find((d) => d.drug_id === item?.drug_id);
  };

  const selectedDrug = allDrugs.find((d) => d.drug_id === selectedDrugId);

  // ── Actions ───────────────────────────────────────────────────────────────

  /** STAFF: dispatch case to doctors */
  const handleStart = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "pending-doctor" } },
      {
        onSuccess: () => toast.info("Case dispatched — waiting for a doctor to accept"),
        onError: ()   => toast.error("Failed to start case"),
      },
    );
  };

  /** DOCTOR: accept a pending case */
  const handleAccept = (apptId: string) => {
    if (!user?.userId) return;
    if (myActiveCase) {
      toast.error("Complete your current case before accepting another.");
      return;
    }
    updateAppointment.mutate(
      { id: apptId, data: { status: "in-progress", doctor_id: user.userId } },
      {
        onSuccess: () => toast.success("Case accepted — you are the assigned doctor"),
        onError: ()   => toast.error("Failed to accept case"),
      },
    );
  };

  /** DOCTOR: complete active case */
  const handleComplete = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "completed" } },
      {
        onSuccess: () => toast.success("Case completed"),
        onError: ()   => toast.error("Failed to complete case"),
      },
    );
  };

  // ── Visit modal ───────────────────────────────────────────────────────────
  const openVisitModal = (apptId: string, petId: string, clientId: string) => {
    const rxs  = getCasePrescriptions(petId, clientId);
    const last = rxs[rxs.length - 1];
    setActiveVisitApptId(apptId);
    setVisitPrescriptionId(last?.prescription_id || "");
    setVisitNotes("");
    setShowVisitModal(true);
  };

  const handleCreateVisit = () => {
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
      onSuccess: () => {
        toast.success(t("visit_created_success") || "Visit recorded.");
        setShowVisitModal(false);
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.detail || t("visit_create_failed") || "Failed."),
    });
  };

  // ── Prescription modal ────────────────────────────────────────────────────
  const openPressModal = (apptId: string) => {
    setActivePressApptId(apptId);
    setSelectedDrugId("");
    setShowPressModal(true);
  };

  const handleCreatePrescription = () => {
    const appt = simAppointments.find((a) => a.appointment_id === activePressApptId);
    if (!appt || !selectedDrugId) { toast.warning("Select a drug first"); return; }
    createPrescription.mutate(
      { client_id: appt.clientId, pet_id: appt.petId, drug_id: selectedDrugId } satisfies PrescriptionCreate,
      {
        onSuccess: () => {
          toast.success(t("prescription_created_success") || "Prescription issued.");
          setShowPressModal(false);
          setSelectedDrugId("");
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to issue prescription."),
      },
    );
  };

  // Appointments used by modals
  const visitAppt = simAppointments.find((a) => a.appointment_id === activeVisitApptId);
  const pressAppt = simAppointments.find((a) => a.appointment_id === activePressApptId);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

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

      {/* ══════════════════════════ STAFF VIEW ══════════════════════════════ */}
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
                  a.simStatus === "confirmed"      ? "border-muted/40 bg-muted/5"          :
                  a.simStatus === "pending-doctor" ? "border-orange/30 bg-orange/5"        :
                                                     "border-cyan/30 bg-cyan/5"
                }`}
              >
                {/* Identity row */}
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
                    {a.simStatus === "confirmed"      ? t("waiting")     :
                     a.simStatus === "pending-doctor" ? "Awaiting Doctor" :
                                                        t("in_progress")}
                  </span>
                </div>

                {/* Doctor assignment strip */}
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

                {/* Start button (confirmed only) */}
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

      {/* ══════════════════════════ DOCTOR VIEW ═════════════════════════════ */}
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
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 rounded-full bg-cyan"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan">
                  {t("current_case")} — {t("in_progress")}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center"
                  >
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

              {/* Assigned-to-me badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="font-bold">Assigned to you · Dr. {user?.fullname}</span>
              </div>

              {/* Prescriptions on case */}
              {(() => {
                const rxs  = getCasePrescriptions(myActiveCase.petId, myActiveCase.clientId);
                if (!rxs.length) return null;
                const drug = getDrugForRx(rxs[rxs.length - 1].prescription_id);
                return (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs">
                    <Pill className="w-3.5 h-3.5 text-emerald" />
                    <span className="font-bold text-emerald">{drug?.name || "Drug"}</span>
                    <span className="text-muted-foreground ml-auto">{rxs.length} Rx issued</span>
                  </div>
                );
              })()}

              {/* Clinical action buttons */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => openVisitModal(myActiveCase.appointment_id, myActiveCase.petId, myActiveCase.clientId)}
                  className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-cyan"
                >
                  <Stethoscope className="w-4 h-4" /> {t("create_visit")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => openPressModal(myActiveCase.appointment_id)}
                  className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-emerald"
                >
                  <Pill className="w-4 h-4" /> {t("prescribe")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleComplete(myActiveCase.appointment_id)}
                  disabled={updateAppointment.isPending}
                  className="flex items-center gap-2 bg-emerald/90 hover:bg-emerald text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {t("complete")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Pending requests (visible when doctor has no active case) ── */}
          {!myActiveCase && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange" />
                <span className="text-sm font-bold">
                  Pending Case Requests
                </span>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange/15 text-orange font-black">
                    {pendingRequests.length}
                  </span>
                )}
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 rounded-xl border border-border/30 bg-muted/5 text-center space-y-2">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("no_active_cases") || "No pending cases yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {t("waiting_for_confirmed_appointments") ||
                      "Staff will dispatch cases here when they start them"}
                  </p>
                </div>
              ) : (
                pendingRequests.map((a, i) => (
                  <motion.div
                    key={a.appointment_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl border-2 border-orange/30 bg-orange/5 space-y-3"
                  >
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
                      <span className="text-[10px] px-2.5 py-1 rounded-lg font-black bg-orange/15 text-orange whitespace-nowrap">
                        Needs Doctor
                      </span>
                    </div>

                    {a.appointment_date && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{fmtDate(a.appointment_date)}</span>
                        <span className="font-mono opacity-60 ml-1">{a.caseNumber}</span>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(a.appointment_id)}
                      disabled={updateAppointment.isPending}
                      className="flex items-center justify-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Accept This Case
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ── Next in queue preview (when doctor has active case) ── */}
          {myActiveCase && pendingRequests.length > 0 && (
            <div className="p-3 rounded-xl border border-border/30 bg-muted/5 border-dashed">
              <div className="flex items-center gap-1.5 mb-2">
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

      {/* ════════════ VISIT MODAL ════════════════════════════════════════════ */}
      <AnimatePresence>
        {showVisitModal && visitAppt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-cyan-blue flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{t("create_visit")}</h3>
                    <p className="text-[10px] text-muted-foreground">{t("log_clinical_encounter") || "Log clinical encounter"}</p>
                  </div>
                </div>
                <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient strip */}
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

              {/* Doctor + Date */}
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

              {/* ⚠️ No prescription warning */}
              {getCasePrescriptions(visitAppt.petId, visitAppt.clientId).length === 0 && (
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">
                    {t("no_prescription_for_visit_warning") ||
                      "No prescription issued yet for this case. Consider prescribing first."}
                  </span>
                </div>
              )}

              {/* Linked prescription */}
              {getCasePrescriptions(visitAppt.petId, visitAppt.clientId).length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" /> {t("link_prescription") || "Linked Prescription"}
                  </label>
                  <select
                    value={visitPrescriptionId}
                    onChange={(e) => setVisitPrescriptionId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 font-semibold"
                  >
                    <option value="">None</option>
                    {getCasePrescriptions(visitAppt.petId, visitAppt.clientId).map((rx) => {
                      const drug = getDrugForRx(rx.prescription_id);
                      return (
                        <option key={rx.prescription_id} value={rx.prescription_id}>
                          {drug?.name || "Drug"} · RX-{rx.prescription_id.slice(0, 6)}
                        </option>
                      );
                    })}
                  </select>
                  {visitPrescriptionId && (() => {
                    const drug = getDrugForRx(visitPrescriptionId);
                    if (!drug) return null;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs">
                        <Pill className="w-3.5 h-3.5 text-emerald" />
                        <span className="font-bold text-emerald">{drug.name}</span>
                        <span className="text-muted-foreground">{drug.drugClass}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

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

              {/* Info */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-cyan/5 border border-cyan/15 text-xs text-cyan/80">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{t("visit_created_by_indicator") || "Recorded under your account, linked to the current case."}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowVisitModal(false); setVisitNotes(""); setVisitPrescriptionId(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreateVisit}
                  disabled={createVisit.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-cyan-blue text-primary-foreground text-sm font-bold disabled:opacity-50"
                >
                  {createVisit.isPending ? t("creating") : t("create_visit")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════ PRESCRIPTION MODAL ════════════════════════════════════ */}
      <AnimatePresence>
        {showPressModal && pressAppt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center">
                    <Pill className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{t("prescribe_medication")}</h3>
                    <p className="text-[10px] text-muted-foreground">{t("select_drug_auto_dose") || "Dosage auto-filled from formulary"}</p>
                  </div>
                </div>
                <button onClick={() => { setShowPressModal(false); setSelectedDrugId(""); }} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient + Prescribing doctor */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  {pressAppt.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{pressAppt.petName}</p>
                  <p className="text-xs text-muted-foreground truncate">{pressAppt.ownerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald/5 border border-emerald/15 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-emerald shrink-0" />
                <span className="text-muted-foreground">{t("prescribing_doctor") || "Prescribing doctor"}:</span>
                <span className="font-bold text-emerald">Dr. {user?.fullname || "—"}</span>
              </div>

              {/* Drug selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> {t("select_drug") || "Select Drug"} *
                </label>
                <select
                  value={selectedDrugId}
                  onChange={(e) => setSelectedDrugId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 font-semibold"
                >
                  <option value="">{t("select_a_drug")}</option>
                  {allDrugs.map((drug) => (
                    <option key={drug.drug_id} value={drug.drug_id}>
                      {drug.name} · {drug.drugClass}
                    </option>
                  ))}
                </select>
                {selectedDrug && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald/5 border border-emerald/15 space-y-2"
                  >
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
                        {selectedDrug.indications.slice(0, 2).join(", ")}
                        {selectedDrug.indications.length > 2 && "…"}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Already prescribed */}
              {getCasePrescriptions(pressAppt.petId, pressAppt.clientId).length > 0 && (
                <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <p className="font-bold text-foreground/70 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {t("already_prescribed_on_case") || "Already prescribed:"}
                  </p>
                  {getCasePrescriptions(pressAppt.petId, pressAppt.clientId).map((rx) => {
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

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowPressModal(false); setSelectedDrugId(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreatePrescription}
                  disabled={createPrescription.isPending || !selectedDrugId}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPrescription.isPending ? t("prescribing") : t("prescribe")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
