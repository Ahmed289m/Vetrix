"use client";

import * as React from "react";
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

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
} from "@/app/_hooks/queries/use-users";
import { useClinics } from "@/app/_hooks/queries/use-clinics";
import type { User, UserRole, UserCreated } from "@/app/_lib/types/models";

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [createdUser, setCreatedUser] = React.useState<UserCreated | null>(
    null,
  );
  const [resettedUser, setResettedUser] = React.useState<UserCreated | null>(
    null,
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: clinicsData } = useClinics();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const users = (usersData?.data || []).filter((u) => u.role !== "client");
  const clinics = clinicsData?.data || [];

  const formik = useFormik({
    initialValues: {
      fullname: "",
      phone: "",
      role: "staff" as UserRole,
      clinic_id: "",
    },
    onSubmit: (values, { setSubmitting }) => {
      const payload = { ...values };

      if (selectedUser) {
        updateUser.mutate(
          { id: selectedUser.user_id, data: payload },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSubmitting(false);
              setCreatedUser(null);
              toast.success("User updated successfully.");
            },
            onError: () => {
              setSubmitting(false);
              toast.error("Failed to update user. Please try again.");
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
            toast.success("User created successfully.");
          },
          onError: () => {
            setSubmitting(false);
            toast.error("Failed to create user. Please try again.");
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
    if (confirm("Are you sure you want to deactivate or delete this user?")) {
      deleteUser.mutate(id, {
        onSuccess: () => toast.success("User deactivated successfully."),
        onError: () =>
          toast.error("Failed to deactivate user. Please try again."),
      });
    }
  };

  const handleResetPassword = (userId: string) => {
    resetPassword.mutate(userId, {
      onSuccess: (response) => {
        setResettedUser(response.data);
        setShowPassword(false);
        setCopied(false);
        toast.success("Password loaded successfully.");
      },
      onError: () => toast.error("Failed to load password. Please try again."),
    });
  };

  const getClinicName = (clinicId: string | null) => {
    if (!clinicId) return "Global";
    return (
      clinics.find((c) => c.clinic_id === clinicId)?.clinicName ||
      "Unknown Clinic"
    );
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            User <span className="text-emerald">Management</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your clinic staff, doctors, and administrators.
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by name or email..."
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  User Info
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Role
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Clinic
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.user_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group/row"
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/20 flex items-center justify-center text-emerald font-black text-lg shadow-inner">
                          {user.fullname?.[0]?.toUpperCase() || (
                            <UserIcon className="w-5 h-5" />
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
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald" />
                        <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          {getClinicName(user.clinic_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                          user.is_active
                            ? "bg-emerald/10 text-emerald"
                            : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
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
                          className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-48 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(user)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                          >
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(user.user_id)}
                            className="rounded-xl py-3 focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer font-bold"
                          >
                            Show Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.user_id)}
                            className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                          >
                            {user.is_active ? "Deactivate" : "Delete"}
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

      {/* CRUD Form */}
      <DashboardForm
        title={selectedUser ? "Edit User" : "Create New User"}
        description={
          selectedUser
            ? `Modifying profile for ${selectedUser.fullname}`
            : "Invite a new staff member to the platform."
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formik.isSubmitting
            ? "Saving..."
            : selectedUser
              ? "Update User"
              : "Create User"
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Full Name
              </Label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
                <Input
                  name="fullname"
                  value={formik.values.fullname}
                  onChange={formik.handleChange}
                  placeholder="Full name..."
                  className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Phone Number
              </Label>
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                placeholder="+123456789"
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Role Type
              </Label>
              <Select
                value={formik.values.role}
                onValueChange={(val) => formik.setFieldValue("role", val)}
              >
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="admin" className="rounded-xl font-bold">
                    Admin
                  </SelectItem>
                  <SelectItem value="owner" className="rounded-xl font-bold">
                    Owner
                  </SelectItem>
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
                Clinic Assignment
              </Label>
              <Select
                value={formik.values.clinic_id}
                onValueChange={(val) => formik.setFieldValue("clinic_id", val)}
              >
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue placeholder="Select Clinic" />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
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
                    Unassigned / Global
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
          <div className="bg-sidebar/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                ✨ User Created Successfully!
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

      {/* Show Password Modal */}
      {resettedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-sidebar/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                🔐 Current Password
              </h2>
              <p className="text-sm text-muted-foreground">
                Here&apos;s the current password for this user.
              </p>
            </div>

            {/* Current Password Display */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Password
              </Label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
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
            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Name:
                </span>
                <span className="text-sm font-bold text-foreground">
                  {resettedUser.fullname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Email:
                </span>
                <span className="text-sm font-bold text-emerald break-all">
                  {resettedUser.email}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-white/5 pt-6">
              <Button
                onClick={() => setResettedUser(null)}
                className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-bold h-11 rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
