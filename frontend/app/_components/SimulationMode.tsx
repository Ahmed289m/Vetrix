"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
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
  UserCheck,
  Inbox,
  ShieldCheck,
  ClipboardList,
  Pencil,
  Trash2,
  Plus,
  Zap,
  ShieldAlert,
  FlaskConical,
  Eye,
  BookOpen,
  Droplets,
  Scale,
  Bot,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { ChatAssistant } from "@/app/_components/ChatAssistant";
import { DrugDoseCalculatorModal } from "@/app/dashboard/_components/DrugDoseCalculatorModal";
import {
  useAppointments,
  useUpdateAppointment,
} from "@/app/_hooks/queries/use-appointments";
import { usePets, useUpdatePet } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import {
  useVisits,
  useCreateVisit,
  useUpdateVisit,
  useDeleteVisit,
} from "@/app/_hooks/queries/use-visits";
import { useCaseHistoryCrew } from "@/app/_hooks/queries/use-crew";
import {
  useCreatePrescription,
  usePrescriptions,
  useDeletePrescription,
} from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { useAuth } from "@/app/_hooks/useAuth";
import { CaseHistoryModal } from "@/app/dashboard/_components/CaseHistoryModal";
import { FluidTherapyModal } from "@/app/dashboard/_components/FluidTherapyModal";
import { useLang } from "@/app/_hooks/useLanguage";
import type {
  Appointment,
  Drug,
  Pet,
  Prescription,
  PrescriptionCreate,
  PrescriptionItem,
  User as UserModel,
  VisitCreate,
  Visit,
} from "@/app/_lib/types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatDose = (val: unknown): string => {
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

/** Parse leading numeric value from a dosage string like "10mg/kg q8-12h" */
const parseDosageNumber = (raw: unknown): number | null => {
  if (raw == null) return null;
  const str = String(raw).trim();
  const match = str.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

/** Get species key for dosage/toxicity objects.
 *  Drug form stores: dosage.dog / dosage.cat
 *  We match pet.type: "dog" | "cat" | "other" */
const speciesKey = (petType: string) =>
  petType === "dog" ? "dog" : petType === "cat" ? "cat" : null;

const getErrorDetail = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeErr = error as { response?: { data?: { detail?: string } } };
  return maybeErr.response?.data?.detail || fallback;
};

const getDrugDosageForSpecies = (
  drug: Drug | undefined,
  key: string | null,
): string | null => {
  if (!drug?.dose || !key) return null;
  const entry = (drug.dose as Record<string, unknown>)[key] as
    | { value?: number | null; unit?: string | null; frequency?: string | null }
    | null
    | undefined;
  if (!entry) return null;
  const parts: string[] = [];
  if (entry.value != null) parts.push(String(entry.value));
  if (entry.unit) parts.push(String(entry.unit));
  if (entry.frequency) parts.push(String(entry.frequency));
  const route = (drug.dose as { route?: string | null }).route;
  const label = parts.join(" ").trim();
  if (!label && !route) return null;
  return route ? `${label}${label ? " " : ""}(${route})` : label;
};

const getDrugToxicityForSpecies = (
  drug: Drug | undefined,
  key: string | null,
): string | null => {
  if (!drug?.toxicity || !key) return null;
  const entry = (drug.toxicity as Record<string, unknown>)[key] as
    | { severity?: string | null; notes?: string | null }
    | null
    | undefined;
  if (!entry) return null;
  return entry.notes ? String(entry.notes) : null;
};

const getDrugSeverityForSpecies = (
  drug: Drug | undefined,
  key: string | null,
): string | undefined => {
  if (!drug?.toxicity || !key) return undefined;
  const entry = (drug.toxicity as Record<string, unknown>)[key] as
    | { severity?: string | null }
    | null
    | undefined;
  return entry?.severity ? String(entry.severity) : undefined;
};

/** Map severity string to Tailwind color tokens */
const severityColor = (
  sev?: string,
): { bg: string; text: string; border: string; label: string } => {
  const s = (sev || "").toLowerCase();
  if (s === "high")
    return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      label: "High",
    };
  if (s === "medium")
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      label: "Medium",
    };
  if (s === "low")
    return {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      border: "border-yellow-500/20",
      label: "Low",
    };
  return {
    bg: "bg-emerald/10",
    text: "text-emerald",
    border: "border-emerald/20",
    label: "No Risk",
  };
};

type SimStatus = "confirmed" | "pending-doctor" | "in-progress" | "completed";
interface Props {
  role: "staff" | "doctor";
}

const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_PETS: Pet[] = [];
const EMPTY_USERS: UserModel[] = [];
const EMPTY_DRUGS: Drug[] = [];
const EMPTY_PRESCRIPTIONS: Prescription[] = [];
const EMPTY_PRESCRIPTION_ITEMS: PrescriptionItem[] = [];
const EMPTY_VISITS: Visit[] = [];

// ── Portal Modal — renders at document.body to escape overflow clipping ────────
function Modal({
  children,
  open,
  onBgClick,
}: {
  children: React.ReactNode;
  open: boolean;
  onBgClick?: () => void;
}) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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

