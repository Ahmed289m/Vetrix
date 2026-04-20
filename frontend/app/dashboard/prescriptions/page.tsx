"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Pill,
  Calendar,
  Search,
  Trash2,
  ChevronRight,
  Activity,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { useFormik } from "formik";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Badge } from "@/app/_components/ui/badge";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn } from "@/app/_lib/utils";
import {
  getDateRange,
  type DateRangeFilter,
} from "@/app/_lib/utils/date-filter";

import {
  usePrescriptions,
  useCreatePrescription,
  useDeletePrescription,
} from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import type { Drug, Prescription } from "@/app/_lib/types/models";

type MouseEvent = React.MouseEvent<HTMLDivElement>;

const formatDose = (val: unknown): string => {
  if (!val) return "—";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val).replace(/["{}]/g, "").replace(/:/g, ": ");
    } catch {
      return String(val);
    }
  }
  return String(val);
};

export default function PrescriptionsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<DateRangeFilter>("all");
  const [selectedRx, setSelectedRx] = React.useState<Prescription | null>(null);
  const [selectedPrescriptionIds, setSelectedPrescriptionIds] = React.useState<
    string[]
  >([]);
  const { user } = useAuth();
  const { t } = useLang();

  const isClient = user?.role === "client";
  const canCreate = false;
  const canDeletePrescriptions = !isClient && user?.role !== "staff";

  const { data: rxData, isLoading: rxLoading } = usePrescriptions();
  const { data: rxItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers({ enabled: !isClient });

  const createPrescription = useCreatePrescription();
  const deletePrescription = useDeletePrescription();

  const prescriptions = rxData?.data || [];
  const rxItems = rxItemsData?.data || [];
  const drugs = drugsData?.data || [];
  const pets = petsData?.data || [];
  const clients = isClient
    ? []
    : (usersData?.data || []).filter((u) => u.role === "client");

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getPet = (id: string) => pets.find((p) => p.pet_id === id);
  const getPetName = (id: string) => getPet(id)?.name || "Unknown Pet";
  const getClientName = (id: string) => {
    if (isClient) return user?.fullname || "—";
    return clients.find((c) => c.user_id === id)?.fullname || "Unknown Owner";
  };

  /** Resolve drug info for a prescription via its prescription item */
  const getDrugsForRx = (rx: Prescription): { drug: Drug; dose: string }[] => {
    if (!rx.prescriptionItem_ids?.length) return [];
    const itemIds = rx.prescriptionItem_ids;
    const items = rxItems.filter((i) =>
      itemIds.includes(i.prescriptionItem_id),
    );
    const result: { drug: Drug; dose: string }[] = [];
    items.forEach((item) => {
      (item.drug_ids || []).forEach((drugId) => {
        const drug = drugs.find((d) => d.drug_id === drugId);
        if (drug) {
          result.push({ drug, dose: item.drugDose });
        }
      });
    });
    return result;
  };

  const getPrescriptionDateValue = (rx: Prescription): string | null => {
    const candidate =
      (rx as { created_at?: string }).created_at ||
      (rx as { createdAt?: string }).createdAt ||
      (rx as { date?: string }).date;
    return candidate || null;
  };

  const getPrescriptionDateLabel = (rx: Prescription): string => {
    const raw = getPrescriptionDateValue(rx);
    if (!raw) return "—";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusLabel = (rx: Prescription): string => {
    const normalized = (rx.status || "").toLowerCase();
    return normalized === "active" ? "issued" : rx.status || "issued";
  };

  const getDoseForCase = (
    drug: Drug,
    petId: string,
    fallbackDose?: string,
  ): string => {
    const petType = getPet(petId)?.type;
    if (petType && drug.dosage && typeof drug.dosage === "object") {
      const caseDose = (drug.dosage as Record<string, unknown>)[petType];
      if (caseDose) return formatDose(caseDose);
    }

    if (fallbackDose && fallbackDose !== "See drug info") return fallbackDose;
    return formatDose(drug.dosage);
  };

  // ── Filter / search ───────────────────────────────────────────────────────
  const filteredPrescriptions = React.useMemo(() => {
    const { start, end } = getDateRange(dateFilter);
    const q = searchQuery.trim().toLowerCase();

    return [...prescriptions]
      .filter((rx) => {
        const rawDate = getPrescriptionDateValue(rx);
        if (dateFilter !== "all") {
          if (!rawDate) return false;
          const d = new Date(rawDate);
          if (Number.isNaN(d.getTime()) || d < start || d > end) return false;
        }

        const pDrugs = getDrugsForRx(rx);
        const matchesSearch =
          q.length === 0 ||
          rx.prescription_id.toLowerCase().includes(q) ||
          getPetName(rx.pet_id).toLowerCase().includes(q) ||
          getClientName(rx.client_id).toLowerCase().includes(q) ||
          pDrugs.some(({ drug }) => drug.name.toLowerCase().includes(q));
        return matchesSearch;
      })
      .sort((a, b) => {
        const da = getPrescriptionDateValue(a)
          ? new Date(getPrescriptionDateValue(a) as string).getTime()
          : 0;
        const db = getPrescriptionDateValue(b)
          ? new Date(getPrescriptionDateValue(b) as string).getTime()
          : 0;
        return db - da;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptions, searchQuery, dateFilter, pets, clients, rxItems, drugs]);

  const bulkDeletablePrescriptionIds = React.useMemo(
    () =>
      canDeletePrescriptions
        ? filteredPrescriptions.map((rx) => rx.prescription_id)
        : [],
    [canDeletePrescriptions, filteredPrescriptions],
  );

  React.useEffect(() => {
    const allowed = new Set(bulkDeletablePrescriptionIds);
    setSelectedPrescriptionIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      if (
        next.length === prev.length &&
        next.every((id, index) => id === prev[index])
      ) {
        return prev;
      }
      return next;
    });
  }, [bulkDeletablePrescriptionIds]);

  // ── Form ─────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: {
      client_id: "",
      pet_id: "",
      drug_ids: [] as string[],
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.client_id) errors.client_id = "Select a client";
      if (!values.pet_id) errors.pet_id = "Select a pet";
      if (!values.drug_ids?.length)
        errors.drug_ids = "Select at least one drug";
      return errors;
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      createPrescription.mutate(
        {
          client_id: values.client_id,
          pet_id: values.pet_id,
          item_drug_ids: [values.drug_ids],
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            resetForm();
            setSubmitting(false);
          },
          onError: () => {
            setSubmitting(false);
          },
        },
      );
    },
  });

  const clientPets = pets.filter(
    (p) => p.client_id === formik.values.client_id,
  );
  const selectedDrugInForm = formik.values.drug_ids.length
    ? drugs.find((d) => d.drug_id === formik.values.drug_ids[0])
    : undefined;

  const handleOpenForm = () => {
    formik.resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(t("confirm_revoke_prescription") || "Revoke this prescription?")
    ) {
      deletePrescription.mutate(id, {
        onSuccess: () => {
          setSelectedPrescriptionIds((prev) =>
            prev.filter((rxId) => rxId !== id),
          );
        },
      });
    }
  };

  const togglePrescriptionSelection = (prescriptionId: string) => {
    setSelectedPrescriptionIds((prev) =>
      prev.includes(prescriptionId)
        ? prev.filter((id) => id !== prescriptionId)
        : [...prev, prescriptionId],
    );
  };

  const toggleSelectAllPrescriptions = () => {
    setSelectedPrescriptionIds((prev) =>
      prev.length === bulkDeletablePrescriptionIds.length
        ? []
        : bulkDeletablePrescriptionIds,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPrescriptionIds.length === 0) return;
    const count = selectedPrescriptionIds.length;
    if (
      !confirm(`Revoke ${count} selected prescription${count > 1 ? "s" : ""}?`)
    ) {
      return;
    }

    const ids = [...selectedPrescriptionIds];
    const results = await Promise.allSettled(
      ids.map((id) => deletePrescription.mutateAsync(id)),
    );

    const failedIds: string[] = [];
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        failedIds.push(ids[index]);
      }
    });

    setSelectedPrescriptionIds(failedIds);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("pharmacy_portal")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("medical_prescriptions")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isClient
              ? t("your_medication_history") || "Your medication prescriptions"
              : t("review_medication_history")}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={handleOpenForm}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("new_prescription_btn")}
          </Button>
        )}
      </div>

      {/* CLIENT: card-based layout for better UX */}
      {isClient ? (
        <ClientPrescriptionView
          prescriptions={filteredPrescriptions}
          rxData={rxData}
          rxLoading={rxLoading}
          getDrugsForRx={getDrugsForRx}
          getPetName={getPetName}
          getDoseForCase={getDoseForCase}
          getStatusLabel={getStatusLabel}
          getPrescriptionDateLabel={getPrescriptionDateLabel}
          onViewDetails={(rx) => {
            setSelectedRx(rx);
          }}
          t={t}
        />
      ) : (
        <>
          {/* Staff filters + table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                placeholder={t("search_prescriptions")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(v) => setDateFilter(v as DateRangeFilter)}
            >
              <SelectTrigger className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5">
                <SelectItem value="today">{t("today_filter")}</SelectItem>
                <SelectItem value="week">{t("this_week")}</SelectItem>
                <SelectItem value="month">{t("this_month")}</SelectItem>
                <SelectItem value="all">{t("all_time")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canDeletePrescriptions &&
            bulkDeletablePrescriptionIds.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {selectedPrescriptionIds.length} selected
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleSelectAllPrescriptions}
                    className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
                  >
                    {selectedPrescriptionIds.length ===
                    bulkDeletablePrescriptionIds.length
                      ? "Clear selection"
                      : "Select all"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleBulkDelete();
                    }}
                    disabled={
                      selectedPrescriptionIds.length === 0 ||
                      deletePrescription.isPending
                    }
                    className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    Delete selected
                  </Button>
                </div>
              </div>
            )}

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-tint/5 backdrop-blur-md rounded-3xl border border-tint/5 overflow-x-auto shadow-2xl">
              <Table>
                <TableHeader className="bg-tint/5">
                  <TableRow className="border-b border-tint/5 hover:bg-transparent">
                    {canDeletePrescriptions && (
                      <TableHead className="py-6 px-4 w-12">
                        <Checkbox
                          checked={
                            bulkDeletablePrescriptionIds.length > 0 &&
                            selectedPrescriptionIds.length ===
                              bulkDeletablePrescriptionIds.length
                          }
                          onCheckedChange={toggleSelectAllPrescriptions}
                          className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                          aria-label="Select all prescriptions"
                        />
                      </TableHead>
                    )}
                    <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                      {t("rx_id_patient")}
                    </TableHead>
                    <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                      {t("primary_medication")}
                    </TableHead>
                    <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                      Owner
                    </TableHead>
                    <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                      {t("date_label") || "Date"}
                    </TableHead>
                    <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                      Status
                    </TableHead>
                    <TableHead className="py-6 px-8 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rxLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canDeletePrescriptions ? 7 : 6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("loading_prescriptions_text")}
                      </TableCell>
                    </TableRow>
                  ) : filteredPrescriptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canDeletePrescriptions ? 7 : 6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("no_prescriptions_found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrescriptions.map((rx) => {
                      const pDrugs = getDrugsForRx(rx);
                      const isSelected = selectedPrescriptionIds.includes(
                        rx.prescription_id,
                      );
                      return (
                        <TableRow
                          key={rx.prescription_id}
                          className="border-b border-tint/5 hover:bg-tint/5 transition-colors group/row cursor-pointer"
                          onClick={() => {
                            setSelectedRx(rx);
                          }}
                        >
                          {canDeletePrescriptions && (
                            <TableCell
                              className="py-6 px-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  togglePrescriptionSelection(
                                    rx.prescription_id,
                                  )
                                }
                                className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                                aria-label="Select prescription"
                              />
                            </TableCell>
                          )}
                          <TableCell className="py-6 px-8">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md uppercase">
                                RX-{rx.prescription_id.slice(0, 6)}
                              </span>
                              <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                                {getPetName(rx.pet_id)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-emerald shrink-0" />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                                  {pDrugs.length > 0
                                    ? pDrugs.length === 1
                                      ? pDrugs[0].drug.name
                                      : `${pDrugs[0].drug.name} + ${pDrugs.length - 1} more`
                                    : "Unknown Drug"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {pDrugs.length > 0
                                    ? pDrugs[0].drug.drugClass
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <span className="text-sm font-bold text-muted-foreground/80">
                              {getClientName(rx.client_id)}
                            </span>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <span className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {getPrescriptionDateLabel(rx)}
                            </span>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <Badge
                              className={cn(
                                "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                getStatusLabel(rx).toLowerCase() === "issued"
                                  ? "bg-emerald/10 text-emerald"
                                  : "bg-orange-500/10 text-orange-400",
                              )}
                            >
                              {getStatusLabel(rx)}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="py-6 px-8 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="group-hover/row:bg-tint/10 rounded-xl h-10 w-10"
                                >
                                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-44 shadow-2xl"
                              >
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                                  {t("pharmacy_actions")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => setSelectedRx(rx)}
                                  className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4" />{" "}
                                  {t("view_details") || "View Details"}
                                </DropdownMenuItem>
                                {user?.role !== "staff" && (
                                  <>
                                    <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDelete(rx.prescription_id)
                                      }
                                      className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />{" "}
                                      {t("revoke")}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedRx(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              className="glass-card p-6 sm:p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl rounded-3xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/10 px-2 py-0.5 rounded-md uppercase">
                    RX-{selectedRx.prescription_id.slice(0, 8)}
                  </span>
                  <h3 className="text-xl font-black mt-2">
                    Prescription Details
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getPetName(selectedRx.pet_id)} ·{" "}
                    {getClientName(selectedRx.client_id)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRx(null);
                  }}
                  className="p-2 rounded-full hover:bg-tint/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drug Info Cards */}
              {(() => {
                const rxDrugs = getDrugsForRx(selectedRx);
                if (rxDrugs.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 text-sm text-muted-foreground">
                      Drug details not found for this prescription.
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" /> Prescribed Medications (
                      {rxDrugs.length})
                    </p>

                    {rxDrugs.map(({ drug, dose }, idx) => (
                      <div
                        key={idx}
                        className="space-y-4 border border-emerald/10 rounded-2xl p-4 bg-emerald/5"
                      >
                        <div className="flex items-center gap-3 rounded-2xl">
                          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                            <Pill className="w-5 h-5 text-emerald" />
                          </div>
                          <div>
                            <p className="font-black text-foreground">
                              {drug.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {drug.drugClass}
                            </p>
                          </div>
                          <Badge className="ml-auto rounded-full px-3 py-1 text-[10px] font-black uppercase bg-emerald/10 text-emerald border-none">
                            {getStatusLabel(selectedRx)}
                          </Badge>
                        </div>

                        {/* Dosage */}
                        <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" /> Dosage for{" "}
                            {getPet(selectedRx.pet_id)?.type || "case"}
                          </p>
                          <p className="text-sm font-bold text-emerald">
                            {getDoseForCase(drug, selectedRx.pet_id, dose)}
                          </p>
                        </div>

                        {/* Indications */}
                        {drug.indications?.length > 0 && (
                          <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> Indications
                            </p>
                            <ul className="space-y-1">
                              {drug.indications.map((ind, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-foreground/80 flex items-start gap-2"
                                >
                                  <ChevronRight className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                                  {ind}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Side Effects */}
                        {drug.sideEffects?.length > 0 && (
                          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" /> Side
                              Effects
                            </p>
                            <ul className="space-y-1">
                              {drug.sideEffects.map((se, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-foreground/80 flex items-start gap-2"
                                >
                                  <ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                                  {se}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Prescription Form (staff only) */}
      {canCreate && (
        <DashboardForm
          title={t("issue_prescription")}
          description={
            t("select_drug_auto_dose") ||
            "Select client, pet, and drug — dosage is auto-filled from the drug record"
          }
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={(e) =>
            formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
          }
          submitLabel={formik.isSubmitting ? t("generating") : t("generate_rx")}
        >
          <div className="space-y-5">
            {/* Client */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("select_client")} *
              </Label>
              <Select
                value={formik.values.client_id}
                onValueChange={(val) => {
                  formik.setFieldValue("client_id", val);
                  formik.setFieldValue("pet_id", "");
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
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
                    "h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
                    formik.errors.pet_id &&
                      formik.touched.pet_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_pet_label")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  {clientPets.map((p) => (
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

            {/* Drug — no manual dose entry */}
            <div className="space-y-2 pt-2 border-t border-tint/5">
              <Label className="text-xs font-black uppercase tracking-widest text-emerald ml-1 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />{" "}
                {t("select_drug") || "Select Drug"} *
              </Label>
              <Select
                value={formik.values.drug_ids[0] || ""}
                onValueChange={(val) =>
                  formik.setFieldValue("drug_ids", val ? [val] : [])
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
                    formik.errors.drug_ids && "border-red-500/50",
                  )}
                >
                  <SelectValue
                    placeholder={
                      t("search_drug") || "Choose a drug from formulary"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  {drugs.map((d) => (
                    <SelectItem
                      key={d.drug_id}
                      value={d.drug_id}
                      className="rounded-xl font-bold"
                    >
                      {d.name}
                      <span className="ml-2 text-muted-foreground font-normal text-xs">
                        · {d.drugClass}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Live drug preview */}
              {selectedDrugInForm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-emerald/5 border border-emerald/10 space-y-3"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-emerald">
                    Drug Info • Auto-filled
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(selectedDrugInForm.dosage || {}).map(
                      ([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {k}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatDose(v)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  {selectedDrugInForm.indications?.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-bold">Indications: </span>
                      {selectedDrugInForm.indications.slice(0, 2).join(", ")}
                      {selectedDrugInForm.indications.length > 2 && " ..."}
                    </p>
                  )}
                </motion.div>
              )}
              <p className="px-2 pt-1 text-[10px] font-black text-muted-foreground/40 italic uppercase tracking-widest">
                {t("dosage_auto_from_drug") ||
                  "Dosage is pulled automatically from the drug formulary — no manual entry needed"}
              </p>
            </div>
          </div>
        </DashboardForm>
      )}
    </div>
  );
}

function ClientPrescriptionView({
  prescriptions,
  rxData,
  rxLoading,
  getDrugsForRx,
  getPetName,
  getDoseForCase,
  getStatusLabel,
  getPrescriptionDateLabel,
  onViewDetails,
  t,
}: {
  prescriptions: Prescription[];
  rxData: unknown;
  rxLoading: boolean;
  getDrugsForRx: (rx: Prescription) => { drug: Drug; dose: string }[];
  getPetName: (id: string) => string;
  getDoseForCase: (drug: Drug, petId: string, fallbackDose?: string) => string;
  getStatusLabel: (rx: Prescription) => string;
  getPrescriptionDateLabel: (rx: Prescription) => string;
  onViewDetails: (rx: Prescription) => void;
  t: (key: string) => string;
}) {
  void rxData;
  if (rxLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("loading_prescriptions_text")}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center">
          <Pill className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-medium">
          {t("no_prescriptions_found")}
        </p>
        <p className="text-sm text-muted-foreground/60">
          {t("no_prescriptions_client_hint") ||
            "Your prescription history will appear here after a clinic visit."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prescriptions.map((rx, i) => {
        const pDrugs = getDrugsForRx(rx);
        return (
          <motion.div
            key={rx.prescription_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5 space-y-4 cursor-pointer hover:border-emerald/20 transition-all"
            onClick={() => onViewDetails(rx)}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/10 px-2 py-0.5 rounded-md uppercase">
                RX-{rx.prescription_id.slice(0, 6)}
              </span>
              <Badge
                className={cn(
                  "rounded-full px-3 text-[10px] font-black uppercase border-none",
                  getStatusLabel(rx).toLowerCase() === "issued"
                    ? "bg-emerald/10 text-emerald"
                    : "bg-orange-500/10 text-orange-400",
                )}
              >
                {getStatusLabel(rx)}
              </Badge>
            </div>

            {/* Drugs snippet */}
            {pDrugs.slice(0, 2).map(({ drug, dose }, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-emerald" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-foreground truncate">
                    {drug.name}
                  </p>
                  <p className="text-xs text-emerald truncate">
                    Dose: {getDoseForCase(drug, rx.pet_id, dose)}
                  </p>
                </div>
              </div>
            ))}
            {pDrugs.length > 2 && (
              <p className="text-xs text-muted-foreground font-bold pl-2">
                +{pDrugs.length - 2} more medications
              </p>
            )}

            {/* Footer */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">🐾 {getPetName(rx.pet_id)}</span>
                <span className="font-semibold shrink-0 ml-2">
                  {getPrescriptionDateLabel(rx)}
                </span>
              </div>
              <div className="flex items-center justify-end">
                <button className="flex items-center gap-1 text-xs font-bold text-emerald hover:underline">
                  Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
