"use client";

import { type KeyboardEvent, useMemo, useState } from "react";
import { motion } from "@/app/_components/fast-motion";
import {
  Dog,
  Cat,
  Eye,
  Pill,
  Plus,
  Stethoscope,
  Calendar,
  User,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useFormik } from "formik";
import { useLang } from "@/app/_hooks/useLanguage";
import { useAuth } from "@/app/_hooks/useAuth";
import {
  sortByDate,
  filterByDateParts,
  filterByDateRange,
  type DatePartsFilter,
  type DateRangeFilter,
} from "@/app/_lib/utils/date-filter";
import { fadeUp } from "@/app/_lib/utils/shared-animations";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
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

import {
  useVisits,
  useCreateVisit,
  useDeleteVisit,
} from "@/app/_hooks/queries/use-visits";
import { useDeletePrescription } from "@/app/_hooks/queries/use-prescriptions";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import type { Visit, Drug } from "@/app/_lib/types/models";

import {
  VisitDetailModal,
  fmtDateTime,
  speciesKey,
  SeverityBadge,
} from "@/app/dashboard/_components/VisitDetailModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseDatePart = (
  value: string,
  min: number,
  max: number,
): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
};

// ── Reusable info tile ────────────────────────────────────────────────────────
function InfoTile({
  icon: Icon,
  label,
  value,
  className,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn("min-w-0 p-2.5 rounded-xl border space-y-0.5", className)}
    >
      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
        <Icon className="w-3 h-3 shrink-0" />
        {label}
      </p>
      <p className={cn("text-xs font-bold truncate", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VisitsPage() {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>("all");
  const [dayFilter, setDayFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [selectedVisitIds, setSelectedVisitIds] = useState<string[]>([]);
  const { t } = useLang();
  const { user } = useAuth();

  const isClient = user?.role === "client";
  const isStaff = user?.role === "staff";
  const isDoctor = user?.role === "doctor";
  const isOwner = user?.role === "owner";
  const canCreate = isOwner;
  const canOpenDetails = Boolean(user?.role);

  const { data: visitsData, isLoading: visitsLoading } = useVisits();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers({ enabled: !isClient });
  const { data: prescriptionsData } = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();

  const createVisit = useCreateVisit();
  const deleteVisit = useDeleteVisit();
  const deletePrescription = useDeletePrescription();
  const canDelete = isDoctor || isOwner || user?.role === "admin";

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
    ) as
      | (typeof prescriptionsList)[number]
      | {
          prescriptionItem_ids?: string[];
          prescriptionItem_id?: string;
        }
      | undefined;
    if (!rx) return [];

    const legacyPrescriptionItemId =
      "prescriptionItem_id" in rx && typeof rx.prescriptionItem_id === "string"
        ? rx.prescriptionItem_id
        : undefined;

    const itemIds =
      rx.prescriptionItem_ids && rx.prescriptionItem_ids.length > 0
        ? rx.prescriptionItem_ids
        : legacyPrescriptionItemId
          ? legacyPrescriptionItemId
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : [];
    if (!itemIds.length) return [];

    const items = presItemsList.filter((pi) =>
      itemIds.includes(pi.prescriptionItem_id),
    ) as Array<
      (typeof presItemsList)[number] & {
        drug_ids?: string[];
        drug_id?: string;
      }
    >;

    const result: { drug: Drug; dose: string }[] = [];
    for (const item of items) {
      const drugIds =
        item.drug_ids && item.drug_ids.length > 0
          ? item.drug_ids
          : item.drug_id
            ? [item.drug_id]
            : [];
      for (const drugId of drugIds) {
        const drug = drugsList.find((d) => d.drug_id === drugId);
        if (drug) {
          result.push({ drug, dose: item.drugDose });
        }
      }
    }
    return result;
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const sortedVisits = useMemo(
    () => sortByDate(scopedVisits, "date", "desc"),
    [scopedVisits],
  );
  const dateParts = useMemo<DatePartsFilter>(
    () => ({
      day: parseDatePart(dayFilter, 1, 31),
      month: parseDatePart(monthFilter, 1, 12),
      year: parseDatePart(yearFilter, 1900, 9999),
    }),
    [dayFilter, monthFilter, yearFilter],
  );
  const visibleVisits = useMemo(() => {
    const ranged = filterByDateRange(sortedVisits, "date", dateFilter);
    return filterByDateParts(ranged, "date", dateParts);
  }, [sortedVisits, dateFilter, dateParts]);

  const bulkDeletableVisitIds = useMemo(
    () => (canDelete ? visibleVisits.map((visit) => visit.visit_id) : []),
    [canDelete, visibleVisits],
  );
  const deletableVisitIdSet = useMemo(
    () => new Set(bulkDeletableVisitIds),
    [bulkDeletableVisitIds],
  );
  const effectiveSelectedVisitIds = selectedVisitIds.filter((id) =>
    deletableVisitIdSet.has(id),
  );

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

  const deleteVisitCascade = async (visit: Visit) => {
    if (visit.prescription_id) {
      await deletePrescription.mutateAsync(visit.prescription_id);
    }
    await deleteVisit.mutateAsync(visit.visit_id);
  };

  const handleDeleteVisit = async (visit: Visit) => {
    if (!confirm("Delete this visit?")) return;
    try {
      await deleteVisitCascade(visit);
      setSelectedVisitIds((prev) => prev.filter((id) => id !== visit.visit_id));
      toast.success("Visit deleted.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete visit.";
      toast.error(msg);
    }
  };

  const toggleVisitSelection = (visitId: string) => {
    if (!deletableVisitIdSet.has(visitId)) return;
    setSelectedVisitIds((prev) =>
      prev.includes(visitId)
        ? prev.filter((id) => id !== visitId)
        : [...prev, visitId],
    );
  };

  const toggleSelectAllVisits = () => {
    setSelectedVisitIds(() =>
      effectiveSelectedVisitIds.length === bulkDeletableVisitIds.length
        ? []
        : bulkDeletableVisitIds,
    );
  };

  const handleBulkDelete = async () => {
    if (effectiveSelectedVisitIds.length === 0) return;
    const count = effectiveSelectedVisitIds.length;
    if (!confirm(`Delete ${count} selected visit${count > 1 ? "s" : ""}?`)) {
      return;
    }

    const visitMap = new Map(
      visibleVisits.map((visit) => [visit.visit_id, visit]),
    );
    const visitsToDelete = effectiveSelectedVisitIds
      .map((id) => visitMap.get(id))
      .filter(Boolean) as Visit[];

    const results = await Promise.allSettled(
      visitsToDelete.map((visit) => deleteVisitCascade(visit)),
    );

    const failedIds: string[] = [];
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        failedIds.push(visitsToDelete[index].visit_id);
      }
    });

    if (successCount > 0) {
      toast.success(
        `Deleted ${successCount} visit${successCount > 1 ? "s" : ""}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Failed to delete ${failedIds.length} visit${failedIds.length > 1 ? "s" : ""}.`,
      );
    }

    setSelectedVisitIds(failedIds);
  };

  // ── Skeletons ──────────────────────────────────────────────────────────────
  const CardSkeleton = () => (
    <div className="h-48 rounded-2xl bg-tint/5 border border-tint/5 animate-pulse" />
  );
  const RowSkeleton = () => (
    <div className="h-28 rounded-2xl bg-tint/5 border border-tint/5 animate-pulse" />
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden"
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
            {visibleVisits.length}{" "}
            {t("total_recorded_visits") || "total visits"}
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

      {/* Date filter */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Select
          value={dateFilter}
          onValueChange={(v) => setDateFilter(v as DateRangeFilter)}
        >
          <SelectTrigger className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold col-span-2 sm:col-span-1">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5">
            <SelectItem value="today">{t("today_filter")}</SelectItem>
            <SelectItem value="month">{t("this_month")}</SelectItem>
            <SelectItem value="year">{t("this_year")}</SelectItem>
            <SelectItem value="all">{t("all_time")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          min={1}
          max={31}
          inputMode="numeric"
          placeholder={t("day_number") || "Day"}
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-semibold"
        />

        <Input
          type="number"
          min={1}
          max={12}
          inputMode="numeric"
          placeholder={t("month_number") || "Month"}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-semibold"
        />

        <Input
          type="number"
          min={1900}
          max={9999}
          inputMode="numeric"
          placeholder={t("year_number") || "Year"}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-semibold"
        />
      </motion.div>

      {canDelete && bulkDeletableVisitIds.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3"
        >
          <p className="text-sm font-semibold text-foreground">
            {effectiveSelectedVisitIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSelectAllVisits}
              className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
            >
              {effectiveSelectedVisitIds.length === bulkDeletableVisitIds.length
                ? "Clear selection"
                : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleBulkDelete();
              }}
              disabled={
                effectiveSelectedVisitIds.length === 0 || deleteVisit.isPending
              }
              className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete selected
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── CLIENT VIEW — premium cards ── */}
      {isClient ? (
        <motion.div variants={fadeUp}>
          {visitsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : visibleVisits.length === 0 ? (
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
              {visibleVisits.map((visit, i) => {
                const pet = getPet(visit.pet_id);
                const pDrugs = getDrugsForVisit(visit);
                const doctor = getUser(visit.doctor_id);
                const doctorName =
                  visit.doctor_name || doctor?.fullname || "Assigned";
                const visitReason =
                  (visit as { reason?: string }).reason?.trim() ||
                  visit.notes?.trim() ||
                  t("clinical_visit") ||
                  "Clinical Visit";
                const PetIcon = pet?.type === "cat" ? Cat : Dog;

                return (
                  <motion.div
                    key={visit.visit_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedVisit(visit)}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedVisit(visit);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="glass-card p-5 space-y-4 cursor-pointer hover:border-emerald/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all group"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald/20 to-cyan/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <PetIcon className="w-6 h-6 text-emerald" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-foreground group-hover:text-emerald transition-colors truncate">
                            {pet?.name || "Unknown Pet"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {pet?.type || "pet"}
                            {pet?.breed ? ` · ${pet.breed}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald border border-emerald/20 shrink-0">
                        Completed
                      </span>
                    </div>

                    {/* Date + Doctor info tiles */}
                    <div className="grid grid-cols-2 gap-2">
                      <InfoTile
                        icon={Calendar}
                        label="Date"
                        value={fmtDateTime(visit.date)}
                        className="bg-tint/5 border-tint/5"
                      />
                      <InfoTile
                        icon={User}
                        label="Doctor"
                        value={`Dr. ${doctorName}`}
                        className="bg-cyan/5 border-cyan/15"
                        valueClassName="text-cyan"
                      />
                    </div>

                    {/* Visit notes snippet */}
                    {visitReason && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic bg-tint/5 px-3 py-2 rounded-xl border border-tint/5">
                        {visitReason}
                      </p>
                    )}

                    {/* Drug badges */}
                    {pDrugs.length > 0 && (
                      <div className="space-y-1.5">
                        {pDrugs.map(({ drug }, idx: number) => {
                          const sK = speciesKey(pet?.type);
                          const toxicityBySpecies = drug.toxicity as Record<
                            string,
                            { status?: string }
                          >;
                          const s = sK
                            ? toxicityBySpecies?.[sK]?.status || null
                            : null;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald/5 border border-emerald/10"
                            >
                              <Pill className="w-4 h-4 text-emerald shrink-0" />
                              <span className="text-xs font-bold text-emerald flex-1 truncate">
                                {drug.name}
                              </span>
                              {s && <SeverityBadge severity={s} />}
                            </div>
                          );
                        })}
                      </div>
                    )}

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
        /* ── STAFF / DOCTOR VIEW — organized cards ── */
        <motion.div variants={fadeUp} className="space-y-3">
          {visitsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : visibleVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">
                {t("no_visits_found") || "No visits found"}
              </p>
            </div>
          ) : (
            visibleVisits.map((visit, i) => {
              const pet = getPet(visit.pet_id);
              const owner = getUser(visit.client_id);
              const doctor = getUser(visit.doctor_id);
              const doctorName =
                visit.doctor_name || doctor?.fullname || "Assigned";
              const isSelected = effectiveSelectedVisitIds.includes(
                visit.visit_id,
              );
              const visitReason =
                (visit as { reason?: string }).reason?.trim() ||
                visit.notes?.trim() ||
                t("clinical_visit") ||
                "Clinical Visit";
              const pDrugs = getDrugsForVisit(visit);
              const PetIcon = pet?.type === "cat" ? Cat : Dog;
              const hasRowActions = canDelete || canOpenDetails;

              return (
                <motion.div
                  key={visit.visit_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    if (canOpenDetails) setSelectedVisit(visit);
                  }}
                  onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                    if (!canOpenDetails) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedVisit(visit);
                    }
                  }}
                  role={canOpenDetails ? "button" : undefined}
                  tabIndex={canOpenDetails ? 0 : -1}
                  className={cn(
                    "glass-card p-4 sm:p-5 border border-border/30 hover:border-emerald/20 hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.12)] transition-all group space-y-3",
                    canOpenDetails ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  {/* ── Row 1: Pet identity + status ── */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {canDelete && (
                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleVisitSelection(visit.visit_id)
                            }
                            className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                            aria-label="Select visit"
                          />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 group-hover:bg-emerald/10 transition-colors">
                        <PetIcon className="w-5 h-5 text-muted-foreground group-hover:text-emerald transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold group-hover:text-emerald transition-colors truncate">
                          {pet?.name || "Unknown Pet"}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                          ID-{visit.visit_id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald border border-emerald/20 shrink-0">
                      {t("completed_status") || "Completed"}
                    </span>
                  </div>

                  {/* ── Row 2: Info tiles grid ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <InfoTile
                      icon={Clock}
                      label="Date"
                      value={fmtDateTime(visit.date)}
                      className="bg-tint/5 border-tint/5 col-span-2 sm:col-span-1"
                    />
                    <InfoTile
                      icon={User}
                      label="Doctor"
                      value={`Dr. ${doctorName}`}
                      className="bg-cyan/5 border-cyan/15"
                      valueClassName="text-cyan"
                    />
                    <InfoTile
                      icon={User}
                      label="Owner"
                      value={owner?.fullname || "Unknown"}
                      className="bg-tint/5 border-tint/5"
                    />
                    <InfoTile
                      icon={FileText}
                      label="Reason"
                      value={visitReason}
                      className="bg-tint/5 border-tint/5"
                    />
                  </div>

                  {/* ── Row 3: Drug badges + actions ── */}
                  {(pDrugs.length > 0 || hasRowActions) && (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Drug pill badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pDrugs.slice(0, 3).map(({ drug }, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 flex items-center gap-1"
                          >
                            <Pill className="w-2.5 h-2.5" /> {drug.name}
                          </span>
                        ))}
                        {pDrugs.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-bold">
                            +{pDrugs.length - 3} more
                          </span>
                        )}
                        {pDrugs.length === 0 && (
                          <span className="text-[10px] text-muted-foreground/50 italic">
                            No prescription
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {hasRowActions && (
                        <div className="flex items-center gap-2 shrink-0">
                          {canOpenDetails && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50 group-hover:border-emerald/30 group-hover:text-emerald transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              {t("details_btn") || "Details"}
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                          {canDelete && !isStaff && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteVisit(visit);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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

      {/* ── Create Visit Form (owner only) ── */}
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
                    "h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold",
                    formik.errors.client_id &&
                      formik.touched.client_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_client")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
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
                    "h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold",
                    formik.errors.pet_id &&
                      formik.touched.pet_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_pet_label")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
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
                    "h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold",
                    formik.errors.doctor_id &&
                      formik.touched.doctor_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_doctor_optional")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
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
                className="h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold"
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
                className="h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold"
              />
            </div>

            {/* Optional Prescription */}
            {clientPrescriptions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-tint/5">
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
                  <SelectTrigger className="h-14 bg-tint/5 border-tint/5 rounded-2xl font-bold">
                    <SelectValue
                      placeholder={
                        t("select_prescription") ||
                        "Link an existing prescription"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                    {clientPrescriptions.map((rx) => {
                      const itemIds =
                        rx.prescriptionItem_ids &&
                        rx.prescriptionItem_ids.length > 0
                          ? rx.prescriptionItem_ids
                          : (
                              rx as { prescriptionItem_id?: string }
                            ).prescriptionItem_id
                              ?.split(",")
                              .map((id) => id.trim())
                              .filter(Boolean) || [];

                      const firstItem = presItemsList.find((pi) =>
                        itemIds.includes(pi.prescriptionItem_id),
                      ) as
                        | ((typeof presItemsList)[number] & {
                            drug_ids?: string[];
                            drug_id?: string;
                          })
                        | undefined;

                      const firstDrugId =
                        firstItem?.drug_ids?.[0] || firstItem?.drug_id;
                      const drug = drugsList.find(
                        (d) => d.drug_id === firstDrugId,
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