// ── Toxicity badge ─────────────────────────────────────────────────────────────
function ToxicityBadge({ severity }: { severity?: string }) {
  const c = severityColor(severity);
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SimulationMode({ role }: Props) {
  // ── Session Rx tracking ──────────────────────────────────────────────────
  const [sessionRxIds, setSessionRxIds] = useState<Set<string>>(new Set());

  // ── Visit modal ──────────────────────────────────────────────────────────
  const [visitMode, setVisitMode] = useState<"create" | "edit">("create");
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [activeVisitApptId, setActiveVisitApptId] = useState("");
  const [editingVisitId, setEditingVisitId] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitPrescriptionIds, setVisitPrescriptionIds] = useState<string[]>(
    [],
  );

  // ── AI assistant panel ───────────────────────────────────────────────
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // ── Visit detail modal ───────────────────────────────────────────────────
  const [showVisitDetail, setShowVisitDetail] = useState(false);
  const [detailVisit, setDetailVisit] = useState<Visit | null>(null);

  // ── Case history modal ────────────────────────────────────────────────
  const [showCaseHistory, setShowCaseHistory] = useState(false);

  // ── Fluid therapy modal ───────────────────────────────────────────────
  const [showFluidTherapy, setShowFluidTherapy] = useState(false);

  // ── Dose calculator modal ────────────────────────────────────────────
  const [showDrugCalc, setShowDrugCalc] = useState(false);
  // Calculated doses keyed by drug_id — populated by onDosesCalculated callback
  const [calculatedDoses, setCalculatedDoses] = useState<
    Map<
      string,
      {
        totalMg: number;
        dose: number | null;
        doseUnit: string | null;
        concLabel: string;
        drugName: string;
        drugClass: string;
        frequency: string | null;
        route: string | null;
      }
    >
  >(new Map());

  // ── Update weight modal ───────────────────────────────────────────────
  const [showUpdateWeight, setShowUpdateWeight] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState("");

  // ── Prescription modal ───────────────────────────────────────────────────
  const [showPressModal, setShowPressModal] = useState(false);
  const [activePressApptId, setActivePressApptId] = useState("");
  // Multi-drug: array of selected drug IDs
  const [selectedDrugIds, setSelectedDrugIds] = useState<string[]>([]);
  // Drug search in prescription modal
  const [drugSearch, setDrugSearch] = useState("");

  const { t, lang } = useLang();
  const { user } = useAuth();
  const isClientRole = user?.role === "client";

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: apptData } = useAppointments();
  const { data: petsData } = usePets();
  // Guard: clients cannot call /users (403) — skip for client role
  const { data: usersData } = useUsers({ enabled: !isClientRole });
  const { data: drugsData } = useDrugs();
  const { data: presData } = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: visitsData } = useVisits();

  const updateAppointment = useUpdateAppointment();
  const updatePet = useUpdatePet();
  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();
  const caseHistoryCrew = useCaseHistoryCrew();
  const createPrescription = useCreatePrescription();
  const deletePrescription = useDeletePrescription();

  const allAppointments: Appointment[] = apptData?.data ?? EMPTY_APPOINTMENTS;
  const allPets: Pet[] = petsData?.data ?? EMPTY_PETS;
  const allUsers: UserModel[] = usersData?.data ?? EMPTY_USERS;
  const allDrugs: Drug[] = drugsData?.data ?? EMPTY_DRUGS;
  const allPrescriptions: Prescription[] =
    presData?.data ?? EMPTY_PRESCRIPTIONS;
  const allPresItems: PrescriptionItem[] =
    presItemsData?.data ?? EMPTY_PRESCRIPTION_ITEMS;
  const allVisits: Visit[] = visitsData?.data ?? EMPTY_VISITS;

  // ── Enriched appointments ────────────────────────────────────────────────
  const simAppointments = useMemo(() => {
    const relevant: SimStatus[] = [
      "confirmed",
      "pending-doctor",
      "in-progress",
    ];
    return allAppointments
      .filter((a) => relevant.includes(a.status as SimStatus))
      .sort((a, b) => {
        const dA = a.appointment_date
          ? new Date(a.appointment_date).getTime()
          : 0;
        const dB = b.appointment_date
          ? new Date(b.appointment_date).getTime()
          : 0;
        return dB - dA;
      })
      .map((a, idx) => {
        const pet = allPets.find((p) => p.pet_id === a.pet_id);
        const client = allUsers.find((u) => u.user_id === a.client_id);
        const doctor = a.doctor_id
          ? allUsers.find((u) => u.user_id === a.doctor_id)
          : null;
        return {
          ...a,
          caseNumber: `APT-${String(idx + 1).padStart(4, "0")}`,
          petName: pet?.name || t("unknown_pet"),
          petId: a.pet_id,
          petType: pet?.type || "other",
          clientId: a.client_id,
          species: (pet?.type || "dog") as "dog" | "cat" | "other",
          breed: pet?.breed || t("mixed"),
          ownerName: client?.fullname || t("unknown_owner"),
          complaint: a.reason || t("regular_checkup"),
          doctorName: doctor?.fullname || "",
          simStatus: a.status as SimStatus,
        };
      });
  }, [allAppointments, allPets, allUsers, t]);

  const myActiveCase = useMemo(
    () =>
      simAppointments.find(
        (a) => a.simStatus === "in-progress" && a.doctor_id === user?.userId,
      ),
    [simAppointments, user?.userId],
  );

  const pendingRequests = useMemo(
    () => simAppointments.filter((a) => a.simStatus === "pending-doctor"),
    [simAppointments],
  );

  // ── Drug helpers ─────────────────────────────────────────────────────────
  const getDrugForRx = (rxId: string): Drug | undefined => {
    const rx = allPrescriptions.find((p) => p.prescription_id === rxId);
    const item = allPresItems.find((pi) =>
      (rx?.prescriptionItem_ids || []).includes(pi.prescriptionItem_id),
    );
    const firstDrugId = item?.drug_ids?.[0];
    return allDrugs.find((d) => d.drug_id === firstDrugId);
  };

  /** Get ALL drug IDs for a prescription (multi-drug support) */
  const getAllDrugIdsForRx = (rxId: string): string[] => {
    const rx = allPrescriptions.find((p) => p.prescription_id === rxId);
    if (!rx) return [];
    const ids: string[] = [];
    for (const piId of rx.prescriptionItem_ids || []) {
      const pi = allPresItems.find((p) => p.prescriptionItem_id === piId);
      if (pi?.drug_ids) ids.push(...pi.drug_ids);
    }
    return ids;
  };

  /** Calculate auto-dose for a drug given pet weight and species */
  const calcAutoDose = (drug: Drug, petWeight: number, petType: string) => {
    const sKey = speciesKey(petType);
    if (!sKey || !drug.dose) return null;
    const entry = (drug.dose as Record<string, unknown>)[sKey] as
      | {
          value?: number | null;
          unit?: string | null;
          frequency?: string | null;
        }
      | null
      | undefined;
    if (!entry || entry.value == null) return null;
    const mgPerKg =
      typeof entry.value === "number"
        ? entry.value
        : parseFloat(String(entry.value));
    if (!Number.isFinite(mgPerKg) || mgPerKg <= 0 || petWeight <= 0)
      return null;
    const totalMg = Math.round(petWeight * mgPerKg * 100) / 100;
    const labelParts: string[] = [String(entry.value)];
    if (entry.unit) labelParts.push(String(entry.unit));
    if (entry.frequency) labelParts.push(String(entry.frequency));
    return { mgPerKg, totalMg, rawDosage: labelParts.join(" ").trim() };
  };

  const getCasePrescriptions = (petId: string, clientId: string) =>
    allPrescriptions.filter(
      (rx) => rx.pet_id === petId && rx.client_id === clientId,
    );

  const getVisitPrescriptionIds = (visit: Visit): string[] => {
    const fromList = Array.isArray(visit.prescription_ids)
      ? visit.prescription_ids.filter(Boolean)
      : [];
    if (fromList.length > 0) return [...new Set(fromList)];
    return visit.prescription_id ? [visit.prescription_id] : [];
  };

  const getAppointmentReasonForVisit = (visit: Visit): string | null => {
    const candidates = allAppointments.filter(
      (appt) =>
        appt.pet_id === visit.pet_id && appt.client_id === visit.client_id,
    );
    if (!candidates.length) return null;

    const visitTs = new Date(visit.date).getTime();
    if (!Number.isFinite(visitTs)) {
      return candidates[0]?.reason?.trim() || null;
    }

    const closest = [...candidates].sort((a, b) => {
      const aTs = a.appointment_date
        ? new Date(a.appointment_date).getTime()
        : 0;
      const bTs = b.appointment_date
        ? new Date(b.appointment_date).getTime()
        : 0;
      return Math.abs(aTs - visitTs) - Math.abs(bTs - visitTs);
    })[0];

    return closest?.reason?.trim() || null;
  };

  const getUnlinkedCasePrescriptions = (petId: string, clientId: string) => {
    const linked = new Set(
      allVisits.flatMap((visit) => getVisitPrescriptionIds(visit)),
    );
    return getCasePrescriptions(petId, clientId).filter(
      (rx) => !linked.has(rx.prescription_id),
    );
  };

  const getAutoLinkedPrescriptionIds = (
    petId: string,
    clientId: string,
  ): string[] => {
    const unlinked = getUnlinkedCasePrescriptions(petId, clientId);
    if (!unlinked.length) return [];
    const unlinkedIds = new Set(unlinked.map((rx) => rx.prescription_id));
    const sessionOrder = Array.from(sessionRxIds);
    for (let i = sessionOrder.length - 1; i >= 0; i--) {
      const rxId = sessionOrder[i];
      if (unlinkedIds.has(rxId)) {
        return [rxId];
      }
    }
    return unlinked[0]?.prescription_id ? [unlinked[0].prescription_id] : [];
  };

  // ── Session Rx list ───────────────────────────────────────────────────────
  const sessionCasePrescriptions = useMemo(
    () => allPrescriptions.filter((rx) => sessionRxIds.has(rx.prescription_id)),
    [allPrescriptions, sessionRxIds],
  );

  // ── Selected drugs for prescription modal ─────────────────────────────────
  const selectedDrugs: Drug[] = selectedDrugIds
    .map((id) => allDrugs.find((d) => d.drug_id === id))
    .filter(Boolean) as Drug[];

  // ── Drug interaction detection (by ID, name, or class) ──────────────────
  const drugInteractsWith = (a: Drug, b: Drug): boolean => {
    const refs = a.interactions || [];
    if (!refs.length) return false;
    const bNameLow = b.name.toLowerCase();
    const bClassLow = (b.class || "").toLowerCase();
    return refs.some((ref) => {
      const refLow = ref.toLowerCase();
      return (
        ref === b.drug_id ||
        refLow === bNameLow ||
        (bClassLow && refLow === bClassLow)
      );
    });
  };

  const interactions = useMemo(() => {
    const pairs: { a: string; b: string }[] = [];
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const a = selectedDrugs[i];
        const b = selectedDrugs[j];
        if (drugInteractsWith(a, b) || drugInteractsWith(b, a))
          pairs.push({ a: a.name, b: b.name });
      }
    }
    return pairs;
  }, [selectedDrugs]);

  const showNoInteractionNotice =
    selectedDrugIds.length > 1 && interactions.length === 0;

  const interactingDrugIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const a = selectedDrugs[i];
        const b = selectedDrugs[j];
        if (drugInteractsWith(a, b) || drugInteractsWith(b, a)) {
          ids.add(a.drug_id);
          ids.add(b.drug_id);
        }
      }
    }
    return ids;
  }, [selectedDrugs]);

  // ── Lookup helpers ────────────────────────────────────────────────────────
  const visitAppt = simAppointments.find(
    (a) => a.appointment_id === activeVisitApptId,
  );
  const pressAppt = simAppointments.find(
    (a) => a.appointment_id === activePressApptId,
  );

  // Pet for the prescription modal (to show species-specific dosage/toxicity)
  const pressPet = pressAppt
    ? (allPets.find((p) => p.pet_id === pressAppt.petId) ?? null)
    : null;

  // ── Staff actions ─────────────────────────────────────────────────────────
  const handleStart = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "pending-doctor" } },
      {
        onSuccess: () =>
          toast.info("Case dispatched — waiting for a doctor to accept"),
        onError: () => toast.error("Failed to start case"),
      },
    );
  };

  // ── Doctor actions ────────────────────────────────────────────────────────
  const handleAccept = (apptId: string) => {
    if (!user?.userId) return;
    if (myActiveCase) {
      toast.error("Complete your current case before accepting another.");
      return;
    }
    updateAppointment.mutate(
      { id: apptId, data: { status: "in-progress", doctor_id: user.userId } },
      {
        onSuccess: () => {
          setSessionRxIds(new Set());
          setCalculatedDoses(new Map());
          toast.success("Case accepted — you are the assigned doctor");
        },
        onError: () => toast.error("Failed to accept case"),
      },
    );
  };

  const handleComplete = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "completed" } },
      {
        onSuccess: () => {
          setSessionRxIds(new Set());
          setCalculatedDoses(new Map());
          toast.success("Case completed");
        },
        onError: () => toast.error("Failed to complete case"),
      },
    );
  };

  const openCaseHistory = () => {
    if (!myActiveCase?.petId) {
      toast.error("No active patient selected.");
      return;
    }

    caseHistoryCrew.reset();
    setShowCaseHistory(true);
    caseHistoryCrew.mutate(
      { petId: myActiveCase.petId, petType: myActiveCase.petType, lang },
      {
        onError: (err: unknown) =>
          toast.error(getErrorDetail(err, "Failed to load case history.")),
      },
    );
  };

  // ── Visit modal ───────────────────────────────────────────────────────────
  const openCreateVisit = (apptId: string, petId: string, clientId: string) => {
    setVisitMode("create");
    setActiveVisitApptId(apptId);
    setEditingVisitId("");
    setVisitPrescriptionIds(getAutoLinkedPrescriptionIds(petId, clientId));
    setVisitNotes("");
    setShowVisitModal(true);
  };

  const handleDeleteVisit = (visitId: string) => {
    if (!confirm("Delete this visit?")) return;
    deleteVisit.mutate(visitId, {
      onSuccess: () => {
        toast.success("Visit deleted.");
        setShowVisitDetail(false);
      },
      onError: (err: unknown) =>
        toast.error(getErrorDetail(err, "Failed to delete visit.")),
    });
  };

  const openEditVisit = (visit: Visit) => {
    setVisitMode("edit");
    setEditingVisitId(visit.visit_id);
    setActiveVisitApptId("");
    setVisitNotes(visit.notes || "");
    setVisitPrescriptionIds(getVisitPrescriptionIds(visit));
    setShowVisitModal(true);
  };

  const handleSaveVisit = () => {
    if (visitMode === "create") {
      const appt = simAppointments.find(
        (a) => a.appointment_id === activeVisitApptId,
      );
      if (!appt) return;
      const casePrescriptions = getCasePrescriptions(appt.petId, appt.clientId);
      const linkedRxIds = visitPrescriptionIds;

      // Block when any selected prescription has no calculated doses yet.
      if (linkedRxIds.length > 0 && casePrescriptions.length > 0) {
        const hasUncalculatedSelection = linkedRxIds.some((rxId) => {
          const rxDrugIds = getAllDrugIdsForRx(rxId);
          return (
            rxDrugIds.length > 0 &&
            rxDrugIds.every(
              (id) => (calculatedDoses.get(id)?.totalMg ?? 0) === 0,
            )
          );
        });
        if (hasUncalculatedSelection) {
          toast.error(
            "Please open the Dose Calculator first to calculate doses.",
            { duration: 5000 },
          );
          return;
        }
      }
    }

    if (visitMode === "edit") {
      updateVisit.mutate(
        {
          id: editingVisitId,
          data: {
            notes: visitNotes,
            prescription_ids: visitPrescriptionIds,
          },
        },
        {
          onSuccess: () => {
            toast.success("Visit updated.");
            setShowVisitModal(false);
          },
          onError: (err: unknown) =>
            toast.error(getErrorDetail(err, "Failed to update visit.")),
        },
      );
    } else {
      const appt = simAppointments.find(
        (a) => a.appointment_id === activeVisitApptId,
      );
      if (!appt || !user) return;
      const payload: VisitCreate = {
        pet_id: appt.petId,
        client_id: appt.clientId,
        doctor_id: appt.doctor_id || user.userId,
        notes: visitNotes || "Visit created from simulation mode",
        date: new Date().toISOString(),
        ...(visitPrescriptionIds.length > 0 && {
          prescription_ids: visitPrescriptionIds,
        }),
      };
      createVisit.mutate(payload, {
        onSuccess: () => {
          toast.success("Visit recorded.");
          setShowVisitModal(false);
        },
        onError: (err: unknown) =>
          toast.error(getErrorDetail(err, "Failed to record visit.")),
      });
    }
  };

  // ── Prescription modal ────────────────────────────────────────────────────
  const openCreatePrescription = (apptId: string) => {
    setActivePressApptId(apptId);
    setSelectedDrugIds([]); // clear previous selection
    setDrugSearch(""); // clear search
    setShowPressModal(true);
  };

  const handleDeletePrescription = (rxId: string) => {
    if (!confirm("Delete this prescription?")) return;
    deletePrescription.mutate(rxId, {
      onSuccess: () => {
        setSessionRxIds((prev) => {
          const next = new Set(prev);
          next.delete(rxId);
          return next;
        });
        toast.success("Prescription deleted.");
      },
      onError: () => toast.error("Failed to delete prescription."),
    });
  };

  const handleSavePrescriptions = () => {
    const appt = simAppointments.find(
      (a) => a.appointment_id === activePressApptId,
    );
    if (!appt) return;
    if (selectedDrugIds.length === 0) {
      toast.warning("Select at least one drug");
      return;
    }

    // ── Create A SINGLE prescription with all selected drugs ──
    createPrescription.mutate(
      {
        client_id: appt.clientId,
        pet_id: appt.petId,
        item_drug_ids: [selectedDrugIds],
      } satisfies PrescriptionCreate,
      {
        onSuccess: (res: unknown) => {
          const maybeResponse = res as { data?: { prescription_id?: string } };
          const rxId = maybeResponse?.data?.prescription_id;
          if (rxId) {
            setSessionRxIds((prev) => new Set([...prev, rxId]));
            toast.success(
              `Prescription issued with ${selectedDrugIds.length} drug${selectedDrugIds.length > 1 ? "s" : ""}.`,
            );

            // Auto-open visit creation modal pre-linked to the single prescription
            setShowPressModal(false);
            setSelectedDrugIds([]);
            setDrugSearch("");
            setVisitMode("create");
            setActiveVisitApptId(activePressApptId);
            setEditingVisitId("");
            setVisitNotes("");
            setVisitPrescriptionIds([rxId]);
            setShowVisitModal(true);
          }
        },
        onError: () => {
          toast.error("Failed to create prescription.");
          setShowPressModal(false);
        },
      },
    );
  };

  const handleSaveWeight = (activePet?: Pet) => {
    const w = parseFloat(newWeightInput);

    if (!activePet) {
      toast.error("No active patient selected.");
      return;
    }

    if (Number.isNaN(w) || w <= 0) {
      toast.error("Enter a valid weight greater than 0.");
      return;
    }

    updatePet.mutate(
      { id: activePet.pet_id, data: { weight: w } },
      {
        onSuccess: () => {
          toast.success(`Weight updated to ${w} kg`);
          setShowUpdateWeight(false);
        },
        onError: (err: unknown) =>
          toast.error(getErrorDetail(err, "Failed to update weight.")),
      },
    );
  };

  const toggleDrug = (drugId: string) => {
    setSelectedDrugIds((prev) =>
      prev.includes(drugId)
        ? prev.filter((id) => id !== drugId)
        : [...prev, drugId],
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={myActiveCase ? { rotate: 360 } : {}}
          transition={{
            repeat: myActiveCase ? Infinity : 0,
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
            {role === "staff"
              ? t("staff_controls_short")
              : t("doctor_view_short")}
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
                  a.simStatus === "confirmed"
                    ? "border-muted/40 bg-muted/5"
                    : a.simStatus === "pending-doctor"
                      ? "border-orange/30 bg-orange/5"
                      : "border-cyan/30 bg-cyan/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {a.species === "dog" ? (
                        <Dog className="w-5 h-5" />
                      ) : a.species === "cat" ? (
                        <Cat className="w-5 h-5" />
                      ) : (
                        <FlaskConical className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.petName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.ownerName} · {a.complaint}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {a.caseNumber}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase whitespace-nowrap ${
                      a.simStatus === "confirmed"
                        ? "bg-muted/30 text-muted-foreground"
                        : a.simStatus === "pending-doctor"
                          ? "bg-orange/15 text-orange"
                          : "bg-cyan/15 text-cyan"
                    }`}
                  >
                    {a.simStatus === "confirmed"
                      ? t("waiting")
                      : a.simStatus === "pending-doctor"
                        ? "Awaiting Doctor"
                        : t("in_progress")}
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
                    <span className="font-semibold">
                      Waiting for an available doctor…
                    </span>
                  </div>
                )}
                {a.simStatus === "confirmed" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
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
            <>
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
                      {myActiveCase.species === "dog" ? (
                        <Dog className="w-6 h-6" />
                      ) : myActiveCase.species === "cat" ? (
                        <Cat className="w-6 h-6" />
                      ) : (
                        <FlaskConical className="w-6 h-6" />
                      )}
                    </motion.div>
                    <div>
                      <p className="text-lg font-extrabold">
                        {myActiveCase.petName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {myActiveCase.breed} · {myActiveCase.ownerName}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {myActiveCase.caseNumber}
                      </p>
                    </div>
                  </div>
                  {myActiveCase.appointment_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {fmtDate(myActiveCase.appointment_date)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground/80">
                  {myActiveCase.complaint}
                </p>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="font-bold">
                    Assigned to you · Dr. {user?.fullname}
                  </span>
                </div>

                {/* Session prescriptions */}
                {(() => {
                  const rxs = sessionCasePrescriptions;
                  if (!rxs.length)
                    return (
                      <div className="text-xs text-muted-foreground/60 italic px-1">
                        No prescriptions issued this session yet.
                      </div>
                    );
                  return (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Session prescriptions
                      </p>
                      {rxs.map((rx) => {
                        const drug = getDrugForRx(rx.prescription_id);
                        const sKey = speciesKey(myActiveCase.petType);
                        const sev = getDrugSeverityForSpecies(drug, sKey);
                        const activePetForDose = allPets.find(
                          (p) => p.pet_id === myActiveCase.petId,
                        );
                        const autoDose =
                          drug && activePetForDose
                            ? calcAutoDose(
                                drug,
                                activePetForDose.weight,
                                myActiveCase.petType,
                              )
                            : null;
                        return (
                          <div
                            key={rx.prescription_id}
                            className="px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs group space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              <Pill className="w-3.5 h-3.5 text-emerald shrink-0" />
                              <span className="font-bold text-emerald flex-1 truncate">
                                {drug?.name || "Drug"}
                              </span>
                              {sev && <ToxicityBadge severity={sev} />}
                              <button
                                onClick={() => {
                                  setDetailVisit(null);
                                  setShowVisitDetail(false);
                                }}
                                className="sr-only"
                              />
                              <button
                                onClick={() =>
                                  handleDeletePrescription(rx.prescription_id)
                                }
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                            {autoDose && (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-5">
                                <Calculator className="w-3 h-3 text-cyan shrink-0" />
                                <span>
                                  <span className="font-bold text-cyan">
                                    {autoDose.mgPerKg} mg/kg
                                  </span>
                                  <span className="mx-1">×</span>
                                  <span className="font-bold">
                                    {activePetForDose?.weight} kg
                                  </span>
                                  <span className="mx-1">=</span>
                                  <span className="font-black text-emerald">
                                    {autoDose.totalMg} mg
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Doctor action buttons */}
                {(() => {
                  const activePet = allPets.find(
                    (p) => p.pet_id === myActiveCase.petId,
                  );
                  return (
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      {/* Update Weight */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setNewWeightInput(String(activePet?.weight ?? ""));
                          setShowUpdateWeight(true);
                        }}
                        className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-amber-500/20 transition-colors"
                      >
                        <Scale className="w-4 h-4" />
                        Update Weight
                      </motion.button>

                      {/* Create Visit */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          openCreateVisit(
                            myActiveCase.appointment_id,
                            myActiveCase.petId,
                            myActiveCase.clientId,
                          )
                        }
                        className="flex items-center gap-2 gradient-cyan-blue text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold glow-cyan"
                      >
                        <Plus className="w-4 h-4" />
                        {t("create_visit")}
                      </motion.button>

                      {/* Prescribe */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          openCreatePrescription(myActiveCase.appointment_id)
                        }
                        className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold glow-emerald"
                      >
                        <Plus className="w-4 h-4" />
                        {t("prescribe")}
                      </motion.button>

                      {/* Fluid Therapy */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowFluidTherapy(true)}
                        className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-blue-500/20 transition-colors"
                      >
                        <Droplets className="w-4 h-4" />
                        Fluid Therapy
                      </motion.button>

                      {/* Dose Calculator */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowDrugCalc(true)}
                        className="flex items-center gap-2 bg-emerald/10 hover:bg-emerald/20 text-emerald px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald/20 transition-colors"
                      >
                        <Calculator className="w-4 h-4" />
                        Dose Calculator
                      </motion.button>

                      {/* Case History */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={openCaseHistory}
                        className="flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-violet-500/20 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        {t("case_history") || "Case History"}
                      </motion.button>

                      {/* Ask AI */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAiAssistant((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                          showAiAssistant
                            ? "bg-emerald/15 text-emerald border-emerald/30"
                            : "bg-muted/30 text-muted-foreground hover:bg-emerald/10 hover:text-emerald border-border/50"
                        }`}
                      >
                        <Bot className="w-4 h-4" />
                        Ask AI
                      </motion.button>

                      {/* Complete */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          handleComplete(myActiveCase.appointment_id)
                        }
                        disabled={updateAppointment.isPending}
                        className="flex items-center gap-2 bg-emerald/90 hover:bg-emerald text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t("complete")}
                      </motion.button>
                    </div>
                  );
                })()}
              </motion.div>

              {/* AI Assistant Modal — portal to body, unrestricted by simulation box */}
              <Modal
                open={showAiAssistant}
                onBgClick={() => setShowAiAssistant(false)}
              >
                <motion.div
                  key="ai-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="relative w-full max-w-2xl h-[80vh] rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/30 shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
                >
                  {/* Ambient glow */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute -top-20 left-1/4 w-72 h-72 bg-emerald/[0.06] rounded-full blur-[100px]" />
                    <div className="absolute -bottom-16 right-1/3 w-60 h-60 bg-cyan/[0.04] rounded-full blur-[80px]" />
                  </div>
                  {/* Gradient top edge */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />

                  {/* Modal header */}
                  <div className="shrink-0 relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/30 to-cyan/20 rounded-xl blur-sm" />
                        <div className="relative w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center shadow-md shadow-emerald/15">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold gradient-text">
                            Vetrix AI
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald/8 border border-emerald/15 text-[8px] font-bold text-emerald/70 uppercase tracking-wider">
                            Simulation
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50">
                          Differential diagnoses
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiAssistant(false)}
                      className="p-2 rounded-xl hover:bg-muted/30 transition-all duration-200 text-muted-foreground/30 hover:text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Chat fills remaining height */}
                  <div className="flex-1 min-h-0 relative z-10">
                    <ChatAssistant role="doctor" context="simulation_mode" />
                  </div>
                </motion.div>
              </Modal>
            </>
          )}

          {/* ── Pending requests ── */}
          {!myActiveCase && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange" />
                <span className="text-sm font-bold">Pending Case Requests</span>
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
                    No pending cases yet
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Staff will dispatch cases here
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
                          {a.species === "dog" ? (
                            <Dog className="w-5 h-5" />
                          ) : a.species === "cat" ? (
                            <Cat className="w-5 h-5" />
                          ) : (
                            <FlaskConical className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{a.petName}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.ownerName}
                          </p>
                          <p className="text-xs text-foreground/70 mt-0.5">
                            {a.complaint}
                          </p>
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
                        <span className="font-mono opacity-60 ml-1">
                          {a.caseNumber}
                        </span>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(a.appointment_id)}
                      disabled={updateAppointment.isPending}
                      className="flex items-center justify-center gap-2 gradient-cyan-blue text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold w-full disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" /> Accept This Case
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {myActiveCase && pendingRequests.length > 0 && (
            <div className="p-3 rounded-xl border border-border/30 bg-muted/5 border-dashed">
              <p className="text-xs text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 inline mr-1" />
                {pendingRequests.length} more case
                {pendingRequests.length > 1 ? "s" : ""} waiting. Complete
                current case to accept next.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ VISIT CREATE/EDIT MODAL ════════════════════════ */}
      <Modal open={showVisitModal} onBgClick={() => setShowVisitModal(false)}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="bg-card border border-border/50 rounded-2xl max-w-lg w-full shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="sticky top-0 z-10 border-b border-border/30 bg-card/95 backdrop-blur-xl px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan/30 to-emerald/20 rounded-xl blur-sm" />
                  <div className="relative w-9 h-9 rounded-xl gradient-cyan-blue flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {visitMode === "edit" ? "Edit Visit" : t("create_visit")}
                  </h3>
                  {visitMode === "create" && visitAppt && (
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      {visitAppt.caseNumber}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowVisitModal(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Patient + Doctor + Date strip */}
            {visitMode === "create" && visitAppt && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-tint/5 border border-tint/5">
                <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  {visitAppt.species === "dog" ? (
                    <Dog className="w-5 h-5" />
                  ) : visitAppt.species === "cat" ? (
                    <Cat className="w-5 h-5" />
                  ) : (
                    <FlaskConical className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {visitAppt.petName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {visitAppt.ownerName} · {visitAppt.complaint}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[10px]">
                  <p className="font-bold text-cyan">
                    Dr. {user?.fullname?.split(" ")[0] || "—"}
                  </p>
                  <p className="text-muted-foreground/60">
                    {fmtDate(new Date().toISOString())}
                  </p>
                </div>
              </div>
            )}

            {/* ── No prescription warning ── */}
            {visitMode === "create" &&
              visitAppt &&
              (() => {
                const hasPrescriptions =
                  getCasePrescriptions(visitAppt.petId, visitAppt.clientId)
                    .length > 0;
                if (hasPrescriptions) return null;
                return (
                  <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">No prescription issued yet</p>
                      <p className="opacity-80 mt-0.5">
                        Consider prescribing before recording this visit.
                        Proceed only if this is a non-pharmacological visit.
                      </p>
                    </div>
                  </div>
                );
              })()}

            {/* ── Link prescription dropdown ── */}
            {visitMode === "create" &&
              visitAppt &&
              (() => {
                const unlinked = getUnlinkedCasePrescriptions(
                  visitAppt.petId,
                  visitAppt.clientId,
                );
                if (!unlinked.length) return null;
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" /> Link Prescription(s)
                      (this case)
                    </label>
                    <div className="space-y-2 rounded-xl bg-muted/20 border border-border p-2.5">
                      {unlinked.map((rx) => {
                        const drug = getDrugForRx(rx.prescription_id);
                        const selected = visitPrescriptionIds.includes(
                          rx.prescription_id,
                        );
                        return (
                          <label
                            key={rx.prescription_id}
                            className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 py-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [
                                      ...visitPrescriptionIds,
                                      rx.prescription_id,
                                    ]
                                  : visitPrescriptionIds.filter(
                                      (id) => id !== rx.prescription_id,
                                    );
                                setVisitPrescriptionIds([...new Set(next)]);
                              }}
                              className="h-4 w-4 accent-emerald"
                            />
                            <span className="text-sm font-semibold">
                              {drug?.name || "Drug"} · RX-
                              {rx.prescription_id.slice(0, 6)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            {/* ── Calculated doses panel ── */}
            {visitMode === "create" &&
              visitPrescriptionIds.length > 0 &&
              (() => {
                const rxDrugIds = [
                  ...new Set(
                    visitPrescriptionIds.flatMap((id) =>
                      getAllDrugIdsForRx(id),
                    ),
                  ),
                ];
                const calced = rxDrugIds
                  .map((id) => calculatedDoses.get(id))
                  .filter(Boolean) as Array<{
                  totalMg: number;
                  dose: number | null;
                  doseUnit: string | null;
                  concLabel: string;
                  drugName: string;
                  drugClass: string;
                  frequency: string | null;
                  route: string | null;
                }>;
                const uncalced = rxDrugIds
                  .filter((id) => (calculatedDoses.get(id)?.totalMg ?? 0) === 0)
                  .map(
                    (id) => allDrugs.find((d) => d.drug_id === id)?.name || id,
                  );
                return (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1.5">
                      <Calculator className="w-3 h-3" /> Calculated Doses
                    </p>
                    {calced.length > 0 && (
                      <div className="space-y-2">
                        {calced.map((cd, i) => (
                          <div
                            key={i}
                            className="rounded-xl bg-emerald/5 border border-emerald/15 overflow-hidden"
                          >
                            {/* Drug header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-emerald/10">
                              <div className="flex items-center gap-2 min-w-0">
                                <Pill className="w-3 h-3 text-emerald shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-black text-xs text-emerald truncate block">
                                    {cd.drugName}
                                  </span>
                                  {cd.drugClass && (
                                    <span className="text-[9px] text-muted-foreground/60">
                                      {cd.drugClass}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-black tabular-nums text-xs shrink-0">
                                <span className="text-cyan">
                                  {cd.totalMg} mg
                                </span>
                                {cd.dose != null && cd.doseUnit && (
                                  <>
                                    <span className="text-muted-foreground/40">
                                      →
                                    </span>
                                    <span className="text-emerald">
                                      {cd.dose} {cd.doseUnit}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Drug details */}
                            <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-muted-foreground">
                              {cd.frequency && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span className="font-bold">
                                    {cd.frequency}
                                  </span>
                                </span>
                              )}
                              {cd.route && (
                                <span className="px-1.5 py-0.5 rounded-md bg-cyan/10 border border-cyan/15 text-cyan font-bold text-[9px]">
                                  {cd.route}
                                </span>
                              )}
                              {cd.concLabel && (
                                <span className="opacity-60">
                                  {cd.concLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {uncalced.length > 0 && (
                      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-black">
                            Not yet calculated: {uncalced.join(", ")}
                          </p>
                          <p className="opacity-70 mt-0.5">
                            Open the Dose Calculator and enter patient weight to
                            calculate.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowVisitModal(false);
                            setShowDrugCalc(true);
                          }}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[10px] transition-colors"
                        >
                          Open Calc
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* ── Clinical Notes ── */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Clinical Notes
              </label>
              <textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Symptoms, diagnosis, treatment notes…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan/50 resize-none"
                rows={4}
              />
            </div>

            {/* ── Action buttons ── */}
            {(() => {
              // Blocked only when prescription is linked AND none of its drugs have totalMg > 0
              const hasUncalculated = visitPrescriptionIds.some((rxId) => {
                const rxDrugIds = getAllDrugIdsForRx(rxId);
                return (
                  rxDrugIds.length > 0 &&
                  rxDrugIds.every(
                    (id) => (calculatedDoses.get(id)?.totalMg ?? 0) === 0,
                  )
                );
              });
              const isBlocked =
                visitMode === "create" &&
                visitPrescriptionIds.length > 0 &&
                hasUncalculated;
              return (
                <div className="flex gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowVisitModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                  >
                    {t("cancel")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isBlocked ? 1 : 1.02 }}
                    whileTap={{ scale: isBlocked ? 1 : 0.97 }}
                    onClick={handleSaveVisit}
                    disabled={
                      createVisit.isPending ||
                      updateVisit.isPending ||
                      isBlocked
                    }
                    title={
                      isBlocked
                        ? "Calculate all drug doses first using the Dose Calculator"
                        : undefined
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isBlocked ? "bg-muted/30 text-muted-foreground cursor-not-allowed" : "gradient-cyan-blue text-primary-foreground disabled:opacity-50"}`}
                  >
                    {createVisit.isPending || updateVisit.isPending
                      ? "Saving…"
                      : isBlocked
                        ? "⚠ Calculate Doses First"
                        : visitMode === "edit"
                          ? "Save Changes"
                          : t("create_visit")}
                  </motion.button>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </Modal>

      {/* ═══════════════════ VISIT DETAIL MODAL ═════════════════════════════ */}
      <Modal open={showVisitDetail} onBgClick={() => setShowVisitDetail(false)}>
        {detailVisit &&
          (() => {
            const pet = allPets.find((p) => p.pet_id === detailVisit.pet_id);
            const doctor = allUsers.find(
              (u) => u.user_id === detailVisit.doctor_id,
            );
            const client = allUsers.find(
              (u) => u.user_id === detailVisit.client_id,
            );
            const doctorName =
              detailVisit.doctor_name || doctor?.fullname || "Unknown";
            const sKey = pet ? speciesKey(pet.type) : null;
            const appointmentReason = getAppointmentReasonForVisit(detailVisit);
            // Gather all drugs for this visit's linked prescription(s)
            const linkedRxIds = getVisitPrescriptionIds(detailVisit);
            const rxDrugIds = [
              ...new Set(linkedRxIds.flatMap((id) => getAllDrugIdsForRx(id))),
            ];
            const rxDrugs = rxDrugIds
              .map((id) => allDrugs.find((d) => d.drug_id === id))
              .filter(Boolean) as Drug[];
            return (
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-cyan-blue flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Visit Details</h3>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {detailVisit.visit_id.slice(0, 14)}…
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVisitDetail(false)}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pet + owner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-tint/5 border border-tint/5">
                  <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    {pet?.type === "dog" ? (
                      <Dog className="w-5 h-5" />
                    ) : pet?.type === "cat" ? (
                      <Cat className="w-5 h-5" />
                    ) : (
                      <FlaskConical className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{pet?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {pet?.breed} · {pet?.type}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="font-semibold">{client?.fullname || "—"}</p>
                    <p className="opacity-60">Owner</p>
                  </div>
                </div>

                {/* Doctor + Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-cyan/5 border border-cyan/15">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Attending Doctor
                    </p>
                    <p className="text-sm font-bold text-cyan">
                      Dr. {doctorName}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-tint/5 border border-tint/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Visit Date
                    </p>
                    <p className="text-sm font-bold">
                      {fmtDateTime(detailVisit.date)}
                    </p>
                  </div>
                </div>

                {/* Reason + Notes */}
                <div className="p-3 rounded-xl bg-tint/5 border border-tint/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <ClipboardList className="w-3 h-3" /> Appointment Reason
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {appointmentReason || "Not recorded"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-tint/5 border border-tint/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Doctor Notes
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {detailVisit.notes || "No notes recorded"}
                  </p>
                </div>

                {/* Prescription drugs */}
                {rxDrugs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1.5">
                      <Pill className="w-3 h-3" /> Prescribed Medication
                      <span className="ml-auto text-muted-foreground/60 font-bold normal-case text-[9px]">
                        {rxDrugs.length} drug{rxDrugs.length > 1 ? "s" : ""}
                      </span>
                    </p>
                    <div className="space-y-2">
                      {rxDrugs.map((d) => {
                        const sp = sKey ?? "dog";
                        const rawDose = d.dose
                          ? ((d.dose as Record<string, unknown>)[sp] as
                              | {
                                  value?: number | null;
                                  unit?: string | null;
                                  frequency?: string | null;
                                }
                              | null
                              | undefined)
                          : null;
                        const dosageEntry =
                          rawDose ??
                          (d.dose
                            ? ((d.dose as Record<string, unknown>)[
                                sp === "dog" ? "cat" : "dog"
                              ] as
                                | {
                                    value?: number | null;
                                    unit?: string | null;
                                    frequency?: string | null;
                                  }
                                | null
                                | undefined)
                            : null);
                        const sev = getDrugSeverityForSpecies(d, sKey);
                        const cl = severityColor(sev);
                        const calced = calculatedDoses.get(d.drug_id);
                        // Frequency: prefer calculated (from dose calc confirm), fall back to drug model
                        const freq =
                          calced?.frequency || dosageEntry?.frequency || null;
                        // Route: prefer calculated, fall back to drug model
                        const routeStr =
                          calced?.route ||
                          (typeof d.dose?.route === "string"
                            ? d.dose.route
                            : null);
                        return (
                          <div
                            key={d.drug_id}
                            className="rounded-xl bg-emerald/5 border border-emerald/15 overflow-hidden"
                          >
                            {/* Drug header — name, class, toxicity badge */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald/10">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Pill className="w-3.5 h-3.5 text-emerald shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-black text-sm text-emerald truncate block">
                                    {d.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {d.class}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {sev && <ToxicityBadge severity={sev} />}
                              </div>
                            </div>

                            {/* Detail grid */}
                            <div className="px-4 py-3 space-y-2.5">
                              {/* Calculated dose */}
                              {calced ? (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                    <Calculator className="w-3 h-3 text-emerald" />{" "}
                                    Calculated Dose
                                  </span>
                                  <div className="flex items-center gap-1.5 tabular-nums font-black">
                                    <span className="text-cyan">
                                      {calced.totalMg} mg
                                    </span>
                                    {calced.dose != null && calced.doseUnit && (
                                      <>
                                        <span className="text-muted-foreground/40">
                                          →
                                        </span>
                                        <span className="text-emerald">
                                          {calced.dose} {calced.doseUnit}
                                        </span>
                                      </>
                                    )}
                                    {calced.concLabel && (
                                      <span className="text-muted-foreground/50 font-normal text-[10px]">
                                        ({calced.concLabel})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 italic">
                                  <Calculator className="w-3 h-3" /> No
                                  calculated dose recorded
                                </div>
                              )}

                              {/* Frequency + Route row */}
                              {(freq || routeStr) && (
                                <div className="flex items-center gap-3 text-xs">
                                  {freq && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-cyan" />
                                      <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                        Frequency
                                      </span>
                                      <span className="font-bold text-cyan">
                                        {freq}
                                      </span>
                                    </div>
                                  )}
                                  {routeStr && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                        Route (how it is given)
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded-md bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-bold">
                                        {routeStr}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Species dosage reference */}
                              {dosageEntry && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                    {pet?.type ?? "Species"} Dosage
                                  </span>
                                  <span className="font-bold text-cyan tabular-nums">
                                    {dosageEntry.value} {dosageEntry.unit}
                                    {dosageEntry.frequency && (
                                      <span className="ml-1 text-muted-foreground font-normal">
                                        · {dosageEntry.frequency}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Toxicity note */}
                              {(() => {
                                const tox = getDrugToxicityForSpecies(d, sKey);
                                if (!tox) return null;
                                return (
                                  <div
                                    className={`mt-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold ${cl.bg} ${cl.border} ${cl.text}`}
                                  >
                                    ⚠ {formatDose(tox)}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Edit button */}
                <div className="flex gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowVisitDetail(false);
                      openEditVisit(detailVisit);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-cyan-blue text-primary-foreground text-sm font-bold"
                  >
                    <Pencil className="w-4 h-4" /> Edit Visit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDeleteVisit(detailVisit.visit_id)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowVisitDetail(false)}
                    className="px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}
      </Modal>

      {/* ═══════════════════ MULTI-DRUG PRESCRIPTION MODAL ══════════════════ */}
      <Modal open={showPressModal} onBgClick={() => setShowPressModal(false)}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold">Prescribe Medication</h3>
                <p className="text-[10px] text-muted-foreground">
                  Select one or more drugs
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPressModal(false)}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Patient strip */}
          {pressAppt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-tint/5 border border-tint/5">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                {pressAppt.species === "dog" ? (
                  <Dog className="w-5 h-5" />
                ) : pressAppt.species === "cat" ? (
                  <Cat className="w-5 h-5" />
                ) : (
                  <FlaskConical className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {pressAppt.petName}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {pressAppt.petType} · {pressAppt.ownerName}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald">
                <UserIcon className="w-3 h-3" />
                <span className="font-bold">Dr. {user?.fullname}</span>
              </div>
            </div>
          )}

          {/* ⚠️ Interaction warning */}
          {interactions.length > 0 && (
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-[10px]">
                  Drug Interaction Warning
                </p>
                {interactions.map((pair, i) => (
                  <p key={i} className="font-semibold">
                    ⚠ <span className="font-black">{pair.a}</span> may interact
                    with <span className="font-black">{pair.b}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {showNoInteractionNotice && (
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-emerald/10 border border-emerald/20 text-xs text-emerald">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-[10px]">
                  Interaction Check
                </p>
                <p className="font-semibold">
                  No known interactions detected among the selected drugs.
                </p>
              </div>
            </div>
          )}

          {/* Drug selection list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald uppercase tracking-widest">
                Select Drugs{" "}
                {selectedDrugIds.length > 0 &&
                  `(${selectedDrugIds.length} selected)`}
              </p>
              {selectedDrugIds.length > 0 && (
                <button
                  onClick={() => setSelectedDrugIds([])}
                  className="text-[10px] text-muted-foreground hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search box */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search drugs by name or class…"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/30 border border-border text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald/40"
              />
              {drugSearch && (
                <button
                  onClick={() => setDrugSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filtered drug list */}
            {(() => {
              const filtered = drugSearch.trim()
                ? allDrugs.filter(
                    (d) =>
                      d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                      (d.class || "")
                        .toLowerCase()
                        .includes(drugSearch.toLowerCase()),
                  )
                : allDrugs;
              return (
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {filtered.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No drugs matching “{drugSearch}”
                    </div>
                  ) : (
                    filtered.map((drug) => {
                      const sKey = pressPet ? speciesKey(pressPet.type) : null;
                      const dose = getDrugDosageForSpecies(drug, sKey);
                      const sev = getDrugSeverityForSpecies(drug, sKey);
                      const isSelected = selectedDrugIds.includes(drug.drug_id);
                      // Check if this drug interacts with any currently-selected drug
                      const hasInteraction = isSelected
                        ? interactingDrugIds.has(drug.drug_id)
                        : selectedDrugs.some(
                            (sel) =>
                              drugInteractsWith(sel, drug) ||
                              drugInteractsWith(drug, sel),
                          );
                      return (
                        <button
                          key={drug.drug_id}
                          onClick={() => toggleDrug(drug.drug_id)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all text-xs ${
                            isSelected && hasInteraction
                              ? "bg-amber-500/10 border-amber-500/30 shadow-sm"
                              : isSelected
                                ? "bg-emerald/10 border-emerald/30 shadow-sm"
                                : hasInteraction && selectedDrugs.length > 0
                                  ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                                  : "bg-tint/3 border-tint/5 hover:bg-tint/5 hover:border-tint/10"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "bg-emerald border-emerald"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-bold ${isSelected && hasInteraction ? "text-amber-400" : isSelected ? "text-emerald" : ""}`}
                              >
                                {drug.name}
                              </span>
                              <span className="text-muted-foreground opacity-60">
                                {drug.class}
                              </span>
                              {sev && <ToxicityBadge severity={sev} />}
                              {hasInteraction && selectedDrugs.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" />{" "}
                                  Interaction
                                </span>
                              )}
                            </div>
                            {dose && (
                              <p className="text-muted-foreground mt-0.5">
                                <span className="text-cyan font-semibold capitalize">
                                  {pressPet?.type} dose:
                                </span>{" "}
                                {formatDose(dose)}
                              </p>
                            )}
                            {drug.indications?.length > 0 && (
                              <p className="text-muted-foreground/60 truncate mt-0.5">
                                {drug.indications
                                  .slice(0, 2)
                                  .map(String)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>

          {/* Per-drug detail cards for all selected drugs */}
          {selectedDrugs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Selected Drug Details
              </p>
              {selectedDrugs.map((drug) => {
                const sKey = pressPet ? speciesKey(pressPet.type) : null;
                const dose = getDrugDosageForSpecies(drug, sKey);
                const tox = getDrugToxicityForSpecies(drug, sKey);
                const sev = getDrugSeverityForSpecies(drug, sKey);
                const cl = severityColor(sev);
                return (
                  <div
                    key={drug.drug_id}
                    className="p-3 rounded-xl bg-tint/5 border border-tint/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-emerald">
                        {drug.name}
                      </p>
                      {sev && <ToxicityBadge severity={sev} />}
                    </div>
                    {dose && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FlaskConical className="w-3 h-3 text-cyan" />
                        <span className="text-muted-foreground capitalize">
                          {pressPet?.type || "Species"} dose:
                        </span>
                        <span className="font-bold text-cyan">
                          {formatDose(dose)}
                        </span>
                      </div>
                    )}
                    {tox && (
                      <div
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${cl.bg} ${cl.border} border`}
                      >
                        <AlertTriangle className={`w-3 h-3 ${cl.text}`} />
                        <span className={`font-semibold ${cl.text}`}>
                          Toxicity: {formatDose(tox)}
                        </span>
                      </div>
                    )}
                    {drug.contraindications?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70">
                        <span className="font-bold">⚠ Contraindicated:</span>{" "}
                        {drug.contraindications.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPressModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
            >
              {t("cancel")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSavePrescriptions}
              disabled={
                createPrescription.isPending || selectedDrugIds.length === 0
              }
              className="flex-1 px-4 py-2.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPrescription.isPending
                ? "Prescribing…"
                : selectedDrugIds.length === 0
                  ? "Select a Drug"
                  : `Prescribe ${selectedDrugIds.length} Drug${selectedDrugIds.length > 1 ? "s" : ""}`}
            </motion.button>
          </div>
        </motion.div>
      </Modal>
      {/* ═══════════════════ CASE HISTORY MODAL ═══════════════════════════════ */}
      <CaseHistoryModal
        open={showCaseHistory}
        onClose={() => {
          setShowCaseHistory(false);
          caseHistoryCrew.reset();
        }}
        patient={
          myActiveCase
            ? {
                petName: myActiveCase.petName,
                species: myActiveCase.species,
                breed: myActiveCase.breed,
                ownerName: myActiveCase.ownerName,
                caseNumber: myActiveCase.caseNumber,
              }
            : null
        }
        rawJson={caseHistoryCrew.data}
        isLoading={caseHistoryCrew.isPending}
        errorMessage={
          caseHistoryCrew.isError
            ? getErrorDetail(
                caseHistoryCrew.error,
                "Failed to load case history.",
              )
            : null
        }
      />

      {/* ═══════════════════ UPDATE WEIGHT MODAL ════════════════════════════════ */}
      <Modal
        open={showUpdateWeight}
        onBgClick={() => setShowUpdateWeight(false)}
      >
        {(() => {
          const activePet = allPets.find(
            (p) => p.pet_id === myActiveCase?.petId,
          );
          return (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Update Weight</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {activePet?.name ?? "Current patient"} — current:{" "}
                      {activePet?.weight ?? "—"} kg
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpdateWeight(false)}
                  className="p-1.5 hover:bg-muted rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  New Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveWeight(activePet);
                    }
                  }}
                  placeholder="e.g. 25.5"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-lg font-bold outline-none focus:border-amber-400/50 transition-colors text-center tabular-nums"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpdateWeight(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={
                    updatePet.isPending ||
                    !newWeightInput ||
                    Number.isNaN(parseFloat(newWeightInput)) ||
                    parseFloat(newWeightInput) <= 0
                  }
                  onClick={() => handleSaveWeight(activePet)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-bold border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatePet.isPending ? "Saving…" : "Save Weight"}
                </motion.button>
              </div>
            </motion.div>
          );
        })()}
      </Modal>

      {/* ═══════════════════ FLUID THERAPY MODAL ════════════════════════════════ */}
      {(() => {
        const activePet = allPets.find((p) => p.pet_id === myActiveCase?.petId);
        return (
          <FluidTherapyModal
            open={showFluidTherapy}
            onClose={() => setShowFluidTherapy(false)}
            initialWeight={activePet?.weight}
            initialSpecies={
              activePet?.type === "dog" || activePet?.type === "cat"
                ? activePet.type
                : "dog"
            }
            petName={myActiveCase?.petName}
          />
        );
      })()}

      {/* ═══════════════════ DOSE CALCULATOR MODAL ══════════════════════════ */}
      {(() => {
        const activePet = allPets.find((p) => p.pet_id === myActiveCase?.petId);
        // Prefer all prescriptions for the active case, not only current session ones.
        const casePrescriptions = myActiveCase
          ? getCasePrescriptions(myActiveCase.petId, myActiveCase.clientId)
          : [];
        const sourcePrescriptions =
          casePrescriptions.length > 0
            ? casePrescriptions
            : sessionCasePrescriptions;
        const preselectedIds = [
          ...new Set(
            sourcePrescriptions.flatMap((rx) =>
              getAllDrugIdsForRx(rx.prescription_id),
            ),
          ),
        ];
        // Only show prescribed drugs in the dose calculator
        const prescribedDrugs =
          preselectedIds.length > 0
            ? allDrugs.filter((d) => preselectedIds.includes(d.drug_id))
            : [];
        return (
          <DrugDoseCalculatorModal
            open={showDrugCalc}
            onClose={() => setShowDrugCalc(false)}
            mode="simulation"
            initialWeight={activePet?.weight}
            initialSpecies={
              activePet?.type === "dog" || activePet?.type === "cat"
                ? activePet.type
                : "dog"
            }
            petName={myActiveCase?.petName}
            drugs={prescribedDrugs}
            preselectedDrugIds={
              preselectedIds.length > 0 ? preselectedIds : undefined
            }
            onDosesCalculated={(results) => {
              setCalculatedDoses((prev) => {
                const next = new Map(prev);
                results.forEach((r) =>
                  next.set(r.drugId, {
                    totalMg: r.totalMg,
                    dose: r.dose,
                    doseUnit: r.doseUnit,
                    concLabel: r.concLabel,
                    drugName: r.drugName,
                    drugClass: r.drugClass,
                    frequency: r.frequency,
                    route: r.route,
                  }),
                );
                return next;
              });
            }}
          />
        );
      })()}
    </div>
  );
}
