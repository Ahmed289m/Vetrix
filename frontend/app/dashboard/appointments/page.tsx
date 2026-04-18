"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Search,
  CheckCircle,
  Clock,
  FileText,
  Dog,
  User,
} from "lucide-react";
import { useFormik } from "formik";
import { toast } from "sonner";
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
import type { DateRangeFilter } from "@/app/_lib/utils/date-filter";
import { filterByDateRange } from "@/app/_lib/utils/date-filter";
import { useAuth } from "@/app/_hooks/useAuth";

import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useLang } from "@/app/_hooks/useLanguage";
import type { Appointment } from "@/app/_lib/types/models";

const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_STRING = "";

type PetListItem = {
  pet_id: string;
  name: string;
  client_id: string;
};

type UserListItem = {
  user_id: string;
  fullname: string;
  role: string;
};

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return EMPTY_STRING;
  return String(value);
};

export default function AppointmentsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState<DateRangeFilter>("all");
  const [selectedAppointmentIds, setSelectedAppointmentIds] = React.useState<
    string[]
  >([]);
  const { user } = useAuth();
  const { t } = useLang();

  const isClient = user?.role === "client";
  const isStaff = user?.role === "staff";

  const { data: appData, isLoading: appLoading } = useAppointments();
  const { data: petsData } = usePets();
  // Only fetch all users for roles that have users.read permission
  const { data: usersData } = useUsers({ enabled: !isClient });

  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const updateAppointment = useUpdateAppointment();

  const appointments = React.useMemo<Appointment[]>(() => {
    const rawAppointments = asArray<unknown>(appData?.data);

    const normalized: Appointment[] = [];
    for (const item of rawAppointments) {
      const app = asRecord(item);
      if (!app) continue;

      const appointmentId = asString(app.appointment_id);
      if (!appointmentId) continue;

      const normalizedAppointment: Appointment = {
        appointment_id: appointmentId,
        clinic_id: asString(app.clinic_id),
        pet_id: asString(app.pet_id),
        client_id: asString(app.client_id),
        status: asString(app.status),
      };

      if (app.doctor_id !== undefined && app.doctor_id !== null) {
        normalizedAppointment.doctor_id = asString(app.doctor_id);
      }
      if (
        app.appointment_date !== undefined &&
        app.appointment_date !== null
      ) {
        normalizedAppointment.appointment_date = asString(app.appointment_date);
      }
      if (app.reason !== undefined && app.reason !== null) {
        normalizedAppointment.reason = asString(app.reason);
      }

      normalized.push(normalizedAppointment);
    }

    return normalized.length > 0 ? normalized : EMPTY_APPOINTMENTS;
  }, [appData?.data]);

  const petsList = React.useMemo<PetListItem[]>(() => {
    const rawPets = asArray<unknown>(petsData?.data);
    return rawPets
      .map((item) => {
        const pet = asRecord(item);
        if (!pet) return null;

        return {
          pet_id: asString(pet.pet_id),
          name: asString(pet.name),
          client_id: asString(pet.client_id),
        };
      })
      .filter((pet): pet is PetListItem => pet !== null)
      .filter((pet) => pet.pet_id.length > 0);
  }, [petsData?.data]);

  const usersList = React.useMemo<UserListItem[]>(() => {
    const rawUsers = asArray<unknown>(usersData?.data);
    return rawUsers
      .map((item) => {
        const u = asRecord(item);
        if (!u) return null;

        return {
          user_id: asString(u.user_id),
          fullname: asString(u.fullname),
          role: asString(u.role),
        };
      })
      .filter((u): u is UserListItem => u !== null)
      .filter((u) => u.user_id.length > 0);
  }, [usersData?.data]);

  // For CLIENT: empty list — they see their own name directly
  const clientsList = isClient
    ? []
    : usersList.filter((u) => u.role === "client");

  // Sort appointments by operation priority then by latest date.
  // Priority: pending -> confirmed -> completed -> cancelled.
  const sortedAppointments = React.useMemo(() => {
    const statusPriority: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      completed: 2,
      cancelled: 3,
    };

    return [...appointments].sort((a, b) => {
      const pa = statusPriority[(a.status || "").toLowerCase()] ?? 99;
      const pb = statusPriority[(b.status || "").toLowerCase()] ?? 99;
      if (pa !== pb) return pa - pb;

      const da = a.appointment_date
        ? new Date(a.appointment_date).getTime()
        : 0;
      const db = b.appointment_date
        ? new Date(b.appointment_date).getTime()
        : 0;
      return db - da;
    });
  }, [appointments]);

  const getPetName = (petId: string) =>
    petsList.find((p) => p.pet_id === petId)?.name || "Unknown Pet";

  /**
   * Resolve the display name for a client on an appointment row.
   * - CLIENT role: always their own name (no users.read permission)
   * - Staff/Owner/Admin: look up from the users list
   */
  const getClientName = (clientId: string) => {
    if (isClient) return user?.fullname || "—";
    return (
      clientsList.find((c) => c.user_id === clientId)?.fullname ||
      "Unknown Owner"
    );
  };

  const filteredAppointments = React.useMemo(() => {
    const byDate = filterByDateRange(
      sortedAppointments,
      "appointment_date",
      dateFilter,
    );
    const q = searchQuery.trim().toLowerCase();

    return byDate.filter((app) => {
      const petName = getPetName(app.pet_id).toLowerCase();
      const clientName = getClientName(app.client_id).toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        app.appointment_id.toLowerCase().includes(q) ||
        petName.includes(q) ||
        clientName.includes(q);
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortedAppointments,
    dateFilter,
    searchQuery,
    statusFilter,
    petsList,
    clientsList,
    user,
  ]);

  const formik = useFormik({
    initialValues: {
      pet_id: "",
      client_id: "",
      doctor_id: "",
      appointment_date: "",
      reason: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.pet_id) errors.pet_id = "Select a pet";
      if (!isClient && !values.client_id) errors.client_id = "Select a client";
      return errors;
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      // Build payload — CLIENT auto-injects their own user_id
      const payload = isClient
        ? {
            pet_id: values.pet_id,
            // client_id is resolved from JWT on the backend for CLIENT role
            ...(values.appointment_date && {
              appointment_date: values.appointment_date,
            }),
            ...(values.reason && { reason: values.reason }),
            ...(values.doctor_id && { doctor_id: values.doctor_id }),
          }
        : {
            pet_id: values.pet_id,
            client_id: values.client_id,
            ...(values.appointment_date && {
              appointment_date: values.appointment_date,
            }),
            ...(values.reason && { reason: values.reason }),
            ...(values.doctor_id && { doctor_id: values.doctor_id }),
          };

      createAppointment.mutate(payload, {
        onSuccess: () => {
          toast.success(t("appointment_booked_success"));
          setIsFormOpen(false);
          resetForm();
          setSubmitting(false);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || t("appointment_book_failed");
          toast.error(msg);
          setSubmitting(false);
        },
      });
    },
  });

  const handleOpenForm = () => {
    formik.resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirm_cancel_appointment"))) {
      deleteAppointment.mutate(id, {
        onSuccess: () => {
          setSelectedAppointmentIds((prev) =>
            prev.filter((item) => item !== id),
          );
          toast.success(t("appointment_cancelled"));
        },
        onError: () => toast.error(t("appointment_cancel_failed")),
      });
    }
  };

  const canCheckInAppointment = React.useCallback(
    (app: Appointment) =>
      isStaff && (app.status || "").toLowerCase() === "pending",
    [isStaff],
  );

  const canCancelAppointment = React.useCallback((app: Appointment) => {
    const normalizedStatus = (app.status || "").toLowerCase();
    return normalizedStatus === "pending" || normalizedStatus === "confirmed";
  }, []);

  const bulkCancelableIds = React.useMemo(
    () =>
      filteredAppointments
        .filter((app) => canCancelAppointment(app))
        .map((app) => app.appointment_id),
    [filteredAppointments, canCancelAppointment],
  );

  React.useEffect(() => {
    const allowed = new Set(bulkCancelableIds);
    setSelectedAppointmentIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [bulkCancelableIds]);

  const toggleAppointmentSelection = (appointmentId: string) => {
    setSelectedAppointmentIds((prev) =>
      prev.includes(appointmentId)
        ? prev.filter((id) => id !== appointmentId)
        : [...prev, appointmentId],
    );
  };

  const toggleSelectAllAppointments = () => {
    setSelectedAppointmentIds((prev) =>
      prev.length === bulkCancelableIds.length ? [] : bulkCancelableIds,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedAppointmentIds.length === 0) return;
    const count = selectedAppointmentIds.length;
    if (
      !confirm(`Cancel ${count} selected appointment${count > 1 ? "s" : ""}?`)
    ) {
      return;
    }

    const ids = [...selectedAppointmentIds];
    const results = await Promise.allSettled(
      ids.map((id) => deleteAppointment.mutateAsync(id)),
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
        `Cancelled ${successCount} appointment${successCount > 1 ? "s" : ""}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Failed to cancel ${failedIds.length} appointment${failedIds.length > 1 ? "s" : ""}.`,
      );
    }

    setSelectedAppointmentIds(failedIds);
  };

  const handleCheckIn = (appointmentId: string) => {
    updateAppointment.mutate(
      { id: appointmentId, data: { status: "confirmed" } },
      {
        onSuccess: () => toast.success(t("appointment_confirmed")),
        onError: () => toast.error(t("appointment_confirm_failed")),
      },
    );
  };

  // Pets available in the booking form:
  // - CLIENT: all their own pets (fetched from /pets which already filters by owner)
  // - STAFF: pets belonging to the selected client
  const clientPets = isClient
    ? petsList
    : petsList.filter((p) => p.client_id === formik.values.client_id);

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "confirmed")
      return {
        bg: "bg-emerald/10",
        text: "text-emerald",
        border: "border-emerald/20",
      };
    if (s === "pending")
      return {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/20",
      };
    if (s === "completed")
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-300",
        border: "border-purple-500/20",
      };
    return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
    };
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
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("scheduling_portal")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("bookings_and_appointments")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("manage_daily_schedule")}
          </p>
        </div>
        <Button
          onClick={handleOpenForm}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          {t("book_appointment")}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative group sm:col-span-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_appointments")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5">
            <SelectItem value="all">{t("all_statuses_filter")}</SelectItem>
            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={dateFilter}
          onValueChange={(v) => setDateFilter(v as DateRangeFilter)}
        >
          <SelectTrigger className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
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

      {bulkCancelableIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {selectedAppointmentIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSelectAllAppointments}
              className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
            >
              {selectedAppointmentIds.length === bulkCancelableIds.length
                ? "Clear selection"
                : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleBulkDelete();
              }}
              disabled={
                selectedAppointmentIds.length === 0 ||
                deleteAppointment.isPending
              }
              className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden space-y-3">
        {appLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-tint/5 border border-tint/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground font-medium">
            {t("no_appointments_found")}
          </div>
        ) : (
          filteredAppointments.map((app, i) => {
            const normalizedStatus = (app.status || "").toLowerCase();
            const sc = statusColor(normalizedStatus);
            const canCheckIn = canCheckInAppointment(app);
            const canCancel = canCancelAppointment(app);
            const isSelected = selectedAppointmentIds.includes(
              app.appointment_id,
            );
            return (
              <motion.div
                key={app.appointment_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2">
                    {canCancel && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleAppointmentSelection(app.appointment_id)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                        aria-label="Select appointment"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate flex items-center gap-2">
                        <Dog className="w-4 h-4 text-emerald shrink-0" />
                        {getPetName(app.pet_id)}
                      </p>
                      {!isClient && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />{" "}
                          {getClientName(app.client_id)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase border shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}
                  >
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {app.appointment_date
                      ? new Date(app.appointment_date).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                  {(canCheckIn || canCancel) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-tint/5"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-52 shadow-2xl"
                      >
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                          {t("operations")}
                        </DropdownMenuLabel>
                        {canCheckIn && (
                          <DropdownMenuItem
                            onClick={() => handleCheckIn(app.appointment_id)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />{" "}
                            {t("check_in_patient")}
                          </DropdownMenuItem>
                        )}
                        {canCheckIn && canCancel && (
                          <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                        )}
                        {canCancel && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(app.appointment_id)}
                            className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                          >
                            {t("cancel_appointment")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                <TableHead className="py-4 px-4 w-12">
                  <Checkbox
                    checked={
                      bulkCancelableIds.length > 0 &&
                      selectedAppointmentIds.length === bulkCancelableIds.length
                    }
                    onCheckedChange={toggleSelectAllAppointments}
                    className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                    aria-label="Select all appointments"
                  />
                </TableHead>
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("schedule_id_pet")}
                </TableHead>
                {!isClient && (
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                    {t("owner")}
                  </TableHead>
                )}
                <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-4 px-6 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {appLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isClient ? 4 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("loading_appointments")}
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isClient ? 4 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_appointments_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((app) => {
                  const normalizedStatus = (app.status || "").toLowerCase();
                  const canCheckIn = canCheckInAppointment(app);
                  const canCancel = canCancelAppointment(app);
                  const isSelected = selectedAppointmentIds.includes(
                    app.appointment_id,
                  );
                  return (
                    <TableRow
                      key={app.appointment_id}
                      className="border-b border-tint/5 hover:bg-tint/5 transition-colors group/row"
                    >
                      <TableCell className="py-4 px-4">
                        {canCancel && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleAppointmentSelection(app.appointment_id)
                            }
                            className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
                            aria-label="Select appointment"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                            {getPetName(app.pet_id)}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {app.appointment_date
                              ? new Date(app.appointment_date).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "—"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-50">
                            {app.appointment_id.slice(0, 8)}…
                          </span>
                        </div>
                      </TableCell>
                      {!isClient && (
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-bold text-muted-foreground/80">
                            {getClientName(app.client_id)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="py-4 px-6">
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                            normalizedStatus === "confirmed"
                              ? "bg-emerald/10 text-emerald"
                              : normalizedStatus === "pending"
                                ? "bg-sky-500/10 text-sky-400"
                                : normalizedStatus === "completed"
                                  ? "bg-purple-500/10 text-purple-300"
                                  : "bg-red-500/10 text-red-400",
                          )}
                        >
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {(canCheckIn || canCancel) && (
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
                              className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2 w-56 shadow-2xl"
                            >
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                                {t("operations")}
                              </DropdownMenuLabel>
                              {canCheckIn && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCheckIn(app.appointment_id)
                                  }
                                  className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />{" "}
                                  {t("check_in_patient")}
                                </DropdownMenuItem>
                              )}
                              {canCheckIn && canCancel && (
                                <DropdownMenuSeparator className="bg-tint/5 mx-2" />
                              )}
                              {canCancel && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(app.appointment_id)
                                  }
                                  className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                                >
                                  {t("cancel_appointment")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Booking Form */}
      <DashboardForm
        title={t("book_appointment_title")}
        description={t("schedule_new_session")}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={formik.isSubmitting ? t("booking") : t("confirm_booking")}
      >
        <div className="space-y-6">
          {/* Client selector — only for staff/owner roles */}
          {!isClient && (
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("client_owner")} *
              </Label>
              <Select
                value={formik.values.client_id}
                onValueChange={(val) => {
                  formik.setFieldValue("client_id", val);
                  // Reset pet when client changes
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
                  {clientsList.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {t("no_clients_found")}
                    </div>
                  ) : (
                    clientsList.map((client) => (
                      <SelectItem
                        key={client.user_id}
                        value={client.user_id}
                        className="rounded-xl font-bold"
                      >
                        {client.fullname}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formik.errors.client_id && formik.touched.client_id && (
                <p className="text-xs text-red-400 ml-1">
                  {formik.errors.client_id}
                </p>
              )}
            </div>
          )}

          {/* Pet selector */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("select_pet_label")} *
            </Label>
            <Select
              value={formik.values.pet_id}
              onValueChange={(val) => formik.setFieldValue("pet_id", val)}
              disabled={!isClient && !formik.values.client_id}
            >
              <SelectTrigger
                className={cn(
                  "h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
                  formik.errors.pet_id &&
                    formik.touched.pet_id &&
                    "border-red-500/50",
                )}
              >
                <SelectValue
                  placeholder={
                    isClient
                      ? t("select_pet_label")
                      : formik.values.client_id
                        ? t("select_pet_label")
                        : t("select_pet_choose_client")
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl">
                {clientPets.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {isClient
                      ? t("no_pets_registered")
                      : t("no_pets_for_client")}
                  </div>
                ) : (
                  clientPets.map((pet) => (
                    <SelectItem
                      key={pet.pet_id}
                      value={pet.pet_id}
                      className="rounded-xl font-bold"
                    >
                      {pet.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formik.errors.pet_id && formik.touched.pet_id && (
              <p className="text-xs text-red-400 ml-1">
                {formik.errors.pet_id}
              </p>
            )}
          </div>

          {/* Appointment Date */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t("appointment_date")}
            </Label>
            <Input
              type="date"
              name="appointment_date"
              value={formik.values.appointment_date}
              onChange={formik.handleChange}
              className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t("reason")}
            </Label>
            <Input
              name="reason"
              value={formik.values.reason}
              onChange={formik.handleChange}
              placeholder={t("reason_placeholder")}
              className="h-14 bg-tint/5 border-tint/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
        </div>
      </DashboardForm>
    </motion.div>
  );
}
