"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useFormik } from "formik";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
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
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/app/_hooks/useAuth";

import {
  useUsers,
  useCreateUser,
  useDeleteUser,
} from "@/app/_hooks/queries/use-users";
import { usePets, useCreatePet } from "@/app/_hooks/queries/use-pets";
import type { UserRole, PetType, UserCreated } from "@/app/_lib/types/models";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function OwnersPage() {
  const [search, setSearch] = useState("");
  const [showCreateOwner, setShowCreateOwner] = useState(false);
  const [showAddPet, setShowAddPet] = useState<string | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<UserCreated | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: petsData } = usePets();

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const createPet = useCreatePet();

  const clients = (usersData?.data || []).filter((u) => u.role === "client");
  const pets = petsData?.data || [];

  const filtered = clients.filter(
    (o) =>
      o.fullname.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()),
  );

  const formikOwner = useFormik({
    initialValues: {
      fullname: "",
      phone: "",
      role: "client" as UserRole,
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      createUser.mutate(values, {
        onSuccess: (data: UserCreated) => {
          setCreatedUser(data);
          setShowCreateOwner(false);
          setSubmitting(false);
          resetForm();
          toast.success("Client created successfully.");
        },
        onError: () => {
          setSubmitting(false);
          toast.error("Failed to create client. Please try again.");
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
      createPet.mutate(values, {
        onSuccess: () => {
          setShowAddPet(null);
          setSubmitting(false);
          resetForm();
          toast.success("Pet added successfully.");
        },
        onError: () => {
          setSubmitting(false);
          toast.error("Failed to add pet. Please try again.");
        },
      });
    },
  });

  const handleOpenAddPet = (ownerId: string) => {
    formikPet.resetForm();
    formikPet.setFieldValue("client_id", ownerId);
    setShowAddPet(ownerId);
  };

  const handleDeleteOwner = (ownerId: string) => {
    if (confirm("Are you sure you want to deactivate or remove this client?")) {
      deleteUser.mutate(ownerId, {
        onSuccess: () => toast.success("Client deactivated successfully."),
        onError: () =>
          toast.error("Failed to deactivate client. Please try again."),
      });
    }
  };

  const handleCopyPassword = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(createdUser.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
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
            Clinical Network
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Client <span className="text-emerald">Management</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} registered owners
          </p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateOwner(true)}
          className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple"
        >
          <UserPlus className="w-4 h-4" /> New Owner
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owners..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </motion.div>

      {/* Create Owner Modal */}
      <DashboardForm
        title="Create Owner Profile"
        description="Register a new clinical owner to the system."
        isOpen={showCreateOwner}
        onOpenChange={setShowCreateOwner}
        onSubmit={(e) =>
          formikOwner.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={formikOwner.isSubmitting ? "Creating..." : "Create Owner"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Full Name *
            </label>
            <Input
              name="fullname"
              value={formikOwner.values.fullname}
              onChange={formikOwner.handleChange}
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Phone
            </label>
            <Input
              name="phone"
              value={formikOwner.values.phone}
              onChange={formikOwner.handleChange}
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
        </div>
      </DashboardForm>

      {/* Add Pet Modal */}
      <DashboardForm
        title="Add New Pet"
        isOpen={!!showAddPet}
        onOpenChange={(open) => !open && setShowAddPet(null)}
        onSubmit={(e) =>
          formikPet.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={formikPet.isSubmitting ? "Registering..." : "Register Pet"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Pet Name *
            </label>
            <Input
              name="name"
              value={formikPet.values.name}
              onChange={formikPet.handleChange}
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Species
              </label>
              <Select
                value={formikPet.values.type}
                onValueChange={(val) => formikPet.setFieldValue("type", val)}
              >
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="dog" className="rounded-xl font-bold">
                    Dog
                  </SelectItem>
                  <SelectItem value="cat" className="rounded-xl font-bold">
                    Cat
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Weight (KG)
              </label>
              <Input
                type="number"
                step="0.1"
                name="weight"
                value={formikPet.values.weight}
                onChange={formikPet.handleChange}
                placeholder="0.0"
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>
        </div>
      </DashboardForm>

      {/* Owner List */}
      <motion.div variants={fadeUp} className="space-y-3">
        {usersLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading clients...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No clients found. Add one to get started.
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
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-orange/15 text-orange">
                          Inactive
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
                        {ownerPets.length} pets
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
                            {owner.phone || "No phone"}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            No address in model
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              Pets
                            </span>
                            <button
                              onClick={() => handleOpenAddPet(owner.user_id)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald hover:underline"
                            >
                              <Plus className="w-3 h-3" /> Add Pet
                            </button>
                          </div>
                          {ownerPets.length === 0 ? (
                            <p className="text-xs text-muted-foreground/50 italic">
                              No pets registered
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
                        <div className="flex items-center gap-2 pt-2">
                          {(user?.role === "owner" ||
                            user?.role === "admin") && (
                            <button
                              onClick={() => handleDeleteOwner(owner.user_id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-coral/10 border border-coral/20 text-coral hover:bg-coral/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Owner
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
          <div className="bg-sidebar/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                ✨ Client Created Successfully!
              </h2>
              <p className="text-sm text-muted-foreground">
                Save these credentials now. The password is shown only here.
              </p>
            </div>

            {/* Email Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Generated Email
              </Label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
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
                Generated Password
              </Label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
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
            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Name:
                </span>
                <span className="text-sm font-bold text-foreground">
                  {createdUser.fullname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Role:
                </span>
                <span className="text-sm font-bold text-emerald uppercase">
                  {createdUser.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Phone:
                </span>
                <span className="text-sm font-bold text-foreground">
                  {createdUser.phone}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-white/5 pt-6">
              <Button
                onClick={() => setCreatedUser(null)}
                className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-bold h-11 rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
