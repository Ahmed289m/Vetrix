"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Search,
  CheckCircle,
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
import { sortByDate } from "@/app/_lib/utils/date-filter";
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

export default function AppointmentsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState<DateRangeFilter>("all");
  const { user } = useAuth();

  const { data: appData, isLoading: appLoading } = useAppointments();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();

  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const updateAppointment = useUpdateAppointment();

  const appointments = appData?.data || [];
  const petsList = petsData?.data || [];
  const clientsList = (usersData?.data || []).filter(
    (u) => u.role === "client",
  );

  // Sort appointments by date
  const sortedAppointments = React.useMemo(
    () => sortByDate(appointments, "appointment_date", "desc"),
    [appointments],
  );

  const getPetName = (petId: string) =>
    petsList.find((p) => p.pet_id === petId)?.name || "Unknown Pet";
  const getClientName = (clientId: string) =>
    clientsList.find((c) => c.user_id === clientId)?.fullname ||
    "Unknown Owner";

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
  }, [
    sortedAppointments,
    dateFilter,
    searchQuery,
    statusFilter,
    petsList,
    clientsList,
  ]);

  const formik = useFormik({
    initialValues: {
      pet_id: "",
      client_id: "",
    },
    onSubmit: (values, { setSubmitting }) => {
      createAppointment.mutate(values, {
        onSuccess: () => {
          setIsFormOpen(false);
          setSubmitting(false);
        },
        onError: () => setSubmitting(false),
      });
    },
  });

  const handleOpenForm = () => {
    formik.resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Cancel this appointment?")) {
      deleteAppointment.mutate(id);
    }
  };

  const handleCheckIn = (appointmentId: string) => {
    updateAppointment.mutate(
      { id: appointmentId, data: { status: "confirmed" } },
      {
        onSuccess: () => {
          // Toast notification is handled by the mutation
        },
        onError: () => {
          // Error handling is done in the mutation
        },
      },
    );
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              Scheduling Portal
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Bookings & <span className="text-emerald">Appointments</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your daily clinic schedule, patient arrivals and
            availability.
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Book Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by ID, pet or owner..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Item */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-4xl border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Schedule ID & Pet
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Owner
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading appointments...
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((app) => (
                  <TableRow
                    key={app.appointment_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group/row"
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                            {getPetName(app.pet_id)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-50">
                            {app.appointment_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <span className="text-sm font-bold text-muted-foreground/80">
                        {getClientName(app.client_id)}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                          app.status === "confirmed"
                            ? "bg-emerald/10 text-emerald"
                            : "bg-orange-500/10 text-orange-400",
                        )}
                      >
                        {app.status}
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
                          className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-56 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                            Operations
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleCheckIn(app.appointment_id)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Check In Patient
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          {(user?.role === "staff" ||
                            user?.role === "owner" ||
                            user?.role === "admin") && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(app.appointment_id)}
                              className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                            >
                              Cancel
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
        title="Book Appointment"
        description="Schedule a new clinical session for a patient."
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={formik.isSubmitting ? "Booking..." : "Confirm Booking"}
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Client Owner
            </Label>
            <Select
              value={formik.values.client_id}
              onValueChange={(val) => formik.setFieldValue("client_id", val)}
            >
              <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                {clientsList.map((client) => (
                  <SelectItem
                    key={client.user_id}
                    value={client.user_id}
                    className="rounded-xl font-bold"
                  >
                    {client.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Select Pet
            </Label>
            <Select
              value={formik.values.pet_id}
              onValueChange={(val) => formik.setFieldValue("pet_id", val)}
              disabled={!formik.values.client_id}
            >
              <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold">
                <SelectValue placeholder="Select Pet (Choose Client First)" />
              </SelectTrigger>
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                {petsList
                  .filter((p) => p.client_id === formik.values.client_id)
                  .map((pet) => (
                    <SelectItem
                      key={pet.pet_id}
                      value={pet.pet_id}
                      className="rounded-xl font-bold"
                    >
                      {pet.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
