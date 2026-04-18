"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  UserPlus,
  PawPrint,
  Mail,
  Phone,
  MapPin,
  Dog,
  Cat,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { useFormik } from "formik";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
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
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { toast } from "sonner";
import { fadeUp, stagger } from "@/app/_lib/utils/shared-animations";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";

import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  useResetPassword,
} from "@/app/_hooks/queries/use-users";
import { usePets, useCreatePet } from "@/app/_hooks/queries/use-pets";
import type { UserRole, PetType, UserCreated } from "@/app/_lib/types/models";

export default function OwnersPage() {
  const [search, setSearch] = useState("");
  const [showCreateOwner, setShowCreateOwner] = useState(false);
  const [showAddPet, setShowAddPet] = useState<string | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<UserCreated | null>(null);
  const [resettedClient, setResettedClient] = useState<UserCreated | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showResettedPassword, setShowResettedPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedResetted, setCopiedResetted] = useState(false);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { t } = useLang();
  const isAdminReadOnly = user?.role === "admin";

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: petsData } = usePets();

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const createPet = useCreatePet();
  const resetPassword = useResetPassword();

  const clients = (usersData?.data || []).filter((u) => u.role === "client");
  const pets = petsData?.data || [];

  const filtered = clients.filter(
    (o) =>
      o.fullname.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()),
  );

  const canDeleteOwners = user?.role === "owner" && !isAdminReadOnly;
  const bulkDeletableOwnerIds = useMemo(
    () =>
      canDeleteOwners
        ? filtered
            .filter((owner) => owner.user_id !== user?.userId)
            .map((owner) => owner.user_id)
        : [],
    [canDeleteOwners, filtered, user?.userId],
  );
  const deletableOwnerIdSet = useMemo(
    () => new Set(bulkDeletableOwnerIds),
    [bulkDeletableOwnerIds],
  );
  const effectiveSelectedOwnerIds = selectedOwnerIds.filter((id) =>
    deletableOwnerIdSet.has(id),
  );

  const toggleOwnerSelection = (ownerId: string) => {
    if (!deletableOwnerIdSet.has(ownerId)) return;
    setSelectedOwnerIds((prev) =>
      prev.includes(ownerId)
        ? prev.filter((id) => id !== ownerId)
        : [...prev, ownerId],
    );
  };

  const toggleSelectAllOwners = () => {
    setSelectedOwnerIds(() =>
      effectiveSelectedOwnerIds.length === bulkDeletableOwnerIds.length
        ? []
        : bulkDeletableOwnerIds,
    );
  };

  const handleBulkDeleteOwners = async () => {
    if (effectiveSelectedOwnerIds.length === 0) return;
    const count = effectiveSelectedOwnerIds.length;
    if (!confirm(`Delete ${count} selected client${count > 1 ? "s" : ""}?`)) {
      return;
    }

    const ids = [...effectiveSelectedOwnerIds];
    const results = await Promise.allSettled(
      ids.map((id) => deleteUser.mutateAsync(id)),
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
        `Deleted ${successCount} client${successCount > 1 ? "s" : ""}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Failed to delete ${failedIds.length} client${failedIds.length > 1 ? "s" : ""}.`,
      );
    }

    setSelectedOwnerIds(failedIds);
  };

  const formikOwner = useFormik({
    initialValues: {
      fullname: "",
      phone: "",
      role: "client" as UserRole,
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      if (isAdminReadOnly) {
        setSubmitting(false);
        toast.error("Admin can only view clients.");
        return;
      }

      createUser.mutate(values, {
        onSuccess: (data: UserCreated) => {
          setCreatedUser(data);
          setShowCreateOwner(false);
          setSubmitting(false);
          resetForm();
          toast.success(t("client_created_success"));
        },
        onError: () => {
          setSubmitting(false);
          toast.error(t("client_create_failed"));
        },
      });
    },
  });

  const formikPet = useFormik({
    initialValues: {
      name: "",
      type: "dog" as PetType,
      weight: 0,
      client_id: "",
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      if (isAdminReadOnly) {
        setSubmitting(false);
        toast.error("Admin can only view clients.");
        return;
      }

      createPet.mutate(values, {
        onSuccess: () => {
          setShowAddPet(null);
          setSubmitting(false);
          resetForm();
          toast.success(t("pet_added_success"));
        },
        onError: () => {
          setSubmitting(false);
          toast.error(t("pet_add_failed"));
        },
      });
    },
  });

  const handleOpenAddPet = (ownerId: string) => {
    if (isAdminReadOnly) {
      toast.error("Admin can only view clients.");
      return;
    }

    formikPet.resetForm();
    formikPet.setFieldValue("client_id", ownerId);
    setShowAddPet(ownerId);
  };

  const handleDeleteOwner = (ownerId: string) => {
    if (isAdminReadOnly) {
      toast.error("Admin can only view clients.");
      return;
    }

    if (ownerId === user?.userId) {
      toast.error(t("cannot_deactivate_self"));
      return;
    }

    if (confirm(t("confirm_delete_client"))) {
      deleteUser.mutate(ownerId, {
        onSuccess: () => {
          setSelectedOwnerIds((prev) => prev.filter((id) => id !== ownerId));
          toast.success(t("client_deactivated_success"));
        },
        onError: () => toast.error(t("client_deactivate_failed")),
      });
    }
  };

  const handleCopyPassword = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(createdUser.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowClientPassword = (clientId: string) => {
    resetPassword.mutate(clientId, {
      onSuccess: (response) => {
        setResettedClient(response.data);
        setShowResettedPassword(false);
        setCopiedResetted(false);
        toast.success(t("password_loaded_success"));
      },
      onError: () => toast.error(t("password_load_failed")),
    });
  };

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("clinical_network")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("client_management")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} {t("registered_clients")}
          </p>
        </div>
        {!isAdminReadOnly && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateOwner(true)}
            className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple"
          >
            <UserPlus className="w-4 h-4" /> {t("new_client")}
          </motion.button>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_clients")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </motion.div>

      {bulkDeletableOwnerIds.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3"
        >
          <p className="text-sm font-semibold text-foreground">
            {effectiveSelectedOwnerIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSelectAllOwners}
              className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
            >
              {effectiveSelectedOwnerIds.length === bulkDeletableOwnerIds.length
                ? "Clear selection"
                : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleBulkDeleteOwners();
              }}
              disabled={
                effectiveSelectedOwnerIds.length === 0 || deleteUser.isPending
              }
              className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete selected
            </Button>
          </div>
        </motion.div>
      )}

      {/* Create Owner Modal */}
      <DashboardForm
        title={t("create_client_profile")}
        description={t("register_clinical_client")}
        isOpen={showCreateOwner}
        onOpenChange={setShowCreateOwner}
        onSubmit={(e) =>
          formikOwner.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formikOwner.isSubmitting ? t("creating") : t("create_client")
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("full_name_required")}
            </label>
            <Input
              name="fullname"
              value={formikOwner.values.fullname}
              onChange={formikOwner.handleChange}
              className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("phone")}
            </label>
            <Input
              name="phone"
              value={formikOwner.values.phone}
              onChange={formikOwner.handleChange}
              className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
        </div>
      </DashboardForm>

      {/* Add Pet Modal */}
      <DashboardForm
        title={t("add_new_pet")}
        isOpen={!!showAddPet}
        onOpenChange={(open) => !open && setShowAddPet(null)}
        onSubmit={(e) =>
          formikPet.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formikPet.isSubmitting ? t("registering") : t("register_pet")
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("pet_name_required")}
            </label>
            <Input
              name="name"
              value={formikPet.values.name}
              onChange={formikPet.handleChange}
              className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("species")}
              </label>
              <Select
                value={formikPet.values.type}
                onValueChange={(val) => formikPet.setFieldValue("type", val)}
              >
                <SelectTrigger className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  <SelectItem value="dog" className="rounded-xl font-bold">
                    {t("dog")}
                  </SelectItem>
                  <SelectItem value="cat" className="rounded-xl font-bold">
                    {t("cat")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("weight_kg")}
              </label>
              <Input
                type="number"
                step="0.1"
                name="weight"
                value={formikPet.values.weight}
                onChange={formikPet.handleChange}
                placeholder="0.0"
                className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>
        </div>
      </DashboardForm>

      {/* Owner List */}
      <motion.div variants={fadeUp} className="space-y-3">
        {usersLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("loading_clients")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("no_clients_found")}
          </div>
        ) : (
          filtered.map((owner, i) => {
            const isExpanded = expandedOwner === owner.user_id;
            const ownerPets = pets.filter((p) => p.client_id === owner.user_id);

            return (
              <motion.div
                key={owner.user_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <div
                  className="p-4 sm:p-5 flex items-center gap-4 cursor-pointer"
                  onClick={() =>
                    setExpandedOwner(isExpanded ? null : owner.user_id)
                  }
                >
                  {canDeleteOwners && owner.user_id !== user?.userId && (
                    <Checkbox
                      checked={effectiveSelectedOwnerIds.includes(
                        owner.user_id,
                      )}
                      onCheckedChange={() =>
                        toggleOwnerSelection(owner.user_id)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                      aria-label="Select client"
                    />
                  )}
                  <div className="w-12 h-12 rounded-2xl gradient-emerald-cyan flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {owner.fullname[0]?.toUpperCase() || (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">
                        {owner.fullname}
                      </p>
                      {owner.is_active ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-orange/15 text-orange">
                          {t("inactive")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {owner.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <PawPrint className="w-3 h-3" />
                        {ownerPets.length} {t("pets")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {owner.phone || t("no_phone")}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {t("no_address_in_model")}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {t("pets")}
                            </span>
                            {!isAdminReadOnly && (
                              <button
                                onClick={() => handleOpenAddPet(owner.user_id)}
                                className="flex items-center gap-1 text-xs font-semibold text-emerald hover:underline"
                              >
                                <Plus className="w-3 h-3" /> {t("add_pet")}
                              </button>
                            )}
                          </div>
                          {ownerPets.length === 0 ? (
                            <p className="text-xs text-muted-foreground/50 italic">
                              {t("no_pets_registered")}
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ownerPets.map((pet) => {
                                const Icon =
                                  pet.type.toLowerCase() === "cat" ? Cat : Dog;
                                return (
                                  <div
                                    key={pet.pet_id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                                      <Icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate">
                                        {pet.name}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {pet.type} · {pet.weight}kg
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          <button
                            onClick={() =>
                              handleShowClientPassword(owner.user_id)
                            }
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />{" "}
                            {t("show_password")}
                          </button>
                          {user?.role === "owner" && (
                            <button
                              onClick={() => handleDeleteOwner(owner.user_id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-coral/10 border border-coral/20 text-coral hover:bg-coral/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />{" "}
                              {t("remove_client")}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Password Display Modal - Shows after user creation */}
      {createdUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-popover/95 backdrop-blur-xl border border-tint/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {t("client_created_title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("save_credentials_notice")}
              </p>
            </div>

            {/* Email Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                {t("generated_email")}
              </Label>
              <div className="flex items-center gap-2 bg-tint/5 border border-tint/5 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm font-mono font-bold text-emerald break-all">
                  {createdUser.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdUser.email);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-muted-foreground hover:text-emerald transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                {t("generated_password")}
              </Label>
              <div className="flex items-center gap-2 bg-tint/5 border border-tint/5 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm font-mono font-bold text-amber break-all">
                  {showPassword ? createdUser.password : "••••••••••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-amber transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-muted-foreground hover:text-emerald transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* User Info Summary */}
            <div className="space-y-3 border-t border-tint/5 pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("name_label")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {createdUser.fullname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("role_label")}
                </span>
                <span className="text-sm font-bold text-emerald uppercase">
                  {createdUser.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("phone_label")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {createdUser.phone}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-tint/5 pt-6">
              <Button
                onClick={() => setCreatedUser(null)}
                className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-bold h-11 rounded-xl"
              >
                {t("done")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Show Client Password Modal */}
      {resettedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-popover/95 backdrop-blur-xl border border-tint/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {t("current_password_title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("current_password_description")}
              </p>
            </div>

            {/* Password Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                {t("password")}
              </Label>
              <div className="flex items-center gap-2 bg-tint/5 border border-tint/5 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm font-mono font-bold text-blue-400 break-all">
                  {showResettedPassword
                    ? resettedClient.password
                    : "••••••••••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowResettedPassword(!showResettedPassword)}
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  {showResettedPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resettedClient.password);
                    setCopiedResetted(true);
                    setTimeout(() => setCopiedResetted(false), 2000);
                  }}
                  className="text-muted-foreground hover:text-emerald transition-colors"
                >
                  {copiedResetted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-3 border-t border-tint/5 pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("name_label")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {resettedClient.fullname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("email_label")}
                </span>
                <span className="text-sm font-bold text-emerald break-all">
                  {resettedClient.email}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-tint/5 pt-6">
              <Button
                onClick={() => setResettedClient(null)}
                className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-bold h-11 rounded-xl"
              >
                {t("done")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
