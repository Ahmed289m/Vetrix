"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  Play, CheckCircle2, Dog, Cat, Clock, Activity, ChevronRight,
  Stethoscope, Pill, X, AlertTriangle, Calendar, User as UserIcon,
  FileText, Info, UserCheck, Inbox, ShieldCheck, ClipboardList,
  Pencil, Trash2, Plus, Zap, ShieldAlert, FlaskConical, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointments, useUpdateAppointment } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useVisits, useCreateVisit, useUpdateVisit } from "@/app/_hooks/queries/use-visits";
import {
  useCreatePrescription, usePrescriptions,
  useDeletePrescription,
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

/** Get species key for dosage/toxicity objects.
 *  Drug form stores: dosage.dog / dosage.cat
 *  We match pet.type: "dog" | "cat" | "other" */
const speciesKey = (petType: string) =>
  petType === "dog" ? "dog" : petType === "cat" ? "cat" : null;

/** Map severity string to Tailwind color tokens */
const severityColor = (sev?: string): { bg: string; text: string; border: string; label: string } => {
  const s = (sev || "").toLowerCase();
  if (s === "high")   return { bg: "bg-red-500/10",   text: "text-red-400",   border: "border-red-500/20",   label: "High" };
  if (s === "medium") return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Medium" };
  if (s === "low")    return { bg: "bg-yellow-500/10",text: "text-yellow-400",border: "border-yellow-500/20",label: "Low" };
  return { bg: "bg-emerald/10", text: "text-emerald",   border: "border-emerald/20",   label: "No Risk" };
};

type SimStatus = "confirmed" | "pending-doctor" | "in-progress" | "completed";
interface Props { role: "staff" | "doctor"; }

// ── Portal Modal — renders at document.body to escape overflow clipping ────────
function Modal({ children, open, onBgClick }: { children: React.ReactNode; open: boolean; onBgClick?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !open) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-bg"
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

// ── Toxicity badge ─────────────────────────────────────────────────────────────
function ToxicityBadge({ severity }: { severity?: string }) {
  const c = severityColor(severity);
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SimulationMode({ role }: Props) {
  // ── Session Rx tracking ──────────────────────────────────────────────────
  const [sessionRxIds, setSessionRxIds] = useState<Set<string>>(new Set());

  // ── Visit modal ──────────────────────────────────────────────────────────
  const [visitMode,           setVisitMode]           = useState<"create" | "edit">("create");
  const [showVisitModal,      setShowVisitModal]      = useState(false);
  const [activeVisitApptId,   setActiveVisitApptId]   = useState("");
  const [editingVisitId,      setEditingVisitId]      = useState("");
  const [visitNotes,          setVisitNotes]          = useState("");
  const [visitPrescriptionId, setVisitPrescriptionId] = useState("");

  // ── Visit detail modal ───────────────────────────────────────────────────
  const [showVisitDetail, setShowVisitDetail] = useState(false);
  const [detailVisit,     setDetailVisit]     = useState<Visit | null>(null);

  // ── Prescription modal ───────────────────────────────────────────────────
  const [showPressModal,    setShowPressModal]    = useState(false);
  const [activePressApptId, setActivePressApptId] = useState("");
  // Multi-drug: array of selected drug IDs
  const [selectedDrugIds, setSelectedDrugIds] = useState<string[]>([]);
  // Drug search in prescription modal
  const [drugSearch, setDrugSearch] = useState("");

  const { t }    = useLang();
  const { user } = useAuth();
  const isClientRole = user?.role === "client";
  useWebSocket(); // live sync: invalidates React Query caches on backend broadcast

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: apptData }      = useAppointments();
  const { data: petsData }      = usePets();
  // Guard: clients cannot call /users (403) — skip for client role
  const { data: usersData }     = useUsers({ enabled: !isClientRole });
  const { data: drugsData }     = useDrugs();
  const { data: presData }      = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: visitsData }    = useVisits();

  const updateAppointment  = useUpdateAppointment();
  const createVisit        = useCreateVisit();
  const updateVisit        = useUpdateVisit();
  const createPrescription = useCreatePrescription();
  const deletePrescription = useDeletePrescription();

  const allAppointments: Appointment[] = apptData?.data      || [];
  const allPets: Pet[]                 = petsData?.data      || [];
  const allUsers: UserModel[]          = usersData?.data     || [];
  const allDrugs: Drug[]               = drugsData?.data     || [];
  const allPrescriptions               = presData?.data      || [];
  const allPresItems                   = presItemsData?.data || [];
  const allVisits: Visit[]             = visitsData?.data    || [];

  // ── Enriched appointments ────────────────────────────────────────────────
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
          caseNumber: `APT-${String(idx + 1).padStart(4, "0")}`,
          petName:    pet?.name        || t("unknown_pet"),
          petId:      a.pet_id,
          petType:    pet?.type        || "other",
          clientId:   a.client_id,
          species:    (pet?.type || "dog") as "dog" | "cat" | "other",
          breed:      pet?.breed       || t("mixed"),
          ownerName:  client?.fullname || t("unknown_owner"),
          complaint:  a.reason         || t("regular_checkup"),
          doctorName: doctor?.fullname || "",
          simStatus:  a.status as SimStatus,
        };
      });
  }, [allAppointments, allPets, allUsers, t]);

  const myActiveCase = useMemo(
    () => simAppointments.find((a) => a.simStatus === "in-progress" && a.doctor_id === user?.userId),
    [simAppointments, user?.userId],
  );

  const pendingRequests = useMemo(
    () => simAppointments.filter((a) => a.simStatus === "pending-doctor"),
    [simAppointments],
  );

  // ── Drug helpers ─────────────────────────────────────────────────────────
  const getDrugForRx = (rxId: string): Drug | undefined => {
    const rx   = allPrescriptions.find((p) => p.prescription_id === rxId);
    const item = allPresItems.find((pi) => pi.prescriptionItem_id === rx?.prescriptionItem_id);
    return allDrugs.find((d) => d.drug_id === item?.drug_id);
  };

  const getCasePrescriptions = (petId: string, clientId: string) =>
    allPrescriptions.filter((rx) => rx.pet_id === petId && rx.client_id === clientId);

  const getUnlinkedCasePrescriptions = (petId: string, clientId: string) => {
    const linked = new Set(allVisits.map((v) => v.prescription_id).filter(Boolean));
    return getCasePrescriptions(petId, clientId).filter((rx) => !linked.has(rx.prescription_id));
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

  // ── Drug interaction detection ────────────────────────────────────────────
  const interactions = useMemo(() => {
    const pairs: { a: string; b: string }[] = [];
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const a = selectedDrugs[i];
        const b = selectedDrugs[j];
        const aInteractsB = (a.drugInteractions || []).some((name) =>
          b.name.toLowerCase().includes(name.toLowerCase()),
        );
        const bInteractsA = (b.drugInteractions || []).some((name) =>
          a.name.toLowerCase().includes(name.toLowerCase()),
        );
        if (aInteractsB || bInteractsA) pairs.push({ a: a.name, b: b.name });
      }
    }
    return pairs;
  }, [selectedDrugs]);

  // ── Lookup helpers ────────────────────────────────────────────────────────
  const visitAppt = simAppointments.find((a) => a.appointment_id === activeVisitApptId);
  const pressAppt = simAppointments.find((a) => a.appointment_id === activePressApptId);

  // Pet for the prescription modal (to show species-specific dosage/toxicity)
  const pressPet = pressAppt
    ? allPets.find((p) => p.pet_id === pressAppt.petId) ?? null
    : null;

  // ── Staff actions ─────────────────────────────────────────────────────────
  const handleStart = (apptId: string) => {
    updateAppointment.mutate(
      { id: apptId, data: { status: "pending-doctor" } },
      {
        onSuccess: () => toast.info("Case dispatched — waiting for a doctor to accept"),
        onError:   () => toast.error("Failed to start case"),
      },
    );
  };

  // ── Doctor actions ────────────────────────────────────────────────────────
  const handleAccept = (apptId: string) => {
    if (!user?.userId) return;
    if (myActiveCase) { toast.error("Complete your current case before accepting another."); return; }
    updateAppointment.mutate(
      { id: apptId, data: { status: "in-progress", doctor_id: user.userId } },
      {
        onSuccess: () => {
          setSessionRxIds(new Set());
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
          toast.success("Case completed");
        },
        onError: () => toast.error("Failed to complete case"),
      },
    );
  };

  // ── Visit modal ───────────────────────────────────────────────────────────
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
        notes:     visitNotes || "Visit created from simulation mode",
        date:      new Date().toISOString(),
        ...(visitPrescriptionId && { prescription_id: visitPrescriptionId }),
      };
      createVisit.mutate(payload, {
        onSuccess: () => { toast.success("Visit recorded."); setShowVisitModal(false); },
        onError:   (err: any) => toast.error(err?.response?.data?.detail || "Failed to record visit."),
      });
    }
  };

  // ── Prescription modal ────────────────────────────────────────────────────
  const openCreatePrescription = (apptId: string) => {
    setActivePressApptId(apptId);
    setSelectedDrugIds([]);  // clear previous selection
    setDrugSearch("");        // clear search
    setShowPressModal(true);
  };

  const handleDeletePrescription = (rxId: string) => {
    if (!confirm("Delete this prescription?")) return;
    deletePrescription.mutate(rxId, {
      onSuccess: () => {
        setSessionRxIds((prev) => { const next = new Set(prev); next.delete(rxId); return next; });
        toast.success("Prescription deleted.");
      },
      onError: () => toast.error("Failed to delete prescription."),
    });
  };

  const handleSavePrescriptions = () => {
    const appt = simAppointments.find((a) => a.appointment_id === activePressApptId);
    if (!appt) return;
    if (selectedDrugIds.length === 0) { toast.warning("Select at least one drug"); return; }

    // ── Create A SINGLE prescription with all selected drugs ──
    createPrescription.mutate(
      { client_id: appt.clientId, pet_id: appt.petId, drug_ids: selectedDrugIds } satisfies PrescriptionCreate,
      {
        onSuccess: (res: any) => {
          const rxId = res?.data?.prescription_id;
          if (rxId) {
            setSessionRxIds((prev) => new Set([...prev, rxId]));
            toast.success(`Prescription issued with ${selectedDrugIds.length} drug${selectedDrugIds.length > 1 ? "s" : ""}.`);
            
            // Auto-open visit creation modal pre-linked to the single prescription
            setShowPressModal(false);
            setSelectedDrugIds([]);
            setDrugSearch("");
            setVisitMode("create");
            setActiveVisitApptId(activePressApptId);
            setEditingVisitId("");
            setVisitNotes("");
            setVisitPrescriptionId(rxId);
            setShowVisitModal(true);
          }
        },
        onError: () => {
          toast.error("Failed to create prescription.");
          setShowPressModal(false);
        },
      }
    );
  };

  const toggleDrug = (drugId: string) => {
    setSelectedDrugIds((prev) =>
      prev.includes(drugId) ? prev.filter((id) => id !== drugId) : [...prev, drugId],
    );
  };

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
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`p-4 rounded-xl border-2 space-y-3 ${
                  a.simStatus === "confirmed"      ? "border-muted/40 bg-muted/5" :
                  a.simStatus === "pending-doctor" ? "border-orange/30 bg-orange/5" :
                                                     "border-cyan/30 bg-cyan/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {a.species === "dog" ? <Dog className="w-5 h-5" /> : a.species === "cat" ? <Cat className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.petName}</p>
                      <p className="text-xs text-muted-foreground">{a.ownerName} · {a.complaint}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{a.caseNumber}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase whitespace-nowrap ${
                    a.simStatus === "confirmed"      ? "bg-muted/30 text-muted-foreground" :
                    a.simStatus === "pending-doctor" ? "bg-orange/15 text-orange" :
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
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleStart(a.appointment_id)}
                    disabled={updateAppointment.isPending}
                    className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold glow-emerald disabled:opacity-50">
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
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl border-2 border-cyan/30 bg-cyan/5 space-y-4"
            >
              <div className="flex items-center gap-1.5">
                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 rounded-full bg-cyan" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan">
                  {t("current_case")} — {t("in_progress")}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
                    {myActiveCase.species === "dog" ? <Dog className="w-6 h-6" /> : myActiveCase.species === "cat" ? <Cat className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
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

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="font-bold">Assigned to you · Dr. {user?.fullname}</span>
              </div>

              {/* Session prescriptions */}
              {(() => {
                const rxs = sessionCasePrescriptions;
                if (!rxs.length) return (
                  <div className="text-xs text-muted-foreground/60 italic px-1">No prescriptions issued this session yet.</div>
                );
                return (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1">
                      <Pill className="w-3 h-3" /> This session's prescriptions
                    </p>
                    {rxs.map((rx) => {
                      const drug = getDrugForRx(rx.prescription_id);
                      const sKey = speciesKey(myActiveCase.petType);
                      const sev  = sKey ? (drug?.toxicity as any)?.[`severity${sKey.charAt(0).toUpperCase() + sKey.slice(1)}`] : undefined;
                      return (
                        <div key={rx.prescription_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/5 border border-emerald/15 text-xs group">
                          <Pill className="w-3.5 h-3.5 text-emerald shrink-0" />
                          <span className="font-bold text-emerald flex-1 truncate">{drug?.name || "Drug"}</span>
                          {sev && <ToxicityBadge severity={sev} />}
                          <button
                            onClick={() => { setDetailVisit(null); setShowVisitDetail(false); }}
                            className="sr-only"
                          />
                          <button
                            onClick={() => handleDeletePrescription(rx.prescription_id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange/15 text-orange font-black">
                    {pendingRequests.length}
                  </span>
                )}
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 rounded-xl border border-border/30 bg-muted/5 text-center space-y-2">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">No pending cases yet</p>
                  <p className="text-xs text-muted-foreground/60">Staff will dispatch cases here</p>
                </div>
              ) : (
                pendingRequests.map((a, i) => (
                  <motion.div key={a.appointment_id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl border-2 border-orange/30 bg-orange/5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                          {a.species === "dog" ? <Dog className="w-5 h-5" /> : a.species === "cat" ? <Cat className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
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
              <p className="text-xs text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 inline mr-1" />
                {pendingRequests.length} more case{pendingRequests.length > 1 ? "s" : ""} waiting. Complete current case to accept next.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ VISIT CREATE/EDIT MODAL ════════════════════════ */}
      <Modal open={showVisitModal} onBgClick={() => setShowVisitModal(false)}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-cyan-blue flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-base font-bold">{visitMode === "edit" ? "Edit Visit" : t("create_visit")}</h3>
            </div>
            <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {visitMode === "create" && visitAppt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                {visitAppt.species === "dog" ? <Dog className="w-5 h-5" /> : visitAppt.species === "cat" ? <Cat className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{visitAppt.petName}</p>
                <p className="text-xs text-muted-foreground truncate">{visitAppt.ownerName} · {visitAppt.complaint}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{visitAppt.caseNumber}</span>
            </div>
          )}

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

          {/* No prescription warning */}
          {visitMode === "create" && visitAppt &&
            getCasePrescriptions(visitAppt.petId, visitAppt.clientId).length === 0 && (
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">No prescription issued yet. Consider prescribing first.</span>
            </div>
          )}

          {/* Link prescription - only unlinked ones from this case */}
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
              {createVisit.isPending || updateVisit.isPending ? "Saving…" : visitMode === "edit" ? "Save Changes" : t("create_visit")}
            </motion.button>
          </div>
        </motion.div>
      </Modal>

      {/* ═══════════════════ VISIT DETAIL MODAL ═════════════════════════════ */}
      <Modal open={showVisitDetail} onBgClick={() => setShowVisitDetail(false)}>
        {detailVisit && (() => {
          const pet    = allPets.find((p) => p.pet_id === detailVisit.pet_id);
          const doctor = allUsers.find((u) => u.user_id === detailVisit.doctor_id);
          const client = allUsers.find((u) => u.user_id === detailVisit.client_id);
          const drug   = getDrugForRx(detailVisit.prescription_id || "");
          const sKey   = pet ? speciesKey(pet.type) : null;
          const dosage = sKey && drug ? (drug.dosage as any)?.[sKey] : drug ? formatDose(drug.dosage) : null;
          const tox    = sKey && drug ? (drug.toxicity as any)?.[sKey] : null;
          const sev    = sKey && drug ? (drug.toxicity as any)?.[`severity${sKey.charAt(0).toUpperCase() + sKey.slice(1)}`] : undefined;
          return (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
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
                    <p className="text-[10px] font-mono text-muted-foreground">{detailVisit.visit_id.slice(0, 14)}…</p>
                  </div>
                </div>
                <button onClick={() => setShowVisitDetail(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pet + owner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  {pet?.type === "dog" ? <Dog className="w-5 h-5" /> : pet?.type === "cat" ? <Cat className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{pet?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{pet?.breed} · {pet?.type}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-semibold">{client?.fullname || "—"}</p>
                  <p className="opacity-60">Owner</p>
                </div>
              </div>

              {/* Doctor + Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-cyan/5 border border-cyan/15">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Attending Doctor</p>
                  <p className="text-sm font-bold text-cyan">Dr. {doctor?.fullname || "Unknown"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Visit Date</p>
                  <p className="text-sm font-bold">{fmtDate(detailVisit.date)}</p>
                </div>
              </div>

              {/* Notes */}
              {detailVisit.notes && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Clinical Notes
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{detailVisit.notes}</p>
                </div>
              )}

              {/* Drug info */}
              {drug && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1">
                    <Pill className="w-3 h-3" /> Prescribed Drug
                  </p>
                  <div className="p-4 rounded-xl bg-emerald/5 border border-emerald/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-emerald">{drug.name}</p>
                        <p className="text-xs text-muted-foreground">{drug.drugClass}</p>
                      </div>
                      {sev && <ToxicityBadge severity={sev} />}
                    </div>

                    {/* Species-specific dosage */}
                    {dosage && (
                      <div className="px-3 py-2 rounded-xl bg-cyan/5 border border-cyan/15 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-1">
                          Dosage for {pet?.type || "this species"}
                        </p>
                        <p className="font-semibold text-cyan">{dosage}</p>
                      </div>
                    )}

                    {/* Species-specific toxicity */}
                    {tox && (
                      <div className={`px-3 py-2 rounded-xl border text-xs ${severityColor(sev).bg} ${severityColor(sev).border}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${severityColor(sev).text}`}>
                          Toxicity for {pet?.type || "this species"}
                        </p>
                        <p className={`font-semibold ${severityColor(sev).text}`}>{tox}</p>
                      </div>
                    )}

                    {/* Interactions */}
                    {drug.drugInteractions?.length > 0 && (
                      <div className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Known Interactions
                        </p>
                        <p className="text-amber-400/80 font-medium">{drug.drugInteractions.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit button */}
              <div className="flex gap-3 pt-1">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowVisitDetail(false); openEditVisit(detailVisit); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-cyan-blue text-primary-foreground text-sm font-bold">
                  <Pencil className="w-4 h-4" /> Edit Visit
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowVisitDetail(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors">
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
          initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
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
                <p className="text-[10px] text-muted-foreground">Select one or more drugs</p>
              </div>
            </div>
            <button onClick={() => setShowPressModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Patient strip */}
          {pressAppt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                {pressAppt.species === "dog" ? <Dog className="w-5 h-5" /> : pressAppt.species === "cat" ? <Cat className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{pressAppt.petName}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{pressAppt.petType} · {pressAppt.ownerName}</p>
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
                <p className="font-black uppercase tracking-widest text-[10px]">Drug Interaction Warning</p>
                {interactions.map((pair, i) => (
                  <p key={i} className="font-semibold">
                    ⚠ <span className="font-black">{pair.a}</span> may interact with <span className="font-black">{pair.b}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Drug selection list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald uppercase tracking-widest">
                Select Drugs {selectedDrugIds.length > 0 && `(${selectedDrugIds.length} selected)`}
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
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                placeholder="Search drugs by name or class…"
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
                ? allDrugs.filter((d) =>
                    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                    d.drugClass.toLowerCase().includes(drugSearch.toLowerCase()),
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
                      const sKey      = pressPet ? speciesKey(pressPet.type) : null;
                      const dose      = sKey ? (drug.dosage as any)?.[sKey] : null;
                      const sev       = sKey ? (drug.toxicity as any)?.[`severity${sKey.charAt(0).toUpperCase() + sKey.slice(1)}`] : undefined;
                      const isSelected = selectedDrugIds.includes(drug.drug_id);
                      return (
                        <button
                          key={drug.drug_id}
                          onClick={() => toggleDrug(drug.drug_id)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all text-xs ${
                            isSelected
                              ? "bg-emerald/10 border-emerald/30 shadow-sm"
                              : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected ? "bg-emerald border-emerald" : "border-muted-foreground/30"
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold ${isSelected ? "text-emerald" : ""}`}>{drug.name}</span>
                              <span className="text-muted-foreground opacity-60">{drug.drugClass}</span>
                              {sev && <ToxicityBadge severity={sev} />}
                            </div>
                            {dose && (
                              <p className="text-muted-foreground mt-0.5">
                                <span className="text-cyan font-semibold capitalize">{pressPet?.type} dose:</span> {formatDose(dose)}
                              </p>
                            )}
                            {drug.indications?.length > 0 && (
                              <p className="text-muted-foreground/60 truncate mt-0.5">{drug.indications.slice(0, 2).map(String).join(", ")}</p>
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
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selected Drug Details</p>
              {selectedDrugs.map((drug) => {
                const sKey = pressPet ? speciesKey(pressPet.type) : null;
                const dose = sKey ? (drug.dosage as any)?.[sKey] : null;
                const tox  = sKey ? (drug.toxicity as any)?.[sKey] : null;
                const sev  = sKey ? (drug.toxicity as any)?.[`severity${sKey.charAt(0).toUpperCase() + sKey.slice(1)}`] : undefined;
                const cl   = severityColor(sev);
                return (
                  <div key={drug.drug_id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-emerald">{drug.name}</p>
                      {sev && <ToxicityBadge severity={sev} />}
                    </div>
                    {dose && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FlaskConical className="w-3 h-3 text-cyan" />
                        <span className="text-muted-foreground capitalize">{pressPet?.type || "Species"} dose:</span>
                        <span className="font-bold text-cyan">{formatDose(dose)}</span>
                      </div>
                    )}
                    {tox && (
                      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${cl.bg} ${cl.border} border`}>
                        <AlertTriangle className={`w-3 h-3 ${cl.text}`} />
                        <span className={`font-semibold ${cl.text}`}>Toxicity: {formatDose(tox)}</span>
                      </div>
                    )}
                    {drug.contraindications?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70">
                        <span className="font-bold">⚠ Contraindicated:</span> {drug.contraindications.slice(0, 2).join(", ")}
                      </p>
                    )}
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
              onClick={handleSavePrescriptions}
              disabled={createPrescription.isPending || selectedDrugIds.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {createPrescription.isPending
                ? "Prescribing…"
                : selectedDrugIds.length === 0
                  ? "Select a Drug"
                  : `Prescribe ${selectedDrugIds.length} Drug${selectedDrugIds.length > 1 ? "s" : ""}`}
            </motion.button>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}
