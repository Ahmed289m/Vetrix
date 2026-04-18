"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  User as UserIcon,
  Mail,
  Shield,
  Store,
  Search,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Check,
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
import { cn } from "@/app/_lib/utils";
import { toast } from "sonner";
import { useLang } from "@/app/_hooks/useLanguage";

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
} from "@/app/_hooks/queries/use-users";
import { useClinics } from "@/app/_hooks/queries/use-clinics";
import { useAuth } from "@/app/_hooks/useAuth";
import type { User, UserRole, UserCreated } from "@/app/_lib/types/models";

const EMPTY_CLINICS: Array<{ clinic_id: string; clinicName: string }> = [];

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | UserRole>("all");
  const [createdUser, setCreatedUser] = React.useState<UserCreated | null>(
    null,
  );
  const [resettedUser, setResettedUser] = React.useState<UserCreated | null>(
    null,
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { t } = useLang();
  const { user: authUser } = useAuth();

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: clinicsData } = useClinics();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const users = (usersData?.data || []).filter((u) => u.role !== "client");
  const clinics = clinicsData?.data ?? EMPTY_CLINICS;
  const isOwnerManager = authUser?.role === "owner";

  const getClinicName = React.useCallback(
    (clinicId: string | null) => {
      if (!clinicId) return t("global");
      return (
        clinics.find((c) => c.clinic_id === clinicId)?.clinicName ||
        t("unknown_clinic")
      );
    },
    [clinics, t],
  );

  const filteredUsers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const clinicName = getClinicName(u.clinic_id).toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        u.fullname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        clinicName.includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, searchQuery, roleFilter, getClinicName]);

  const formik = useFormik({
    initialValues: {
      fullname: "",
      phone: "",
      role: "staff" as UserRole,
      clinic_id: "",
    },
    onSubmit: (values, { setSubmitting }) => {
      const normalizedClinicId =
        values.clinic_id === "none" || values.clinic_id === ""
          ? null
          : values.clinic_id;
      const payload = {
        ...values,
        clinic_id: normalizedClinicId ?? undefined,
      };

      if (selectedUser) {
        updateUser.mutate(
          { id: selectedUser.user_id, data: payload },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSubmitting(false);
              setCreatedUser(null);
              toast.success(t("user_updated_success"));
            },
            onError: () => {
              setSubmitting(false);
              toast.error(t("user_update_failed"));
            },
          },
        );
      } else {
        createUser.mutate(payload, {
          onSuccess: (data: UserCreated) => {
            // Show the generated credentials
            setCreatedUser(data);
            setIsFormOpen(false);
            setSubmitting(false);
            toast.success(t("user_created_success"));
          },
          onError: () => {
            setSubmitting(false);
            toast.error(t("user_create_failed"));
          },
        });
      }
    },
  });

  const handleOpenForm = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      formik.setValues({
        fullname: user.fullname,
        phone: user.phone,
        role: user.role,
        clinic_id: user.clinic_id || "",
      });
    } else {
      setSelectedUser(null);
      setCreatedUser(null);
      formik.resetForm();
    }
    setIsFormOpen(true);
  };

  const handleCopyPassword = () => {
    if (createdUser?.password) {
      navigator.clipboard.writeText(createdUser.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = (id: string) => {
    if (id === authUser?.userId) {
      toast.error(t("cannot_deactivate_self"));
      return;
    }

    if (confirm(t("confirm_delete_user"))) {
      deleteUser.mutate(id, {
        onSuccess: () => toast.success(t("user_deactivated_success")),
        onError: () => toast.error(t("user_deactivate_failed")),
      });
    }
  };

  const handleResetPassword = (userId: string) => {
    resetPassword.mutate(userId, {
      onSuccess: (response) => {
        setResettedUser(response.data);
        setShowPassword(false);
        setCopied(false);
        toast.success(t("password_loaded_success"));
      },
      onError: () => toast.error(t("password_load_failed")),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("user_management")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("manage_staff_and_doctors")}
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          {t("add_new_user")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative group sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_users")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}
        >
          <SelectTrigger className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder={t("filter_by_role")} />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5">
            <SelectItem value="all">{t("all_roles")}</SelectItem>
            <SelectItem value="owner">{t("owner")}</SelectItem>
            <SelectItem value="doctor">{t("doctor")}</SelectItem>
            <SelectItem value="staff">{t("staff")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden space-y-3">
        {usersLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-tint/5 border border-tint/5 animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground font-medium">
            {t("no_users_found")}
          </div>
        ) : (
          filteredUsers.map((user, i) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald font-bold text-sm shrink-0">
                  {user.fullname?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate flex items-center gap-1.5">
                    {user.fullname}
                    {user.is_superuser && <ShieldAlert className="w-3 h-3 text-emerald" />}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.role} · {getClinicName(user.clinic_id)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase border ${
                    user.is_active ? "bg-emerald/10 text-emerald border-emerald/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {user.is_active ? t("active") : t("inactive")}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-tint/5">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-48 shadow-2xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">{t("actions")}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenForm(user)} className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold">{t("edit_profile")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.user_id)} className="rounded-xl py-3 focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer font-bold">{t("show_password")}</DropdownMenuItem>
                      {user.user_id !== authUser?.userId && (
                        <>
                          <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                          <DropdownMenuItem onClick={() => handleDelete(user.user_id)} className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">
                            {user.is_active ? t("deactivate") : t("delete_user")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Desktop table (>= md) ── */}
      <div className="hidden md:block relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl sm:rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-tint/5 backdrop-blur-md rounded-3xl border border-tint/5 overflow-x-auto shadow-2xl">
          <Table>
            <TableHeader className="bg-tint/5">
              <TableRow className="border-b border-tint/5 hover:bg-transparent">
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("user_info")}
                </TableHead>
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("role")}
                </TableHead>
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("clinic")}
                </TableHead>
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("status")}
                </TableHead>
                <TableHead className="py-4 px-6 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("loading_users")}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_users_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.user_id}
                    className="border-b border-tint/5 hover:bg-tint/5 transition-colors group/row"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald font-bold text-sm shadow-inner">
                          {user.fullname?.[0]?.toUpperCase() || (
                            <UserIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-foreground group-hover/row:text-emerald transition-colors">
                            {user.fullname}
                            {user.is_superuser && (
                              <ShieldAlert className="inline w-3 h-3 text-emerald ml-1 -mt-2" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 opacity-50" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald" />
                        <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          {getClinicName(user.clinic_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                          user.is_active
                            ? "bg-emerald/10 text-emerald"
                            : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {user.is_active ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
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
                          className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-48 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                            {t("actions")}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(user)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                          >
                            {t("edit_profile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(user.user_id)}
                            className="rounded-xl py-3 focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer font-bold"
                          >
                            {t("show_password")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                          {user.user_id !== authUser?.userId && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.user_id)}
                              className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                            >
                              {user.is_active
                                ? t("deactivate")
                                : t("delete_user")}
                            </DropdownMenuItem>
                          )}
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

      {/* CRUD Form */}
      <DashboardForm
        title={selectedUser ? t("edit_profile") : t("add_new_user")}
        description={
          selectedUser
            ? `${t("modifying_profile_for")} ${selectedUser.fullname}`
            : t("invite_new_staff")
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formik.isSubmitting
            ? t("saving")
            : selectedUser
              ? t("edit_profile")
              : t("add_new_user")
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("user_info")}
              </Label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
                <Input
                  name="fullname"
                  value={formik.values.fullname}
                  onChange={formik.handleChange}
                  placeholder={t("user_info")}
                  className="pl-12 h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("phone")}
              </Label>
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                placeholder="+123456789"
                className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("role")}
              </Label>
              <Select
                value={formik.values.role}
                onValueChange={(val) => formik.setFieldValue("role", val)}
              >
                <SelectTrigger className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  {(!isOwnerManager || formik.values.role === "admin") && (
                    <SelectItem value="admin" className="rounded-xl font-bold">
                      Admin
                    </SelectItem>
                  )}
                  {(!isOwnerManager || formik.values.role === "owner") && (
                    <SelectItem value="owner" className="rounded-xl font-bold">
                      Owner
                    </SelectItem>
                  )}
                  <SelectItem value="doctor" className="rounded-xl font-bold">
                    Doctor
                  </SelectItem>
                  <SelectItem value="staff" className="rounded-xl font-bold">
                    Staff
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("clinic")}
              </Label>
              <Select
                value={formik.values.clinic_id}
                onValueChange={(val) => formik.setFieldValue("clinic_id", val)}
              >
                <SelectTrigger className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue placeholder={t("clinic")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                  {clinics.map((clinic) => (
                    <SelectItem
                      key={clinic.clinic_id}
                      value={clinic.clinic_id}
                      className="rounded-xl font-bold"
                    >
                      {clinic.clinicName}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="none"
                    className="rounded-xl font-bold italic text-muted-foreground"
                  >
                    {t("unassigned_global")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DashboardForm>

      {/* Password Display Modal - Shows after user creation */}
      {createdUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-popover/95 backdrop-blur-xl border border-tint/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {t("user_created_title")}
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

      {/* Show Password Modal */}
      {resettedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-popover/95 backdrop-blur-xl border border-tint/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {t("current_password_title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("current_password_description")}
              </p>
            </div>

            {/* Current Password Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                {t("password")}
              </Label>
              <div className="flex items-center gap-2 bg-tint/5 border border-tint/5 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm font-mono font-bold text-blue-400 break-all">
                  {showPassword ? resettedUser.password : "••••••••••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resettedUser.password);
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

            {/* User Info */}
            <div className="space-y-3 border-t border-tint/5 pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("name_label")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {resettedUser.fullname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t("email_label")}
                </span>
                <span className="text-sm font-bold text-emerald break-all">
                  {resettedUser.email}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-tint/5 pt-6">
              <Button
                onClick={() => setResettedUser(null)}
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
