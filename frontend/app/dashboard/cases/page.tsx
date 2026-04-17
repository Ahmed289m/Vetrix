"use client";

import * as React from "react";
import { Plus, MoreHorizontal, Hash, Search, Calendar } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useVisits, useDeleteVisit } from "@/app/_hooks/queries/use-visits";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import {
  usePrescriptions,
  useDeletePrescription,
} from "@/app/_hooks/queries/use-prescriptions";
import { usePrescriptionItems } from "@/app/_hooks/queries/use-prescription-items";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import { VisitDetailModal } from "@/app/dashboard/_components/VisitDetailModal";
import type {
  Visit,
  Drug,
  Pet,
  User as UserModel,
  Prescription,
  PrescriptionItem,
} from "@/app/_lib/types/models";
import { toast } from "sonner";

type CaseItem = {
  id: string;
  patientName: string;
  ownerName: string;
  doctorName: string;
  reason: string;
  date: string;
  status: string;
  originalVisit: Visit;
};

const getErrorDetail = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeErr = error as { response?: { data?: { detail?: string } } };
  return maybeErr.response?.data?.detail || fallback;
};

export default function CasesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseItem | null>(null);
  const [selectedVisitDetails, setSelectedVisitDetails] =
    React.useState<Visit | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [doctorFilter, setDoctorFilter] = React.useState("all");
  const { user } = useAuth();
  const { t } = useLang();

  // Fetch real data
  const { data: visitsData } = useVisits();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();
  const { data: prescriptionsData } = usePrescriptions();
  const { data: presItemsData } = usePrescriptionItems();
  const { data: drugsData } = useDrugs();
  const deleteVisit = useDeleteVisit();
  const deletePrescription = useDeletePrescription();

  // Convert visits to case items and sort by date
  const cases: CaseItem[] = React.useMemo(() => {
    const visits: Visit[] = visitsData?.data ?? [];
    const pets: Pet[] = petsData?.data ?? [];
    const users: UserModel[] = usersData?.data ?? [];

    return visits
      .map((visit) => {
        const pet = pets.find((p) => p.pet_id === visit.pet_id);
        const doctor = users.find((u) => u.user_id === visit.doctor_id);
        const owner = pets.find((p) => p.pet_id === visit.pet_id)?.owner_id;
        const ownerUser = users.find((u) => u.user_id === owner);

        return {
          id: visit.visit_id,
          patientName: pet?.name || "Unknown",
          ownerName: ownerUser?.fullname || "Unknown",
          doctorName: visit.doctor_name || doctor?.fullname || "Unknown",
          reason: (visit as { reason?: string }).reason || "Clinical Visit",
          date: visit.date || new Date().toISOString(),
          status: "Completed",
          originalVisit: visit,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visitsData, petsData, usersData]);

  const prescriptionsList: Prescription[] = prescriptionsData?.data ?? [];
  const presItemsList: PrescriptionItem[] = presItemsData?.data ?? [];
  const drugsList: Drug[] = drugsData?.data ?? [];
  const petsList: Pet[] = petsData?.data ?? [];
  const usersList: UserModel[] = usersData?.data ?? [];

  const getPet = (id: string) => petsList.find((p) => p.pet_id === id);
  const getUser = (id: string) => usersList.find((u) => u.user_id === id);

  const getDrugsForVisit = (visit: Visit): { drug: Drug; dose: string }[] => {
    if (!visit.prescription_id) return [];
    const rx = prescriptionsList.find(
      (p) => p.prescription_id === visit.prescription_id,
    );
    if (!rx || !rx.prescriptionItem_ids?.length) return [];

    const itemIds = rx.prescriptionItem_ids;
    const items = presItemsList.filter((pi) =>
      itemIds.includes(pi.prescriptionItem_id),
    );

    const result: { drug: Drug; dose: string }[] = [];
    items.forEach((item) => {
      (item.drug_ids || []).forEach((drugId: string) => {
        const drug = drugsList.find((d) => d.drug_id === drugId);
        if (drug) {
          result.push({ drug, dose: item.drugDose });
        }
      });
    });

    return result;
  };

  const doctors = React.useMemo(() => {
    const users: UserModel[] = usersData?.data ?? [];
    return users.filter((u) => u.role === "doctor");
  }, [usersData]);

  const filteredCases = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cases.filter((caseItem) => {
      const matchesDoctor =
        doctorFilter === "all" || caseItem.doctorName === doctorFilter;
      const matchesSearch =
        q.length === 0 ||
        caseItem.id.toLowerCase().includes(q) ||
        caseItem.patientName.toLowerCase().includes(q) ||
        caseItem.ownerName.toLowerCase().includes(q) ||
        caseItem.reason.toLowerCase().includes(q);
      return matchesDoctor && matchesSearch;
    });
  }, [cases, searchQuery, doctorFilter]);

  const handleOpenForm = (caseItem: CaseItem | null = null) => {
    setSelectedCase(caseItem);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormOpen(false);
  };

  const clients = React.useMemo(() => {
    const allUsers: UserModel[] = usersData?.data ?? [];
    return allUsers.filter((u) => u.role === "client");
  }, [usersData]);

  const canDeleteCaseVisit = user?.role === "doctor" || user?.role === "owner";
  const canOpenVisitDetails = user?.role === "admin";

  const handleDeleteCaseVisit = async (visit: Visit) => {
    if (!confirm(t("confirm_delete_patient"))) return;
    try {
      if (visit.prescription_id) {
        await deletePrescription.mutateAsync(visit.prescription_id);
      }
      await deleteVisit.mutateAsync(visit.visit_id);
      toast.success("Visit deleted.");
      if (selectedVisitDetails?.visit_id === visit.visit_id) {
        setSelectedVisitDetails(null);
      }
    } catch (err: unknown) {
      toast.error(getErrorDetail(err, "Failed to delete visit."));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("clinical_tracker")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("visits_and_cases_title")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("monitor_cases")}
          </p>
        </div>
        {user?.role === "doctor" && (
          <Button
            onClick={() => handleOpenForm()}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("create_new_case")}
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_cases_page")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">{t("all_doctors")}</SelectItem>
            {doctors.map((doc) => (
              <SelectItem key={doc.user_id} value={doc.fullname}>
                {doc.fullname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl sm:rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-3xl sm:rounded-4xl border border-white/5 overflow-x-auto shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("case_id_patient")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("reason_doctor")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("visit_date")}
                </TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_cases_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors group/row ${
                      canOpenVisitDetails ? "cursor-pointer" : "cursor-default"
                    }`}
                    onClick={() => {
                      if (canOpenVisitDetails) {
                        setSelectedVisitDetails(caseItem.originalVisit);
                      }
                    }}
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md">
                          {caseItem.id}
                        </span>
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                          {caseItem.patientName}
                          <span className="text-muted-foreground/50 font-medium text-xs ml-1.5">
                            ({t("owner_label")} {caseItem.ownerName})
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground/80 leading-none">
                          {caseItem.reason}
                        </span>
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {t("assigned_label")} {caseItem.doctorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-sm font-bold text-muted-foreground/80">
                          {new Date(caseItem.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      {canDeleteCaseVisit && (
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
                            className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-56 shadow-2xl"
                          >
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                              {t("case_operations")}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                void handleDeleteCaseVisit(
                                  caseItem.originalVisit,
                                )
                              }
                              className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                            >
                              {t("delete_record_btn")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CRUD Form */}
      <DashboardForm
        title={selectedCase ? t("update_clinical_case") : t("register_visit")}
        description={
          selectedCase
            ? `${t("updating_records")} ${selectedCase.id}`
            : t("provide_diagnosis")
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel={selectedCase ? t("save_case_profile") : t("open_case")}
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("client_id_label")}
              </Label>
              <Select>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold">
                  <SelectValue
                    placeholder={t("select_client") || "Select Client"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {clients.map((doc) => (
                    <SelectItem
                      key={doc.user_id}
                      value={doc.user_id}
                      className="rounded-xl font-bold"
                    >
                      {doc.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("pet_id_label")}
              </Label>
              <Select>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold">
                  <SelectValue
                    placeholder={t("select_pet_label") || "Select Pet"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {petsList.map((p) => (
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
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("doctor_id_label")}
              </Label>
              <Select>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold">
                  <SelectValue
                    placeholder={t("assign_doctor") || "Assign Doctor"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  {doctors.map((doc) => (
                    <SelectItem
                      key={doc.user_id}
                      value={doc.user_id}
                      className="rounded-xl font-bold"
                    >
                      {doc.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("visit_date")}
              </Label>
              <Input
                type="date"
                defaultValue={
                  selectedCase?.date ? selectedCase.date.split("T")[0] : ""
                }
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("reason")}
            </Label>
            <Input
              defaultValue={selectedCase?.reason}
              placeholder={
                t("chief_complaint") || "Chief complaint or symptoms..."
              }
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("clinical_notes")}
            </Label>
            <textarea
              placeholder="Detailed observations and findings..."
              defaultValue={selectedCase?.reason}
              className="w-full min-h-35 p-5 bg-white/5 border border-white/5 focus:border-emerald/30 focus:ring-1 focus:ring-emerald/20 rounded-2xl font-medium outline-none transition-all"
            />
          </div>
        </div>
      </DashboardForm>

      <VisitDetailModal
        visit={selectedVisitDetails}
        onClose={() => setSelectedVisitDetails(null)}
        getPet={getPet}
        getUser={getUser}
        getDrugsForVisit={getDrugsForVisit}
        isClient={user?.role === "client"}
      />
    </div>
  );
}
