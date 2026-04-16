"use client";

import { useState, useMemo } from "react";
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
  Lock,
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
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import type {
  Appointment,
  Drug,
  Pet,
  PrescriptionCreate,
  User as UserModel,
  VisitCreate,
} from "@/app/_lib/types/models";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatDose = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val).replace(/["{}\[\]]/g, "").replace(/:/g, ": ").replace(/,/g, " · ");
    } catch { return String(val); }
  }
  return String(val);
};

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Simulation case lifecycle:
 *  waiting        → staff has not started it yet
 *  pending-doctor → staff started it; waiting for a free doctor to accept
 *  in-progress    → a doctor accepted and is handling it
 *  completed      → doctor closed it
 */
type CaseStatus = "waiting" | "pending-doctor" | "in-progress" | "completed";

interface SimCase {
  id: string;
  caseNumber: string;
  petName: string;
  petId: string;
  clientId: string;
  species: "dog" | "cat";
  breed: string;
  ownerName: string;
  complaint: string;
  severity: "normal" | "urgent" | "emergency";
  /** Original doctor from the appointment (may be empty) */
  originalDoctor: string;
  originalDoctorId: string | null;
  appointmentDate: string | null;
  status: CaseStatus;
}

const severityConfig = {
  normal:    { bg: "bg-emerald/10", border: "border-emerald/30", text: "text-emerald",  labelKey: "normal" },
  urgent:    { bg: "bg-orange/10",  border: "border-orange/30",  text: "text-orange",   labelKey: "urgent" },
  emergency: { bg: "bg-coral/10",   border: "border-coral/30",   text: "text-coral",    labelKey: "emergency" },
};

interface Props { role: "staff" | "doctor"; }

// ─────────────────────────────────────────────────────────────────────────────

