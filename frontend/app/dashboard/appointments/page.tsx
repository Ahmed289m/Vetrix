"use client";

import * as React from "react";
import { Plus, MoreHorizontal, Calendar, Clock, User, Phone, Search, Bell, CheckCircle, Dog } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
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
import { cn } from "@/lib/utils";

const mockAppointments = [
  { id: "APP-101", petName: "Max", ownerName: "Ahmed", date: "2024-03-27", type: "Vaccination", status: "Confirmed" },
  { id: "APP-102", petName: "Luna", ownerName: "Sarah Connor", date: "2024-03-27", type: "Checkup", status: "Pending" },
  { id: "APP-103", petName: "Rocky", ownerName: "John Doe", date: "2024-03-27", type: "Surgery", status: "Confirmed" },
];

export default function AppointmentsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<any>(null);

  const handleOpenForm = (app: any = null) => {
    setSelectedApp(app);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormOpen(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Scheduling Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Bookings & <span className="text-emerald">Appointments</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your daily clinic schedule, patient arrivals and availability.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by ID, pet or owner..."
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="date"
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Item */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Schedule & Pet</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Booking Type</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Owner</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Status</TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAppointments.map((app) => (
                <TableRow key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center h-12 w-28 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/50 leading-none mb-1 text-center">Date</span>
                        <span className="text-xs font-black text-emerald tracking-tighter text-center">
                          {new Date(app.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                          {app.petName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-50">
                          {app.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                      {app.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <span className="text-sm font-bold text-muted-foreground/80">
                      {app.ownerName}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <Badge className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                      app.status === "Confirmed" ? "bg-emerald/10 text-emerald" : "bg-orange-500/10 text-orange-400"
                    )}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="group-hover/row:bg-white/10 rounded-xl h-10 w-10">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-56 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Operations</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Check In Patient
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                          <Bell className="w-4 h-4" /> Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">Reschedule</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
        onSubmit={handleSubmit}
        submitLabel="Confirm Booking"
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Pet ID</Label>
            <div className="relative group">
              <Dog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                placeholder="PET-001"
                defaultValue={selectedApp?.pet_id}
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Client ID</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                placeholder="CLI-001"
                defaultValue={selectedApp?.client_id}
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Appointment Date</Label>
              <Input
                type="date"
                defaultValue={selectedApp?.date}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Status</Label>
              <Select defaultValue={selectedApp?.status?.toLowerCase() || "pending"}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="pending" className="rounded-xl font-bold">Pending</SelectItem>
                  <SelectItem value="confirmed" className="rounded-xl font-bold">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-emerald ml-1">Appointment Notes</Label>
            <textarea
              placeholder="Special instructions..."
              className="w-full min-h-[140px] p-5 bg-white/5 border border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-medium outline-none transition-all"
            />
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
