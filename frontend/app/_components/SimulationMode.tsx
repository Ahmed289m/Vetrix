"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { useUpdateAppointment } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useCreateVisit } from "@/app/_hooks/queries/use-visits";
import { useCreatePrescription } from "@/app/_hooks/queries/use-prescriptions";
import { useCreatePrescriptionItem } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import type {
  Appointment,
  Drug,
  Pet,
  PrescriptionCreate,
  PrescriptionItemCreate,
  User,
  VisitCreate,
} from "@/app/_lib/types/models";

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
  doctor: string;
  status: "waiting" | "in-progress" | "completed";
}

const severityConfig = {
  normal: {
    bg: "bg-emerald/10",
    border: "border-emerald/30",
    text: "text-emerald",
    labelKey: "normal",
  },
  urgent: {
    bg: "bg-orange/10",
    border: "border-orange/30",
    text: "text-orange",
    labelKey: "urgent",
  },
  emergency: {
    bg: "bg-coral/10",
    border: "border-coral/30",
    text: "text-coral",
    labelKey: "emergency",
  },
};

interface Props {
  role: "staff" | "doctor";
}

export default function SimulationMode({ role }: Props) {
  const [caseStatuses, setCaseStatuses] = useState<
    Record<string, SimCase["status"]>
  >({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");
  const [selectedDrugId, setSelectedDrugId] = useState<string>("");
  const [drugDose, setDrugDose] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch real data
  const { t } = useLang();
  const { user } = useAuth();
  const { data: appointmentsData, refetch: refetchAppointments } =
    useAppointments();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();
  const { data: drugsData } = useDrugs();
  const updateAppointment = useUpdateAppointment();
  const createVisit = useCreateVisit();
  const createPrescription = useCreatePrescription();
  const createPrescriptionItem = useCreatePrescriptionItem();

  // Initialize websocket connection for real-time updates
  useWebSocket();

  // Setup websocket listener for appointment updates
  useEffect(() => {
    const WS_URL =
      process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ??
      "ws://localhost:8000";

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as {
              event: string;
              data?: unknown;
            };

            // Listen for appointment updates
            if (
              message.event === "appointments:updated" ||
              message.event === "appointments:created" ||
              message.event === "appointments:deleted"
            ) {
              console.log(
                "[SimulationMode] Received websocket event:",
                message.event,
              );
              // Trigger refetch to get updated data
              refetchAppointments();
            }
          } catch (err) {
            console.error(
              "[SimulationMode] Error parsing websocket message:",
              err,
            );
          }
        };

        ws.onerror = (error) => {
          console.error("[SimulationMode] WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("[SimulationMode] WebSocket connection closed");
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error("[SimulationMode] Failed to connect websocket:", err);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [refetchAppointments]);

  // Convert real appointments to simulation cases
  const confirmedCases = useMemo(() => {
    const appointments: Appointment[] = appointmentsData?.data || [];
    const pets: Pet[] = petsData?.data || [];
    const users: User[] = usersData?.data || [];

    console.log("[SimulationMode] Data loaded:", {
      appointmentsCount: appointments.length,
      petsCount: pets.length,
      usersCount: users.length,
      appointmentStatuses: appointments.map((apt) => apt.status),
    });

    // Filter for confirmed appointments (not pending or completed), sort by date
    const confirmed = appointments
      .filter((apt) => apt.status === "confirmed")
      .sort((a, b) => {
        const dateA = a.appointment_date
          ? new Date(a.appointment_date).getTime()
          : 0;
        const dateB = b.appointment_date
          ? new Date(b.appointment_date).getTime()
          : 0;
        return dateA - dateB;
      })
      .map((apt, index) => {
        const pet = pets.find((p) => p.pet_id === apt.pet_id);
        const doctor = apt.doctor_id
          ? users.find((u) => u.user_id === apt.doctor_id)
          : null;
        const client = users.find((u) => u.user_id === apt.client_id);

        return {
          id: apt.appointment_id,
          caseNumber: `APT-${String(index + 1).padStart(4, "0")}`,
          petName: pet?.name || t("unknown_pet"),
          petId: apt.pet_id,
          clientId: apt.client_id,
          species: (pet?.type || "dog") as "dog" | "cat",
          breed: pet?.breed || t("mixed"),
          ownerName: client?.fullname || t("unknown_owner"),
          complaint: apt.reason || t("regular_checkup"),
          severity: "normal" as const,
          doctor: doctor?.fullname || t("doctor_assigned"),
          status: "waiting" as const,
        } as SimCase;
      });

    console.log("[SimulationMode] Confirmed cases:", confirmed.length, "cases");
    return confirmed;
  }, [appointmentsData, petsData, usersData, t]);

  const cases = useMemo(
    () =>
      confirmedCases.map((confirmedCase) => ({
        ...confirmedCase,
        status: caseStatuses[confirmedCase.id] ?? confirmedCase.status,
      })),
    [confirmedCases, caseStatuses],
  );

  // Update local state when confirmed cases change
  const activeIdx =
    currentIdx >= cases.length && cases.length > 0 ? 0 : currentIdx;
  const currentCase = cases[activeIdx];
  const nextCase = cases[activeIdx + 1] || null;
  const allDone = activeIdx >= cases.length;

  const handleStart = () => {
    const currentCaseId = cases[activeIdx]?.id;
    if (!currentCaseId) return;

    setCaseStatuses((prev) => ({
      ...prev,
      [currentCaseId]: "in-progress",
    }));
  };

  const handleComplete = () => {
    const completeCase = cases[activeIdx];
    if (!completeCase) return;

    console.log(
      "[SimulationMode] Completing case:",
      completeCase.id,
      "-",
      completeCase.petName,
    );

    // Update the appointment status to "completed" in the backend
    updateAppointment.mutate(
      {
        id: completeCase.id,
        data: { status: "completed" },
      },
      {
        onSuccess: () => {
          console.log(
            "[SimulationMode] Case completed successfully:",
            completeCase.id,
          );
          setCaseStatuses((prev) => ({
            ...prev,
            [completeCase.id]: "completed",
          }));
          setCurrentIdx((prev) => prev + 1);
        },
        onError: (error) => {
          console.error("[SimulationMode] Failed to complete case:", error);
        },
      },
    );
  };

  const handleCreateVisit = () => {
    const currentCase = cases[activeIdx];
    if (!currentCase || !user) return;

    console.log("[SimulationMode] Creating visit for case:", currentCase.id);

    createVisit.mutate(
      {
        pet_id: currentCase.petId,
        client_id: currentCase.clientId,
        doctor_id: user.userId,
        notes: visitNotes || t("visit_created_from_simulation_mode"),
        date: new Date().toISOString(),
      } satisfies VisitCreate,
      {
        onSuccess: (visitData) => {
          console.log(
            "[SimulationMode] Visit created successfully:",
            visitData,
          );
          setShowVisitModal(false);
          setVisitNotes("");
        },
        onError: (error) => {
          console.error("[SimulationMode] Failed to create visit:", error);
        },
      },
    );
  };

  const handleCreatePrescription = () => {
    const currentCase = cases[activeIdx];
    if (!currentCase || !selectedDrugId || !drugDose) {
      console.warn("[SimulationMode] Missing required prescription fields");
      return;
    }

    console.log(
      "[SimulationMode] Creating prescription item for case:",
      currentCase.id,
    );

    // First, create the prescription item with drug and dosage
    createPrescriptionItem.mutate(
      {
        drug_id: selectedDrugId,
        drugDose: drugDose,
      } satisfies PrescriptionItemCreate,
      {
        onSuccess: (itemData) => {
          const prescriptionItemId = itemData.data.prescriptionItem_id;
          console.log(
            "[SimulationMode] Prescription item created:",
            prescriptionItemId,
          );

          // Then, create the prescription with the item
          createPrescription.mutate(
            {
              client_id: currentCase.clientId,
              pet_id: currentCase.petId,
              prescriptionItem_id: prescriptionItemId,
            } satisfies PrescriptionCreate,
            {
              onSuccess: (prescriptionData) => {
                console.log(
                  "[SimulationMode] Prescription created successfully:",
                  prescriptionData,
                );
                setShowPrescriptionModal(false);
                setSelectedDrugId("");
                setDrugDose("");
              },
              onError: (error) => {
                console.error(
                  "[SimulationMode] Failed to create prescription:",
                  error,
                );
              },
            },
          );
        },
        onError: (error) => {
          console.error(
            "[SimulationMode] Failed to create prescription item:",
            error,
          );
        },
      },
    );
  };

  const isStaff = role === "staff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={
              currentCase?.status === "in-progress" ? { rotate: 360 } : {}
            }
            transition={{
              repeat: currentCase?.status === "in-progress" ? Infinity : 0,
              duration: 3,
              ease: "linear",
            }}
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
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              animate={
                i === currentIdx && c.status === "in-progress"
                  ? { scale: [1, 1.3, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                c.status === "completed"
                  ? "bg-emerald"
                  : i === currentIdx && c.status === "in-progress"
                    ? "bg-cyan glow-cyan"
                    : i === currentIdx
                      ? "bg-orange"
                      : "bg-muted/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* All done state OR no cases for doctor */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-xl border-2 border-emerald/30 bg-emerald/5 text-center space-y-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald mx-auto" />
          </motion.div>
          <p className="text-lg font-extrabold text-emerald">
            {isStaff ? t("no_more_cases") : t("no_active_cases")}
          </p>
          {!isStaff && (
            <p className="text-xs text-muted-foreground">
              {t("waiting_for_confirmed_appointments")}
            </p>
          )}
        </motion.div>
      )}

      {/* Current Case */}
      <AnimatePresence mode="wait">
        {currentCase && !allDone && (
          <motion.div
            key={currentCase.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`p-5 rounded-xl border-2 ${severityConfig[currentCase.severity].border} ${severityConfig[currentCase.severity].bg} space-y-4`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("current_case")}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={
                    currentCase.status === "in-progress"
                      ? { scale: [1, 1.08, 1] }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center"
                >
                  {currentCase.species === "dog" ? (
                    <Dog className="w-6 h-6 text-foreground" />
                  ) : (
                    <Cat className="w-6 h-6 text-foreground" />
                  )}
                </motion.div>
                <div>
                  <p className="text-lg font-extrabold">
                    {currentCase.petName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentCase.breed} · {currentCase.ownerName}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {currentCase.caseNumber}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <span
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${severityConfig[currentCase.severity].bg} ${severityConfig[currentCase.severity].text}`}
                >
                  {t(severityConfig[currentCase.severity].labelKey)}
                </span>
                <p className="text-xs text-muted-foreground">
                  {currentCase.doctor}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/80">
              {currentCase.complaint}
            </p>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  currentCase.status === "in-progress"
                    ? "bg-cyan/15 text-cyan"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {currentCase.status === "in-progress" && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 rounded-full bg-cyan"
                  />
                )}
                {currentCase.status === "waiting" ? t("waiting") : t("in_progress")}
              </span>
            </div>

            {/* Staff controls */}
            {isStaff && (
              <div className="flex items-center gap-3 pt-2">
                {currentCase.status === "waiting" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-emerald ripple"
                  >
                    <Play className="w-4 h-4" /> {t("start")}
                  </motion.button>
                )}
                {currentCase.status === "in-progress" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleComplete}
                    className="flex items-center gap-2 bg-emerald text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-emerald ripple"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t("complete")}
                  </motion.button>
                )}
              </div>
            )}

            {/* Doctor controls */}
            {!isStaff && (
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowVisitModal(true)}
                  className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-cyan ripple"
                >
                  <Stethoscope className="w-4 h-4" /> {t("create_visit")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPrescriptionModal(true)}
                  className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-emerald ripple"
                >
                  <Pill className="w-4 h-4" /> {t("prescribe")}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Case Preview */}
      <AnimatePresence>
        {nextCase && !allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl bg-muted/10 border border-border/30 border-dashed"
          >
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("next_case_label")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                {nextCase.species === "dog" ? (
                  <Dog className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Cat className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">
                  {nextCase.petName}{" "}
                  <span className="font-normal text-muted-foreground text-xs">
                    — {nextCase.ownerName}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {nextCase.complaint}
                </p>
              </div>
              <span
                className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${severityConfig[nextCase.severity].bg} ${severityConfig[nextCase.severity].text}`}
              >
                  {t(severityConfig[nextCase.severity].labelKey)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visit Modal */}
      <AnimatePresence>
        {showVisitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-cyan" />
                  <h3 className="text-lg font-bold">{t("create_visit")}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowVisitModal(false);
                    setVisitNotes("");
                  }}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-2 block">
                    Patient
                  </label>
                  <p className="text-sm font-semibold">
                    {cases[currentIdx]?.petName} ({cases[currentIdx]?.ownerName}
                    )
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="text-xs font-bold text-muted-foreground mb-2 block"
                  >
                    {t("visit_notes")}
                  </label>
                  <textarea
                    id="notes"
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder={t("enter_visit_notes")}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan/50"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowVisitModal(false);
                      setVisitNotes("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                  >
                    {t("cancel")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreateVisit}
                    disabled={createVisit.isPending}
                    className="flex-1 px-4 py-2 rounded-lg gradient-cyan-blue text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createVisit.isPending ? t("creating") : t("create_visit")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald" />
                  <h3 className="text-lg font-bold">{t("prescribe_medication")}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setSelectedDrugId("");
                    setDrugDose("");
                  }}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-2 block">
                    Patient
                  </label>
                  <p className="text-sm font-semibold">
                    {cases[currentIdx]?.petName} ({cases[currentIdx]?.ownerName}
                    )
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="drug"
                    className="text-xs font-bold text-muted-foreground mb-2 block"
                  >
                    {t("drug")}
                  </label>
                  <select
                    id="drug"
                    value={selectedDrugId}
                    onChange={(e) => setSelectedDrugId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  >
                    <option value="">{t("select_a_drug")}</option>
                    {(drugsData?.data || []).map((drug: Drug) => (
                      <option key={drug.drug_id} value={drug.drug_id}>
                        {drug.drugName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="dose"
                    className="text-xs font-bold text-muted-foreground mb-2 block"
                  >
                    {t("dosage")}
                  </label>
                  <input
                    id="dose"
                    type="text"
                    value={drugDose}
                    onChange={(e) => setDrugDose(e.target.value)}
                    placeholder={t("dosage_example")}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedDrugId("");
                      setDrugDose("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                  >
                    {t("cancel")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreatePrescription}
                    disabled={
                      createPrescriptionItem.isPending ||
                      createPrescription.isPending ||
                      !selectedDrugId ||
                      !drugDose
                    }
                    className="flex-1 px-4 py-2 rounded-lg gradient-emerald-cyan text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createPrescriptionItem.isPending ||
                    createPrescription.isPending
                      ? t("prescribing")
                      : t("prescribe")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