export default function SimulationMode({ role }: Props) {
  // Local simulation state — independent per browser session
  const [caseStatuses,   setCaseStatuses]   = useState<Record<string, CaseStatus>>({});
  /** Maps caseId → userId of the doctor who accepted */
  const [acceptedDoctors, setAcceptedDoctors] = useState<Record<string, string>>({});

  // Visit modal
  const [showVisitModal,       setShowVisitModal]       = useState(false);
  const [activeVisitCaseId,    setActiveVisitCaseId]    = useState<string>("");
  const [visitNotes,           setVisitNotes]           = useState("");
  const [visitPrescriptionId,  setVisitPrescriptionId]  = useState("");

  // Prescription modal
  const [showPrescriptionModal,    setShowPrescriptionModal]    = useState(false);
  const [activePressCaseId,        setActivePressCaseId]        = useState<string>("");
  const [selectedDrugId,           setSelectedDrugId]           = useState<string>("");

  const { t }    = useLang();
  const { user } = useAuth();

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: appointmentsData } = useAppointments();
  const { data: petsData }         = usePets();
  const { data: usersData }        = useUsers();
  const { data: drugsData }        = useDrugs();
  const { data: presData }         = usePrescriptions();
  const { data: presItemsData }    = usePrescriptionItems();

  const updateAppointment  = useUpdateAppointment();
  const createVisit        = useCreateVisit();
  const createPrescription = useCreatePrescription();

  useWebSocket();

  const allPrescriptions = presData?.data     || [];
  const allPresItems     = presItemsData?.data || [];
  const allDrugs         = drugsData?.data     || [];
  const allUsers: UserModel[] = usersData?.data || [];

  // ── Build confirmed case list ────────────────────────────────────────────────
  const confirmedCases: SimCase[] = useMemo(() => {
    const appointments: Appointment[] = appointmentsData?.data || [];
    const pets: Pet[]                 = petsData?.data         || [];

    return appointments
      .filter((apt) => apt.status === "confirmed")
      .sort((a, b) => {
        const dA = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
        const dB = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
        return dA - dB;
      })
      .map((apt, index) => {
        const pet    = pets.find((p) => p.pet_id === apt.pet_id);
        const doctor = apt.doctor_id ? allUsers.find((u) => u.user_id === apt.doctor_id) : null;
        const client = allUsers.find((u) => u.user_id === apt.client_id);
        return {
          id:               apt.appointment_id,
          caseNumber:       `APT-${String(index + 1).padStart(4, "0")}`,
          petName:          pet?.name                || t("unknown_pet"),
          petId:            apt.pet_id,
          clientId:         apt.client_id,
          species:          (pet?.type || "dog")     as "dog" | "cat",
          breed:            pet?.breed               || t("mixed"),
          ownerName:        client?.fullname         || t("unknown_owner"),
          complaint:        apt.reason               || t("regular_checkup"),
          severity:         "normal"                 as const,
          originalDoctor:   doctor?.fullname         || "",
          originalDoctorId: apt.doctor_id            || null,
          appointmentDate:  apt.appointment_date     || null,
          status:           "waiting"                as const,
        };
      });
  }, [appointmentsData, petsData, allUsers, t]);

  // Merge confirmed cases with local simulation statuses
  const cases: SimCase[] = useMemo(
    () => confirmedCases.map((c) => ({ ...c, status: caseStatuses[c.id] ?? c.status })),
    [confirmedCases, caseStatuses],
  );

  // ── Doctor in-progress case ──────────────────────────────────────────────────
  /** The case this doctor currently owns (accepted and in-progress) */
  const myActiveCase = useMemo(() =>
    cases.find((c) => c.status === "in-progress" && acceptedDoctors[c.id] === user?.userId),
    [cases, acceptedDoctors, user?.userId],
  );

  /** Cases pending a doctor (staff started, no one accepted yet) */
  const pendingRequests = useMemo(() =>
    cases.filter((c) => c.status === "pending-doctor" && !acceptedDoctors[c.id]),
    [cases, acceptedDoctors],
  );

  /** Doctors currently busy (have an in-progress case) */
  const busyDoctorIds = useMemo(() => new Set(Object.values(acceptedDoctors)), [acceptedDoctors]);
  const thisDocторIsBusy = user?.userId ? busyDoctorIds.has(user.userId) : false;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getDrugForRx = (rxId: string): Drug | undefined => {
    const rx   = allPrescriptions.find((p) => p.prescription_id === rxId);
    const item = allPresItems.find((pi) => pi.prescriptionItem_id === rx?.prescriptionItem_id);
    return allDrugs.find((d) => d.drug_id === item?.drug_id);
  };

  const getCasePrescriptions = (caseId: string) => {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return [];
    return allPrescriptions.filter((rx) => rx.pet_id === c.petId && rx.client_id === c.clientId);
  };

  const getAcceptedDoctorName = (caseId: string) => {
    const uid = acceptedDoctors[caseId];
    if (!uid) return null;
    return allUsers.find((u) => u.user_id === uid)?.fullname || null;
  };

  // ── Staff actions ─────────────────────────────────────────────────────────────
  const handleStart = (caseId: string) => {
    setCaseStatuses((prev) => ({ ...prev, [caseId]: "pending-doctor" }));
    toast.info("Case dispatched — waiting for a doctor to accept");
  };

  // ── Doctor actions ────────────────────────────────────────────────────────────
  const handleAccept = (caseId: string) => {
    if (!user?.userId) return;
    if (thisDocторIsBusy) {
      toast.error("You already have an active case. Complete it first.");
      return;
    }
    // Update appointment doctor_id in backend
    updateAppointment.mutate(
      { id: caseId, data: { doctor_id: user.userId } },
      {
        onSuccess: () => {
          setAcceptedDoctors((prev) => ({ ...prev, [caseId]: user.userId! }));
          setCaseStatuses((prev) => ({ ...prev, [caseId]: "in-progress" }));
          toast.success("Case accepted — you are now the assigned doctor");
        },
        onError: () => toast.error("Failed to accept case"),
      },
    );
  };

  const handleComplete = (caseId: string) => {
    updateAppointment.mutate(
      { id: caseId, data: { status: "completed" } },
      {
        onSuccess: () => {
          setCaseStatuses((prev) => ({ ...prev, [caseId]: "completed" }));
          setAcceptedDoctors((prev) => {
            const next = { ...prev };
            delete next[caseId];
            return next;
          });
          toast.success("Case completed");
        },
        onError: () => toast.error("Failed to complete case"),
      },
    );
  };

  // ── Visit modal ───────────────────────────────────────────────────────────────
  const openVisitModal = (caseId: string) => {
    const casePrescriptions = getCasePrescriptions(caseId);
    const latestRx = casePrescriptions[casePrescriptions.length - 1];
    setActiveVisitCaseId(caseId);
    setVisitPrescriptionId(latestRx?.prescription_id || "");
    setVisitNotes("");
    setShowVisitModal(true);
  };

  const handleCreateVisit = () => {
    const c = cases.find((x) => x.id === activeVisitCaseId);
    if (!c || !user) return;

    const doctorId = acceptedDoctors[c.id] || user.userId;

    const payload: VisitCreate = {
      pet_id:    c.petId,
      client_id: c.clientId,
      doctor_id: doctorId,
      notes:     visitNotes || t("visit_created_from_simulation_mode"),
      date:      new Date().toISOString(),
      ...(visitPrescriptionId && { prescription_id: visitPrescriptionId }),
    };

    createVisit.mutate(payload, {
      onSuccess: () => {
        toast.success(t("visit_created_success") || "Visit recorded successfully.");
        setShowVisitModal(false);
        setVisitNotes("");
        setVisitPrescriptionId("");
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || t("visit_create_failed") || "Failed to record visit.";
        toast.error(msg);
      },
    });
  };

  // ── Prescription modal ────────────────────────────────────────────────────────
  const openPrescriptionModal = (caseId: string) => {
    setActivePressCaseId(caseId);
    setSelectedDrugId("");
    setShowPrescriptionModal(true);
  };

  const handleCreatePrescription = () => {
    const c = cases.find((x) => x.id === activePressCaseId);
    if (!c || !selectedDrugId) { toast.warning("Select a drug first"); return; }

    createPrescription.mutate(
      { client_id: c.clientId, pet_id: c.petId, drug_id: selectedDrugId } satisfies PrescriptionCreate,
      {
        onSuccess: () => {
          toast.success(t("prescription_created_success") || "Prescription issued.");
          setShowPrescriptionModal(false);
          setSelectedDrugId("");
        },
        onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to issue prescription."),
      },
    );
  };

  const isStaff  = role === "staff";
  const isDoctor = role === "doctor";

  const selectedDrug = allDrugs.find((d) => d.drug_id === selectedDrugId);
  const visitCase    = cases.find((x) => x.id === activeVisitCaseId);
  const pressCase    = cases.find((x) => x.id === activePressCaseId);

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ── */}
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
            {isStaff ? t("staff_controls_short") : t("doctor_view_short")}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
           STAFF VIEW
         ════════════════════════════════════════════════════════════════════════ */}
      {isStaff && (
        <div className="space-y-4">

          {/* Queue summary */}
          {cases.length === 0 ? (
            <div className="p-8 rounded-xl border-2 border-emerald/30 bg-emerald/5 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald mx-auto" />
              <p className="font-bold text-emerald">{t("no_more_cases")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c, i) => {
                const acceptedDoc = getAcceptedDoctorName(c.id);
                const cfg = severityConfig[c.severity];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 rounded-xl border-2 ${cfg.border} ${cfg.bg} space-y-3`}
                  >
                    {/* Case identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                          {c.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{c.petName}</p>
                          <p className="text-xs text-muted-foreground">{c.ownerName} · {c.complaint}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{c.caseNumber}</p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase whitespace-nowrap ${
                        c.status === "waiting"        ? "bg-muted/30 text-muted-foreground" :
                        c.status === "pending-doctor" ? "bg-orange/15 text-orange" :
                        c.status === "in-progress"    ? "bg-cyan/15 text-cyan" :
                                                        "bg-emerald/15 text-emerald"
                      }`}>
                        {c.status === "waiting"        ? t("waiting") :
                         c.status === "pending-doctor" ? "Awaiting Doctor" :
                         c.status === "in-progress"    ? t("in_progress") :
                                                         t("completed")}
                      </span>
                    </div>

                    {/* Doctor assignment strip */}
                    {(acceptedDoc || c.status === "pending-doctor") && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                        acceptedDoc
                          ? "bg-emerald/10 border border-emerald/20 text-emerald"
                          : "bg-orange/10 border border-orange/20 text-orange"
                      }`}>
                        {acceptedDoc ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-bold">Dr. {acceptedDoc}</span>
                            <span className="opacity-70 ml-auto">assigned</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                            <span className="font-semibold">Waiting for available doctor…</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Staff action */}
                    {c.status === "waiting" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleStart(c.id)}
                        className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-emerald"
                      >
                        <Play className="w-4 h-4" /> {t("start")} Case
                      </motion.button>
                    )}

                    {c.status === "completed" && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Case completed by {acceptedDoc || "doctor"}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           DOCTOR VIEW
         ════════════════════════════════════════════════════════════════════════ */}
      {isDoctor && (
        <div className="space-y-4">

          {/* ── My active case ── */}
          {myActiveCase ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={myActiveCase.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-xl border-2 ${severityConfig[myActiveCase.severity].border} ${severityConfig[myActiveCase.severity].bg} space-y-4`}
              >
                {/* Header */}
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

                {/* Case info */}
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
                  <div className="text-right space-y-1">
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${severityConfig[myActiveCase.severity].bg} ${severityConfig[myActiveCase.severity].text}`}>
                      {t(severityConfig[myActiveCase.severity].labelKey)}
                    </span>
                    {myActiveCase.appointmentDate && (
                      <p className="text-[10px] text-muted-foreground">{fmtDate(myActiveCase.appointmentDate)}</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-foreground/80">{myActiveCase.complaint}</p>

                {/* Doctor badge (self) */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-cyan" />
                  <span className="text-cyan font-bold">You are assigned · Dr. {user?.fullname}</span>
                </div>

                {/* Prescription summary */}
                {(() => {
                  const rxs = getCasePrescriptions(myActiveCase.id);
                  if (rxs.length === 0) return null;
                  const drug = getDrugForRx(rxs[rxs.length - 1].prescription_id);
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs">
                      <Pill className="w-3.5 h-3.5 text-emerald" />
                      <span className="font-bold text-emerald">{drug?.name || "Drug"}</span>
                      <span className="text-muted-foreground ml-auto">{rxs.length} Rx issued</span>
                    </div>
                  );
                })()}

                {/* Doctor action buttons */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => openVisitModal(myActiveCase.id)}
                    className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-cyan"
                  >
                    <Stethoscope className="w-4 h-4" /> {t("create_visit")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => openPrescriptionModal(myActiveCase.id)}
                    className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-emerald"
                  >
                    <Pill className="w-4 h-4" /> {t("prescribe")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleComplete(myActiveCase.id)}
                    disabled={updateAppointment.isPending}
                    className="flex items-center gap-2 bg-emerald/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t("complete")}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* ── No active case: show pending requests ── */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange" />
                <span className="text-sm font-bold">
                  Pending Case Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-orange/15 text-orange font-black">
                      {pendingRequests.length}
                    </span>
                  )}
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 rounded-xl border border-border/30 bg-muted/5 text-center space-y-2">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("no_active_cases") || "No pending cases right now"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {t("waiting_for_confirmed_appointments") || "Waiting for staff to start a case"}
                  </p>
                </div>
              ) : (
                pendingRequests.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl border-2 border-orange/30 bg-orange/5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                          {c.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{c.petName}</p>
                          <p className="text-xs text-muted-foreground">{c.ownerName}</p>
                          <p className="text-xs text-foreground/70 mt-0.5">{c.complaint}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg font-black bg-orange/15 text-orange whitespace-nowrap">
                        Needs Doctor
                      </span>
                    </div>

                    {c.appointmentDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{fmtDate(c.appointmentDate)}</span>
                        <span className="font-mono opacity-60 ml-1">{c.caseNumber}</span>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(c.id)}
                      disabled={updateAppointment.isPending || thisDocторIsBusy}
                      className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {thisDocторIsBusy ? "You have an active case" : "Accept This Case"}
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           VISIT MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showVisitModal && visitCase && (
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
                  {visitCase.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{visitCase.petName}</p>
                  <p className="text-xs text-muted-foreground truncate">{visitCase.ownerName} · {visitCase.complaint}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{visitCase.caseNumber}</span>
              </div>

              {/* Doctor + Date auto-info */}
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

              {/* ⚠️ No-prescription warning */}
              {getCasePrescriptions(visitCase.id).length === 0 && (
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">
                    {t("no_prescription_for_visit_warning") ||
                      "No prescription has been issued for this case yet. Consider prescribing before closing the visit."}
                  </span>
                </div>
              )}

              {/* Linked prescription */}
              {getCasePrescriptions(visitCase.id).length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" /> {t("link_prescription") || "Linked Prescription"}
                  </label>
                  <select
                    value={visitPrescriptionId}
                    onChange={(e) => setVisitPrescriptionId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 font-semibold"
                  >
                    <option value="">{t("no_prescription_linked") || "None"}</option>
                    {getCasePrescriptions(visitCase.id).map((rx) => {
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
                <span>{t("visit_created_by_indicator") || "Recorded under your doctor account, linked to the current active case."}</span>
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

      {/* ════════════════════════════════════════════════════════════════════════
           PRESCRIPTION MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPrescriptionModal && pressCase && (
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
                <button onClick={() => { setShowPrescriptionModal(false); setSelectedDrugId(""); }} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient strip */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  {pressCase.species === "dog" ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{pressCase.petName}</p>
                  <p className="text-xs text-muted-foreground truncate">{pressCase.ownerName}</p>
                </div>
              </div>

              {/* Prescribing doctor */}
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
                  {allDrugs.map((drug: Drug) => (
                    <option key={drug.drug_id} value={drug.drug_id}>
                      {drug.name} · {drug.drugClass}
                    </option>
                  ))}
                </select>

                {/* Live drug preview */}
                {selectedDrug && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald/5 border border-emerald/15 space-y-2"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald">Drug Info • Auto-filled</p>
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
              {getCasePrescriptions(pressCase.id).length > 0 && (
                <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <p className="font-bold text-foreground/70 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {t("already_prescribed_on_case") || "Already prescribed for this case:"}
                  </p>
                  {getCasePrescriptions(pressCase.id).map((rx) => {
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
                  onClick={() => { setShowPrescriptionModal(false); setSelectedDrugId(""); }}
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
