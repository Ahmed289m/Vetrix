"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Search,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useFormik } from "formik";
import { toast } from "sonner";
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

export default function AppointmentsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState<DateRangeFilter>("all");
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

  const appointments = appData?.data ?? EMPTY_APPOINTMENTS;
  const petsList = petsData?.data || [];

  // For CLIENT: empty list — they see their own name directly
  const clientsList = isClient
    ? []
    : (usersData?.data || []).filter((u) => u.role === "client");

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
        onSuccess: () => toast.success(t("appointment_cancelled")),
        onError: () => toast.error(t("appointment_cancel_failed")),
      });
    }
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_appointments")}
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
            <SelectItem value="all">{t("all_statuses_filter")}</SelectItem>
            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={dateFilter}
          onValueChange={(v) => setDateFilter(v as DateRangeFilter)}
        >
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="today">{t("today_filter")}</SelectItem>
            <SelectItem value="week">{t("this_week")}</SelectItem>
            <SelectItem value="month">{t("this_month")}</SelectItem>
            <SelectItem value="all">{t("all_time")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-3xl sm:rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-3xl sm:rounded-4xl border border-white/5 overflow-x-auto shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("schedule_id_pet")}
                </TableHead>
                {!isClient && (
                  <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                    {t("owner")}
                  </TableHead>
                )}
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-6 px-8 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {appLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isClient ? 3 : 4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("loading_appointments")}
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isClient ? 3 : 4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_appointments_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((app) => {
                  const normalizedStatus = (app.status || "").toLowerCase();
                  const canCheckIn = isStaff && normalizedStatus === "pending";
                  const canCancel =
                    normalizedStatus === "pending" ||
                    normalizedStatus === "confirmed";
                  return (
                    <TableRow
                      key={app.appointment_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group/row"
                    >
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center gap-4">
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
                        </div>
                      </TableCell>
                      {!isClient && (
                        <TableCell className="py-6 px-8">
                          <span className="text-sm font-bold text-muted-foreground/80">
                            {getClientName(app.client_id)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="py-6 px-8">
                        <Badge
                          className={cn(
                            "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
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
                      <TableCell className="py-6 px-8 text-right">
                        {(canCheckIn || canCancel) && (
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
                                {t("operations")}
                              </DropdownMenuLabel>

                              {canCheckIn && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCheckIn(app.appointment_id)
                                  }
                                  className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {t("check_in_patient")}
                                </DropdownMenuItem>
                              )}

                              {canCheckIn && canCancel && (
                                <DropdownMenuSeparator className="bg-white/5 mx-2" />
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
                    "h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
                    formik.errors.client_id &&
                      formik.touched.client_id &&
                      "border-red-500/50",
                  )}
                >
                  <SelectValue placeholder={t("select_client")} />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
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
                  "h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold",
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
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
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
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
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
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
