"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import type { MouseEvent } from "react";
import {
  Dog,
  Cat,
  Eye,
  X,
  FileText,
  Pill,
  Plus,
  Stethoscope,
  Calendar,
  User,
  ChevronRight,
  Activity,
  AlertCircle,
  AlertTriangle,
  Zap,
  FlaskConical,
  Shield,
  ShieldCheck,
  ClipboardList,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useFormik } from "formik";
import { useLang } from "@/app/_hooks/useLanguage";
import { useAuth } from "@/app/_hooks/useAuth";
import { sortByDate } from "@/app/_lib/utils/date-filter";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import { cn } from "@/app/_lib/utils";

import { useVisits, useCreateVisit } from "@/app/_hooks/queries/use-visits";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import type { Visit, Drug, Pet } from "@/app/_lib/types/models";

import {
  VisitDetailModal,
  fmtDate,
  speciesKey,
  SeverityBadge,
} from "@/app/dashboard/_components/VisitDetailModal";

// ── Main page ─────────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

type StatusFilter = "all" | "completed";

export default function VisitsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const { t } = useLang();
  const { user } = useAuth();

  const isClient = user?.role === "client";
  const canCreate =
    user?.role === "doctor" || user?.role === "staff" || user?.role === "owner";

  const { data: visitsData, isLoading: visitsLoading } = useVisits();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers({ enabled: !isClient });
  const { data: prescriptionsData } = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();

  const createVisit = useCreateVisit();

  const visits = visitsData?.data || [];
  const scopedVisits = isClient
    ? visits.filter((visit) => visit.client_id === user?.userId)
    : visits;
  const petsList = petsData?.data || [];
  const usersList = isClient ? [] : usersData?.data || [];
  const prescriptionsList = prescriptionsData?.data || [];
  const presItemsList = presItemsData?.data || [];
  const drugsList = drugsData?.data || [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPet = (id: string) => petsList.find((p) => p.pet_id === id);

  const getUser = (id: string) =>
    isClient
      ? id === user?.userId
        ? { fullname: user.fullname }
        : null
      : usersList.find((u) => u.user_id === id);

  const getDrugsForVisit = (visit: Visit): { drug: Drug; dose: string }[] => {
    if (!visit.prescription_id) return [];
    const rx = prescriptionsList.find(
      (p) => p.prescription_id === visit.prescription_id,
    );
    if (!rx || !rx.prescriptionItem_id) return [];

    const itemIds = rx.prescriptionItem_id.split(",");
    const items = presItemsList.filter((pi) =>
      itemIds.includes(pi.prescriptionItem_id),
    );

    return items
      .map((item) => {
        const drug = drugsList.find((d) => d.drug_id === item.drug_id);
        return drug ? { drug, dose: item.drugDose } : null;
      })
      .filter(Boolean) as { drug: Drug; dose: string }[];
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const sortedVisits = sortByDate(scopedVisits, "date", "desc");

  // ── Form ───────────────────────────────────────────────────────────────────
  const clients = isClient ? [] : usersList.filter((u) => u.role === "client");
  const doctors = isClient
    ? []
    : usersList.filter((u) => u.role === "doctor" || u.role === "staff");

  const formik = useFormik({
    initialValues: {
      client_id: "",
      pet_id: "",
      doctor_id: user?.userId || "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
      prescription_id: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.client_id) errors.client_id = "Select a client";
      if (!values.pet_id) errors.pet_id = "Select a pet";
      if (!values.doctor_id) errors.doctor_id = "Select a doctor";
      if (!values.date) errors.date = "Enter visit date";
      return errors;
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const payload = {
        client_id: values.client_id,
        pet_id: values.pet_id,
        doctor_id: values.doctor_id,
        date: new Date(values.date).toISOString(),
        ...(values.notes && { notes: values.notes }),
        ...(values.prescription_id && {
          prescription_id: values.prescription_id,
        }),
      };
      createVisit.mutate(payload, {
        onSuccess: () => {
          toast.success(
            t("visit_created_success") || "Visit recorded successfully.",
          );
          setIsFormOpen(false);
          resetForm();
          setSubmitting(false);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ||
            t("visit_create_failed") ||
            "Failed to record visit.";
          toast.error(msg);
          setSubmitting(false);
        },
      });
    },
  });

  const formClientPets = petsList.filter(
    (p) => p.client_id === formik.values.client_id,
  );
  const clientPrescriptions = prescriptionsList.filter(
    (rx) => rx.client_id === formik.values.client_id,
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-emerald" />
            <p className="text-xs font-black text-emerald uppercase tracking-widest">
              {t("visit_management") || "Visit Management"}
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isClient
              ? t("my_visits_history") || "My Clinical Visits"
              : t("visits_history") || "Clinical Visits"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sortedVisits.length} {t("total_recorded_visits") || "total visits"}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              formik.resetForm();
              setIsFormOpen(true);
            }}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-5 h-11 shadow-xl shadow-emerald/20 flex items-center gap-2 group shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            {t("record_visit") || "Record Visit"}
          </Button>
        )}
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(["all", "completed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              filter === f
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30",
            )}
          >
            {f === "completed" ? t("completed_status") : "All Visits"}
          </button>
        ))}
      </motion.div>

      {/* ── CLIENT VIEW — premium cards ── */}
      {isClient ? (
        <motion.div variants={fadeUp}>
          {visitsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-white/5 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : sortedVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-emerald/15 to-cyan/10 border border-emerald/20 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-emerald/40" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-foreground">No visits yet</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("no_visits_client_hint") ||
                    "Your clinical visit history will appear here after your appointments."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedVisits.map((visit, i) => {
                const pet = getPet(visit.pet_id);
                const pDrugs = getDrugsForVisit(visit);
                const doctor = getUser(visit.doctor_id);
                const PetIcon = pet?.type === "cat" ? Cat : Dog;
                return (
                  <motion.div
                    key={visit.visit_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedVisit(visit)}
                    className="glass-card p-5 space-y-4 cursor-pointer hover:border-emerald/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all group"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald/20 to-cyan/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <PetIcon className="w-6 h-6 text-emerald" />
                        </div>
                        <div>
                          <p className="font-black text-foreground group-hover:text-emerald transition-colors">
                            {pet?.name || "Unknown Pet"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {pet?.type || "pet"}{" "}
                            {pet?.breed ? `· ${pet.breed}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald border border-emerald/20">
                        Completed
                      </span>
                    </div>

                    {/* Date + Doctor */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Date
                        </p>
                        <p className="text-xs font-bold">
                          {fmtDate(visit.date)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cyan/5 border border-cyan/15">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> Doctor
                        </p>
                        <p className="text-xs font-bold text-cyan truncate">
                          Dr. {doctor?.fullname || "Assigned"}
                        </p>
                      </div>
                    </div>

                    {/* Notes snippet */}
                    {visit.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                        "{visit.notes}"
                      </p>
                    )}

                    {/* Drug badges */}
                    {pDrugs.map(({ drug }, idx: number) => {
                      const sK = speciesKey(pet?.type);
                      const tObj = sK ? (drug.toxicity as any)?.[sK] : null;
                      const s =
                        typeof tObj === "object" && tObj !== null
                          ? tObj.status
                          : null;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald/5 border border-emerald/10 mb-2"
                        >
                          <Pill className="w-4 h-4 text-emerald shrink-0" />
                          <span className="text-xs font-bold text-emerald flex-1 truncate">
                            {drug.name}
                          </span>
                          {s && <SeverityBadge severity={s} />}
                        </div>
                      );
                    })}

                    <p className="text-right text-xs text-emerald font-bold flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      View full details <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        /* ── STAFF / DOCTOR VIEW — list ── */
        <motion.div variants={fadeUp} className="space-y-3">
          {visitsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-white/5 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : sortedVisits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("no_visits_found") || "No visits found"}
            </div>
          ) : (
            sortedVisits.map((visit, i) => {
              const pet = getPet(visit.pet_id);
              const owner = getUser(visit.client_id);
              const doctor = getUser(visit.doctor_id);
              const pDrugs = getDrugsForVisit(visit);
              const PetIcon = pet?.type === "cat" ? Cat : Dog;

              return (
                <motion.div
                  key={visit.visit_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedVisit(visit)}
                  className="glass-card p-4 sm:p-5 border border-border/30 hover:border-emerald/20 hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.12)] cursor-pointer transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 group-hover:bg-emerald/10 transition-colors">
                        <PetIcon className="w-5 h-5 text-muted-foreground group-hover:text-emerald transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ID-{visit.visit_id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald">
                            {t("completed_status") || "Completed"}
                          </span>
                          {pDrugs.slice(0, 2).map(({ drug }, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 flex items-center gap-1"
                            >
                              <Pill className="w-2.5 h-2.5" /> {drug.name}
                            </span>
                          ))}
                          {pDrugs.length > 2 && (
                            <span className="text-[10px] text-muted-foreground font-bold">
                              +{pDrugs.length - 2} more
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold mt-0.5">
                          {pet?.name || "Unknown Pet"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {owner?.fullname || "Unknown"} · Dr.{" "}
                          {doctor?.fullname || "Assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground bg-white/5 py-1 px-3 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {fmtDate(visit.date)}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50 group-hover:border-emerald/30 group-hover:text-emerald transition-all">
                        <Eye className="w-3.5 h-3.5" />{" "}
                        {t("details_btn") || "Details"}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* ── Visit Detail Modal ── */}
      <VisitDetailModal
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        getPet={getPet}
        getUser={getUser}
        getDrugsForVisit={getDrugsForVisit}
        isClient={isClient}
      />

      {/* ── Create Visit Form (staff/doctor only) ── */}
      {canCreate && (
        <DashboardForm
          title={t("record_visit") || "Record Clinical Visit"}
          description={
            t("log_clinical_encounter") ||
            "Log a new clinical encounter for a patient"
          }
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={(e) =>
            formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
          }
          submitLabel={
            formik.isSubmitting
              ? t("recording") || "Recording…"
              : t("record_visit") || "Record Visit"
          }
        >
          <div className="space-y-5">
            {/* Client */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("client_owner")} *
              </Label>
              <Select
                value={formik.values.client_id}
                onValueChange={(val) => {
                  formik.setFieldValue("client_id", val);
                  formik.setFieldValue("pet_id", "");
                  formik.setFieldValue("prescription_id", "");
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-14 bg-white/5 border-white/5 rounded-2xl font-bold",
                    formik.errors.client_id &&
                      formik.touched.client_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_client")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {clients.map((c) => (
                    <SelectItem
                      key={c.user_id}
                      value={c.user_id}
                      className="rounded-xl font-bold"
                    >
                      {c.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pet */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("select_pet_label")} *
              </Label>
              <Select
                value={formik.values.pet_id}
                onValueChange={(val) => formik.setFieldValue("pet_id", val)}
                disabled={!formik.values.client_id}
              >
                <SelectTrigger
                  className={cn(
                    "h-14 bg-white/5 border-white/5 rounded-2xl font-bold",
                    formik.errors.pet_id &&
                      formik.touched.pet_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_pet_label")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {formClientPets.map((p) => (
                    <SelectItem
                      key={p.pet_id}
                      value={p.pet_id}
                      className="rounded-xl font-bold"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("assign_doctor")} *
              </Label>
              <Select
                value={formik.values.doctor_id}
                onValueChange={(val) => formik.setFieldValue("doctor_id", val)}
              >
                <SelectTrigger
                  className={cn(
                    "h-14 bg-white/5 border-white/5 rounded-2xl font-bold",
                    formik.errors.doctor_id &&
                      formik.touched.doctor_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_doctor_optional")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {doctors.map((d) => (
                    <SelectItem
                      key={d.user_id}
                      value={d.user_id}
                      className="rounded-xl font-bold"
                    >
                      {d.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {t("appointment_date")} *
              </Label>
              <Input
                type="date"
                name="date"
                value={formik.values.date}
                onChange={formik.handleChange}
                className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("clinical_notes_report")}
              </Label>
              <Input
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                placeholder={
                  t("clinical_notes_placeholder") ||
                  "Symptoms, diagnosis, treatment notes…"
                }
                className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold"
              />
            </div>

            {/* Optional Prescription */}
            {clientPrescriptions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <Label className="text-xs font-black uppercase tracking-widest text-emerald ml-1 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" />{" "}
                  {t("link_prescription") || "Link Prescription"} (optional)
                </Label>
                <Select
                  value={formik.values.prescription_id}
                  onValueChange={(val) =>
                    formik.setFieldValue("prescription_id", val)
                  }
                >
                  <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold">
                    <SelectValue
                      placeholder={
                        t("select_prescription") ||
                        "Link an existing prescription"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                    {clientPrescriptions.map((rx) => {
                      const item = presItemsList.find(
                        (pi) =>
                          pi.prescriptionItem_id === rx.prescriptionItem_id,
                      );
                      const drug = drugsList.find(
                        (d) => d.drug_id === item?.drug_id,
                      );
                      return (
                        <SelectItem
                          key={rx.prescription_id}
                          value={rx.prescription_id}
                          className="rounded-xl font-bold"
                        >
                          {drug?.name || "Prescription"} · RX-
                          {rx.prescription_id.slice(0, 6)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DashboardForm>
      )}
    </motion.div>
  );
}
