"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  User,
  Phone,
  Heart,
  Dog,
  Cat,
  Search,
  BookOpen,
} from "lucide-react";
import { useFormik } from "formik";
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
  usePets,
  useCreatePet,
  useUpdatePet,
  useDeletePet,
} from "@/app/_hooks/queries/use-pets";
import { useCaseHistoryCrew } from "@/app/_hooks/queries/use-crew";
import { useVisits } from "@/app/_hooks/queries/use-visits";
import { CaseHistoryModal } from "@/app/dashboard/_components/CaseHistoryModal";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import { toast } from "sonner";
import type {
  Pet,
  PetType,
  User as UserModel,
  Visit,
} from "@/app/_lib/types/models";

const EMPTY_PETS: Pet[] = [];
const EMPTY_USERS: UserModel[] = [];

const getErrorDetail = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeErr = error as { response?: { data?: { detail?: string } } };
  return maybeErr.response?.data?.detail || fallback;
};

export default function PetsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPet, setSelectedPet] = React.useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [speciesFilter, setSpeciesFilter] = React.useState("all");
  const [historyPet, setHistoryPet] = React.useState<Pet | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [selectedPetIds, setSelectedPetIds] = React.useState<string[]>([]);
  const { user } = useAuth();
  const { t } = useLang();

  const isClient = user?.role === "client";
  const canLoadClients = !isClient && Boolean(user?.clinicId);

  const { data: petsData, isLoading: isPetsLoading } = usePets();
  // Only fetch all users for roles that have users.read permission
  const { data: usersData } = useUsers({ enabled: canLoadClients });

  const createPet = useCreatePet();
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();
  const caseHistoryCrew = useCaseHistoryCrew();
  const { data: visitsData } = useVisits();
  const allVisits: Visit[] = visitsData?.data ?? [];

  const pets = petsData?.data ?? EMPTY_PETS;
  const allUsers = usersData?.data ?? EMPTY_USERS;
  const clients = isClient
    ? EMPTY_USERS
    : canLoadClients
      ? allUsers.filter((u) => u.role === "client")
      : EMPTY_USERS;

  const filteredPets = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pets.filter((pet) => {
      const ownerName = isClient
        ? (user?.fullname || "").toLowerCase()
        : (
            clients.find((c) => c.user_id === pet.client_id)?.fullname || ""
          ).toLowerCase();

      const matchesSearch =
        q.length === 0 ||
        pet.name.toLowerCase().includes(q) ||
        pet.type.toLowerCase().includes(q) ||
        ownerName.includes(q);
      const matchesSpecies =
        speciesFilter === "all" || pet.type.toLowerCase() === speciesFilter;
      return matchesSearch && matchesSpecies;
    });
  }, [pets, clients, searchQuery, speciesFilter, user, isClient]);

  const canDeletePets = user?.role !== "doctor";
  const bulkDeletablePetIds = React.useMemo(
    () => (canDeletePets ? filteredPets.map((pet) => pet.pet_id) : []),
    [canDeletePets, filteredPets],
  );

  React.useEffect(() => {
    const allowed = new Set(bulkDeletablePetIds);
    setSelectedPetIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [bulkDeletablePetIds]);

  const formik = useFormik({
    initialValues: {
      name: "",
      weight: 0,
      type: "dog" as PetType,
      client_id: "",
    },
    onSubmit: (values, { setSubmitting }) => {
      // For CLIENT: inject their own user_id as client_id
      const payload = isClient
        ? { ...values, client_id: user?.userId || "" }
        : values;

      if (selectedPet) {
        updatePet.mutate(
          { id: selectedPet.pet_id, data: payload },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSubmitting(false);
            },
            onError: () => setSubmitting(false),
          },
        );
      } else {
        createPet.mutate(payload, {
          onSuccess: () => {
            setIsFormOpen(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      }
    },
  });

  const handleOpenForm = (pet?: Pet) => {
    if (pet) {
      setSelectedPet(pet);
      formik.setValues({
        name: pet.name,
        weight: pet.weight,
        type: pet.type,
        client_id: pet.client_id,
      });
    } else {
      setSelectedPet(null);
      formik.resetForm();
    }
    setIsFormOpen(true);
  };

  const handleDelete = (petId: string) => {
    if (confirm(t("confirm_delete_patient"))) {
      deletePet.mutate(petId, {
        onSuccess: () => {
          setSelectedPetIds((prev) => prev.filter((id) => id !== petId));
        },
      });
    }
  };

  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId],
    );
  };

  const toggleSelectAllPets = () => {
    setSelectedPetIds((prev) =>
      prev.length === bulkDeletablePetIds.length ? [] : bulkDeletablePetIds,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPetIds.length === 0) return;
    const count = selectedPetIds.length;
    if (!confirm(`Delete ${count} selected patient${count > 1 ? "s" : ""}?`)) {
      return;
    }

    const ids = [...selectedPetIds];
    const results = await Promise.allSettled(
      ids.map((id) => deletePet.mutateAsync(id)),
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

    if (successCount > 0) {
      toast.success(
        `Deleted ${successCount} patient${successCount > 1 ? "s" : ""}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Failed to delete ${failedIds.length} patient${failedIds.length > 1 ? "s" : ""}.`,
      );
    }

    setSelectedPetIds(failedIds);
  };

  const getVisitCount = (petId: string) => {
    return allVisits.filter((visit) => visit.pet_id === petId).length;
  };

  const handleShowHistory = (pet: Pet) => {
    setHistoryPet(pet);
    caseHistoryCrew.reset();
    setIsHistoryOpen(true);
    caseHistoryCrew.mutate(pet.pet_id, {
      onError: (err: unknown) =>
        toast.error(getErrorDetail(err, "Failed to load case history.")),
    });
  };

  const getClientDetails = (clientId: string) => {
    if (isClient) {
      return {
        name: user?.fullname || t("unknown_owner"),
        phone: t("no_phone"),
      };
    }
    const client = clients.find((c) => c.user_id === clientId);
    return {
      name: client?.fullname || t("unknown_owner"),
      phone: client?.phone || t("no_phone"),
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-emerald fill-emerald/20" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("patient_portal")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("patient_records")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("manage_patient_records")}
          </p>
        </div>
        {user?.role !== "doctor" && (
          <Button
            onClick={() => handleOpenForm()}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("add_new_patient")}
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative group sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_patients")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder={t("species")} />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5">
            <SelectItem value="all">{t("all_species")}</SelectItem>
            <SelectItem value="dog">{t("dogs")}</SelectItem>
            <SelectItem value="cat">{t("cats")}</SelectItem>
            <SelectItem value="other">{t("other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canDeletePets && bulkDeletablePetIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {selectedPetIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSelectAllPets}
              className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
            >
              {selectedPetIds.length === bulkDeletablePetIds.length
                ? "Clear selection"
                : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleBulkDelete();
              }}
              disabled={selectedPetIds.length === 0 || deletePet.isPending}
              className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden space-y-3">
        {isPetsLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-tint/5 border border-tint/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground font-medium">
            {t("no_patients_found")}
          </div>
        ) : (
          filteredPets.map((pet, i) => {
            const client = getClientDetails(pet.client_id);
            const Icon = pet.type.toLowerCase() === "cat" ? Cat : Dog;
            const isSelected = selectedPetIds.includes(pet.pet_id);
            return (
              <motion.div
                key={pet.pet_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-3">
                  {canDeletePets && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePetSelection(pet.pet_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                      aria-label="Select patient"
                    />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pet.type} · {pet.weight}kg ·{" "}
                      <span className="capitalize">{client.name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={getVisitCount(pet.pet_id) === 0}
                      onClick={() => handleShowHistory(pet)}
                      className={`h-8 w-8 rounded-xl shrink-0 ${
                        getVisitCount(pet.pet_id) > 0
                          ? "text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20"
                          : "text-muted-foreground/30 bg-tint/5"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-tint/5 shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-44 shadow-2xl"
                      >
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                          {t("patient_actions")}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenForm(pet)}
                          className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                        >
                          {t("edit_profile")}
                        </DropdownMenuItem>
                        {user?.role !== "doctor" && (
                          <>
                            <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(pet.pet_id)}
                              className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                            >
                              {t("delete_record")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Desktop table (>= md) ── */}
      <div className="hidden md:block relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-tint/5 backdrop-blur-md rounded-3xl border border-tint/5 overflow-x-auto shadow-2xl">
          <Table>
            <TableHeader className="bg-tint/5">
              <TableRow className="border-b border-tint/5 hover:bg-transparent">
                {canDeletePets && (
                  <TableHead className="py-4 px-4 w-12">
                    <Checkbox
                      checked={
                        bulkDeletablePetIds.length > 0 &&
                        selectedPetIds.length === bulkDeletablePetIds.length
                      }
                      onCheckedChange={toggleSelectAllPets}
                      className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                      aria-label="Select all patients"
                    />
                  </TableHead>
                )}
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("patient_and_owner")}
                </TableHead>
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("species")}
                </TableHead>
                {!isClient && (
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                    {t("contact_info")}
                  </TableHead>
                )}
                <TableHead className="py-4 px-6 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPetsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      isClient ? (canDeletePets ? 4 : 3) : canDeletePets ? 5 : 4
                    }
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("loading_patients")}
                  </TableCell>
                </TableRow>
              ) : filteredPets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      isClient ? (canDeletePets ? 4 : 3) : canDeletePets ? 5 : 4
                    }
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_patients_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPets.map((pet) => {
                  const client = getClientDetails(pet.client_id);
                  const isSelected = selectedPetIds.includes(pet.pet_id);
                  return (
                    <TableRow
                      key={pet.pet_id}
                      className="border-b border-tint/5 hover:bg-tint/5 transition-colors group/row"
                    >
                      {canDeletePets && (
                        <TableCell className="py-4 px-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              togglePetSelection(pet.pet_id)
                            }
                            className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                            aria-label="Select patient"
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald shadow-inner group-hover/row:scale-105 transition-transform duration-300">
                            {pet.type.toLowerCase() === "cat" ? (
                              <Cat className="w-5 h-5" />
                            ) : (
                              <Dog className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                              {pet.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 opacity-50" />
                              {client.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                            {pet.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold tracking-widest bg-tint/5 w-fit px-2 py-0.5 rounded-md">
                            {t("weight")}: {pet.weight}kg
                          </span>
                        </div>
                      </TableCell>
                      {!isClient && (
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground/60" />
                            <span className="text-sm font-bold text-muted-foreground/80">
                              {client.phone}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={getVisitCount(pet.pet_id) === 0}
                            onClick={() => handleShowHistory(pet)}
                            className={`h-9 px-3 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider transition-all ${
                              getVisitCount(pet.pet_id) > 0
                                ? "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 shadow-[0_0_15px_-5px_hsl(250,95%,70%,0.3)]"
                                : "bg-tint/5 text-muted-foreground/30 border-transparent grayscale"
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            {t("case_history")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="group-hover/row:bg-tint/10 rounded-xl h-9 w-9"
                              >
                                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-48 shadow-2xl"
                            >
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                                {t("patient_actions")}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenForm(pet)}
                                className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                              >
                                {t("edit_profile")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                              {user?.role !== "doctor" && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(pet.pet_id)}
                                  className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                                >
                                  {t("delete_record")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CRUD Form */}
      <DashboardForm
        title={
          selectedPet ? t("update_patient_profile") : t("register_new_patient")
        }
        description={
          selectedPet
            ? `${t("modifying_clinical_records_for")} ${selectedPet.name}`
            : t("enter_patient_details")
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formik.isSubmitting
            ? t("saving")
            : selectedPet
              ? t("save_profile")
              : t("register_patient")
        }
      >
        <div className="space-y-6">
          {/* Client selector — only for staff/owner/admin */}
          {!isClient && (
            <div className="p-6 bg-emerald/5 border border-emerald/10 rounded-4xl space-y-4">
              <div className="flex items-center gap-2 px-2">
                <User className="w-4 h-4 text-emerald" />
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
                  {t("assigned_clinical_owner")}
                </Label>
              </div>
              <Select
                value={formik.values.client_id}
                onValueChange={(val) => formik.setFieldValue("client_id", val)}
              >
                <SelectTrigger className="h-16 bg-tint/10 border-tint/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-xl text-left px-5">
                  <SelectValue placeholder={t("search_or_select_client")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 max-h-75">
                  {clients.map((client) => (
                    <SelectItem
                      key={client.user_id}
                      value={client.user_id}
                      className="rounded-xl py-4 cursor-pointer focus:bg-emerald/10 focus:text-emerald"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-black text-lg tracking-tight leading-none mb-1">
                          {client.fullname}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          {client.email} · {client.phone}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="px-2 text-[10px] font-black text-muted-foreground/40 italic flex items-center gap-1.5 uppercase tracking-widest">
                <Plus className="w-3 h-3" /> {t("register_clients_in_owners")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                {t("patient_identity")}
              </Label>
              <div className="relative group/field">
                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-emerald transition-colors" />
                <Input
                  name="name"
                  placeholder={t("patient_name_placeholder")}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  className="pl-12 h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                {t("species_type")}
              </Label>
              <Select
                value={formik.values.type}
                onValueChange={(val) => formik.setFieldValue("type", val)}
              >
                <SelectTrigger className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-widest text-xs text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  <SelectItem value="dog" className="rounded-xl font-bold">
                    {t("dog")}
                  </SelectItem>
                  <SelectItem value="cat" className="rounded-xl font-bold">
                    {t("cat")}
                  </SelectItem>
                  <SelectItem value="other" className="rounded-xl font-bold">
                    {t("other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                {t("weight_kg")}
              </Label>
              <Input
                type="number"
                step="0.1"
                name="weight"
                value={formik.values.weight}
                onChange={formik.handleChange}
                placeholder={t("weight_example")}
                className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-lg"
              />
            </div>
            {/* Kept an empty right col for future extensions instead of breed, to preserve layout balance */}
          </div>
        </div>
      </DashboardForm>

      <CaseHistoryModal
        open={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          caseHistoryCrew.reset();
        }}
        patient={
          historyPet
            ? {
                petName: historyPet.name,
                species: historyPet.type,
                breed:
                  (historyPet as Pet & { breed?: string }).breed || t("mixed"),
                ownerName: getClientDetails(historyPet.client_id).name,
              }
            : null
        }
        visits={caseHistoryCrew.data?.data?.visits ?? []}
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
    </motion.div>
  );
}
