"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Pill,
  Search,
  Download,
  Trash2,
} from "lucide-react";
import { useFormik } from "formik";
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

export default function PrescriptionsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const { user } = useAuth();
  const { t } = useLang();

  const { data: rxData, isLoading: rxLoading } = usePrescriptions();
  const { data: rxItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();

  const createPrescription = useCreatePrescription();
  const deletePrescription = useDeletePrescription();

  const prescriptions = rxData?.data || [];
  const rxItems = rxItemsData?.data || [];
  const drugs = drugsData?.data || [];
  const pets = petsData?.data || [];
  const clients = (usersData?.data || []).filter((u) => u.role === "client");

  const formik = useFormik({
    initialValues: {
      client_id: "",
      pet_id: "",
      prescriptionItem_id: "",
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      createPrescription.mutate(values, {
        onSuccess: () => {
          setIsFormOpen(false);
          setSubmitting(false);
          resetForm();
        },
        onError: () => setSubmitting(false),
      });
    },
  });

  const getPetName = (id: string) =>
    pets.find((p) => p.pet_id === id)?.name || "Unknown Pet";
  const getClientName = (id: string) =>
    clients.find((c) => c.user_id === id)?.fullname || "Unknown Owner";
  const getMedicationText = (rxItemId: string) => {
    const rxItem = rxItems.find((r) => r.prescriptionItem_id === rxItemId);
    if (!rxItem) return "Unknown Formulation";
    const drug = drugs.find((d) => d.drug_id === rxItem.drug_id);
    return `${drug?.name || "Unknown Drug"} (${rxItem.drugDose})`;
  };

  const filteredPrescriptions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return prescriptions.filter((rx) => {
      const effectiveStatus = (rx.status || "active").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || effectiveStatus === statusFilter;
      const matchesSearch =
        q.length === 0 ||
        rx.prescription_id.toLowerCase().includes(q) ||
        getPetName(rx.pet_id).toLowerCase().includes(q) ||
        getClientName(rx.client_id).toLowerCase().includes(q) ||
        getMedicationText(rx.prescriptionItem_id).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [prescriptions, searchQuery, statusFilter, pets, clients, rxItems, drugs]);

  const handleOpenForm = () => {
    formik.resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Revoke this prescription?")) {
      deletePrescription.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("pharmacy_portal")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("medical_prescriptions")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("review_medication_history")}
          </p>
        </div>
        {user?.role !== "staff" && (
          <Button
            onClick={handleOpenForm}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("new_prescription_btn")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_prescriptions")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
            <SelectItem value="all">{t("all_prescriptions")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl sm:rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-muted/40 backdrop-blur-md rounded-3xl sm:rounded-4xl border border-border/10 overflow-x-auto shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/10 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("rx_id_patient")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("primary_medication")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Details
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rxLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("loading_prescriptions_text")}
                  </TableCell>
                </TableRow>
              ) : filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_prescriptions_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <TableRow
                    key={rx.prescription_id}
                    className="border-b border-border/10 hover:bg-muted/40 transition-colors group/row"
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
                        <Pill className="w-4 h-4 text-emerald" />
                        <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                          {getMedicationText(rx.prescriptionItem_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-muted-foreground/80 leading-none">
                         {t("owner_label")} {getClientName(rx.client_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge
                        className={
                          (rx.status || "active") === "active"
                            ? "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none bg-emerald/10 text-emerald"
                            : "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none bg-orange-500/10 text-orange-400"
                        }
                      >
                        {rx.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group-hover/row:bg-muted/50 rounded-xl h-10 w-10"
                          >
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover/95 backdrop-blur-xl border-border/10 rounded-2xl p-2 w-56 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                            {t("pharmacy_actions")}
                          </DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                            <Download className="w-4 h-4" /> {t("export_pdf")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-muted/40 mx-2" />
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DashboardForm
        title={t("issue_prescription")}
        description={t("select_formulation")}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={formik.isSubmitting ? t("generating") : t("generate_rx")}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("select_client")}
            </Label>
            <Select
              value={formik.values.client_id}
              onValueChange={(val) => formik.setFieldValue("client_id", val)}
            >
              <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
                <SelectValue placeholder={t("select_client")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
                {clients.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("select_pet_label")}
            </Label>
            <Select
              value={formik.values.pet_id}
              onValueChange={(val) => formik.setFieldValue("pet_id", val)}
              disabled={!formik.values.client_id}
            >
              <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
                <SelectValue placeholder={t("select_pet_label")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
                {pets
                  .filter((p) => p.client_id === formik.values.client_id)
                  .map((p) => (
                    <SelectItem key={p.pet_id} value={p.pet_id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/10">
            <Label className="text-sm font-black uppercase tracking-widest text-emerald ml-1">
              {t("medication_formulation")}
            </Label>
            <Select
              value={formik.values.prescriptionItem_id}
              onValueChange={(val) =>
                formik.setFieldValue("prescriptionItem_id", val)
              }
            >
              <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold mt-2">
                <SelectValue placeholder={t("select_existing_formulation")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
                {rxItems.map((item) => {
                  const drug = drugs.find((d) => d.drug_id === item.drug_id);
                  return (
                    <SelectItem
                      key={item.prescriptionItem_id}
                      value={item.prescriptionItem_id}
                    >
                      {drug?.name || "Unknown Drug"} - {item.drugDose}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="px-2 pt-2 text-[10px] font-black text-muted-foreground/40 italic flex items-center gap-1.5 uppercase tracking-widest">
              {t("define_drugs_notice")}
            </p>
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
