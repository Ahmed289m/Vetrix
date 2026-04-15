"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Pill,
  Search,
  Trash2,
  ChevronRight,
  Activity,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { useFormik } from "formik";
import { toast } from "sonner";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
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

const formatDose = (val: any): string => {
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
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedRx, setSelectedRx] = React.useState<Prescription | null>(null);
  const [selectedDrug, setSelectedDrug] = React.useState<Drug | null>(null);
  const { user } = useAuth();
  const { t } = useLang();

  const isClient = user?.role === "client";
  const canCreate = user?.role === "doctor" || user?.role === "owner" || user?.role === "admin";

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
  const clients = isClient ? [] : (usersData?.data || []).filter((u) => u.role === "client");

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getPet = (id: string) => pets.find((p) => p.pet_id === id);
  const getPetName = (id: string) => getPet(id)?.name || "Unknown Pet";
  const getClientName = (id: string) => {
    if (isClient) return user?.fullname || "—";
    return clients.find((c) => c.user_id === id)?.fullname || "Unknown Owner";
  };

  /** Resolve drug info for a prescription via its prescription item */
  const getDrugForRx = (rx: Prescription): Drug | undefined => {
    const item = rxItems.find((i) => i.prescriptionItem_id === rx.prescriptionItem_id);
    if (!item) return undefined;
    return drugs.find((d) => d.drug_id === item.drug_id);
  };

  const getDrugDose = (rx: Prescription): string => {
    const item = rxItems.find((i) => i.prescriptionItem_id === rx.prescriptionItem_id);
    return item?.drugDose || "—";
  };

  // ── Filter / search ───────────────────────────────────────────────────────
  const filteredPrescriptions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return prescriptions.filter((rx) => {
      const effectiveStatus = (rx.status || "active").toLowerCase();
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
      const drug = getDrugForRx(rx);
      const matchesSearch =
        q.length === 0 ||
        rx.prescription_id.toLowerCase().includes(q) ||
        getPetName(rx.pet_id).toLowerCase().includes(q) ||
        getClientName(rx.client_id).toLowerCase().includes(q) ||
        (drug?.name || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptions, searchQuery, statusFilter, pets, clients, rxItems, drugs]);

  // ── Form ─────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: {
      client_id: "",
      pet_id: "",
      drug_id: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.client_id) errors.client_id = "Select a client";
      if (!values.pet_id) errors.pet_id = "Select a pet";
      if (!values.drug_id) errors.drug_id = "Select a drug";
      return errors;
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      createPrescription.mutate(
        { client_id: values.client_id, pet_id: values.pet_id, drug_id: values.drug_id },
        {
          onSuccess: () => {
            toast.success(t("prescription_created_success") || "Prescription issued successfully.");
            setIsFormOpen(false);
            resetForm();
            setSubmitting(false);
          },
          onError: (err: unknown) => {
            const msg =
              (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("prescription_create_failed") || "Failed to issue prescription.";
            toast.error(msg);
            setSubmitting(false);
          },
        },
      );
    },
  });

  const clientPets = pets.filter((p) => p.client_id === formik.values.client_id);
  const selectedDrugInForm = drugs.find((d) => d.drug_id === formik.values.drug_id);

  const handleOpenForm = () => {
    formik.resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirm_revoke_prescription") || "Revoke this prescription?")) {
      deletePrescription.mutate(id, {
        onSuccess: () => toast.success(t("prescription_revoked") || "Prescription revoked."),
        onError: () => toast.error(t("prescription_revoke_failed") || "Failed to revoke."),
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          getDrugForRx={getDrugForRx}
          getDrugDose={getDrugDose}
          getPetName={getPetName}
          onViewDetails={(rx) => {
            setSelectedRx(rx);
            setSelectedDrug(getDrugForRx(rx) || null);
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
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
                <SelectItem value="all">{t("all_prescriptions")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 overflow-x-auto shadow-2xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
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
                      Status
                    </TableHead>
                    <TableHead className="py-6 px-8 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rxLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t("loading_prescriptions_text")}
                      </TableCell>
                    </TableRow>
                  ) : filteredPrescriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t("no_prescriptions_found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrescriptions.map((rx) => {
                      const drug = getDrugForRx(rx);
                      return (
                        <TableRow
                          key={rx.prescription_id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors group/row cursor-pointer"
                          onClick={() => { setSelectedRx(rx); setSelectedDrug(drug || null); }}
                        >
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
                                  {drug?.name || "Unknown Drug"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {drug?.drugClass || ""}
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
                            <Badge
                              className={cn(
                                "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                (rx.status || "active") === "active"
                                  ? "bg-emerald/10 text-emerald"
                                  : "bg-orange-500/10 text-orange-400",
                              )}
                            >
                              {rx.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="group-hover/row:bg-white/10 rounded-xl h-10 w-10"
                                >
                                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-44 shadow-2xl"
                              >
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                                  {t("pharmacy_actions")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => { setSelectedRx(rx); setSelectedDrug(drug || null); }}
                                  className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4" /> {t("view_details") || "View Details"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(rx.prescription_id)}
                                  className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> {t("revoke")}
                                </DropdownMenuItem>
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
            onClick={() => { setSelectedRx(null); setSelectedDrug(null); }}
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
                  <h3 className="text-xl font-black mt-2">Prescription Details</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getPetName(selectedRx.pet_id)} · {getClientName(selectedRx.client_id)}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedRx(null); setSelectedDrug(null); }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drug Info Card */}
              {selectedDrug ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald/5 border border-emerald/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 text-emerald" />
                    </div>
                    <div>
                      <p className="font-black text-foreground">{selectedDrug.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedDrug.drugClass}</p>
                    </div>
                    <Badge className="ml-auto rounded-full px-3 py-1 text-[10px] font-black uppercase bg-emerald/10 text-emerald border-none">
                      {selectedRx.status || "active"}
                    </Badge>
                  </div>

                  {/* Dosage */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Dosage
                    </p>
                    <div className="space-y-1">
                      {Object.entries(selectedDrug.dosage || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{k}</span>
                          <span className="font-bold text-emerald">{formatDose(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Indications */}
                  {selectedDrug.indications?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Indications
                      </p>
                      <ul className="space-y-1">
                        {selectedDrug.indications.map((ind, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Side Effects */}
                  {selectedDrug.sideEffects?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Side Effects
                      </p>
                      <ul className="space-y-1">
                        {selectedDrug.sideEffects.map((se, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                            {se}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-muted-foreground">
                  Drug details not found for this prescription.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Prescription Form (staff only) */}
      {canCreate && (
        <DashboardForm
          title={t("issue_prescription")}
          description={t("select_drug_auto_dose") || "Select client, pet, and drug — dosage is auto-filled from the drug record"}
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={(e) => formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)}
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
                <SelectTrigger className={cn("h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold", formik.errors.client_id && formik.touched.client_id && "border-red-500/50")}>
                  <SelectValue placeholder={t("select_client")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {clients.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id} className="rounded-xl font-bold">
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
                <SelectTrigger className={cn("h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold", formik.errors.pet_id && formik.touched.pet_id && "border-red-500/50")}>
                  <SelectValue placeholder={t("select_pet_label")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {clientPets.map((p) => (
                    <SelectItem key={p.pet_id} value={p.pet_id} className="rounded-xl font-bold">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drug — no manual dose entry */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label className="text-xs font-black uppercase tracking-widest text-emerald ml-1 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> {t("select_drug") || "Select Drug"} *
              </Label>
              <Select
                value={formik.values.drug_id}
                onValueChange={(val) => formik.setFieldValue("drug_id", val)}
              >
                <SelectTrigger className={cn("h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold", formik.errors.drug_id && formik.touched.drug_id && "border-red-500/50")}>
                  <SelectValue placeholder={t("search_drug") || "Choose a drug from formulary"} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {drugs.map((d) => (
                    <SelectItem key={d.drug_id} value={d.drug_id} className="rounded-xl font-bold">
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
                    {Object.entries(selectedDrugInForm.dosage || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{k}</span>
                        <span className="font-bold text-foreground">{formatDose(v)}</span>
                      </div>
                    ))}
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
                {t("dosage_auto_from_drug") || "Dosage is pulled automatically from the drug formulary — no manual entry needed"}
              </p>
            </div>
          </div>
        </DashboardForm>
      )}
    </div>
  );
}

// ── CLIENT card view component ─────────────────────────────────────────────

function ClientPrescriptionView({
  prescriptions,
  rxData,
  rxLoading,
  getDrugForRx,
  getDrugDose,
  getPetName,
  onViewDetails,
  t,
}: {
  prescriptions: Prescription[];
  rxData: unknown;
  rxLoading: boolean;
  getDrugForRx: (rx: Prescription) => Drug | undefined;
  getDrugDose: (rx: Prescription) => string;
  getPetName: (id: string) => string;
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
        <p className="text-muted-foreground font-medium">{t("no_prescriptions_found")}</p>
        <p className="text-sm text-muted-foreground/60">
          {t("no_prescriptions_client_hint") || "Your prescription history will appear here after a clinic visit."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prescriptions.map((rx, i) => {
        const drug = getDrugForRx(rx);
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
                  (rx.status || "active") === "active"
                    ? "bg-emerald/10 text-emerald"
                    : "bg-orange-500/10 text-orange-400",
                )}
              >
                {rx.status || "active"}
              </Badge>
            </div>

            {/* Drug name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-emerald" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-foreground truncate">{drug?.name || "Unknown Drug"}</p>
                <p className="text-xs text-muted-foreground truncate">{drug?.drugClass || "—"}</p>
              </div>
            </div>

            {/* Dosage snippet */}
            {drug?.dosage && Object.keys(drug.dosage).length > 0 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-1.5">Dosage</p>
                <div className="space-y-0.5">
                  {Object.entries(drug.dosage).slice(0, 2).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span className="font-bold text-emerald">{formatDose(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                🐾 {getPetName(rx.pet_id)}
              </span>
              <button className="flex items-center gap-1 text-xs font-bold text-emerald hover:underline">
                Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
