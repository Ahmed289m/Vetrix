"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Hash,
  Search,
  Calendar,
  CheckCircle2,
} from "lucide-react";
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
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useVisits } from "@/app/_hooks/queries/use-visits";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useAuth } from "@/app/_hooks/useAuth";

type CaseItem = {
  id: string;
  patientName: string;
  ownerName: string;
  doctorName: string;
  reason: string;
  date: string;
  status: string;
};

export default function CasesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [doctorFilter, setDoctorFilter] = React.useState("all");
  const { user } = useAuth();

  // Fetch real data
  const { data: visitsData } = useVisits();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();

  // Convert visits to case items and sort by date
  const cases: CaseItem[] = React.useMemo(() => {
    const visits = visitsData?.data || [];
    const pets = petsData?.data || [];
    const users = usersData?.data || [];

    return visits
      .map((visit: any) => {
        const pet = pets.find((p: any) => p.pet_id === visit.pet_id);
        const doctor = users.find((u: any) => u.user_id === visit.doctor_id);
        const owner = pets.find(
          (p: any) => p.pet_id === visit.pet_id,
        )?.owner_id;
        const ownerUser = users.find((u: any) => u.user_id === owner);

        return {
          id: visit.visit_id,
          patientName: pet?.name || "Unknown",
          ownerName: ownerUser?.fullname || "Unknown",
          doctorName: doctor?.fullname || "Unknown",
          reason: visit.reason || "Clinical Visit",
          date: visit.date || new Date().toISOString(),
          status: "Completed",
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visitsData, petsData, usersData]);

  const doctors = React.useMemo(() => {
    const users = usersData?.data || [];
    return users.filter((u: any) => u.role === "doctor");
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

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              Clinical Tracker
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Visits & <span className="text-emerald">Cases</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Monitor ongoing clinical cases, visit history and medical progress.
          </p>
        </div>
        {user?.role === "doctor" && (
          <Button
            onClick={() => handleOpenForm()}
            className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New Case
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by case ID, patient or reason..."
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
            <SelectItem value="all">All Doctors</SelectItem>
            {doctors.map((doc: any) => (
              <SelectItem key={doc.user_id} value={doc.fullname}>
                {doc.fullname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-4xl border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Case ID & Patient
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Reason & Doctor
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Visit Date
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
                    No cases found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group/row"
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md">
                          {caseItem.id}
                        </span>
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                          {caseItem.patientName}
                          <span className="text-muted-foreground/50 font-medium text-xs ml-1.5">
                            (Owner: {caseItem.ownerName})
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
                          Assigned: {caseItem.doctorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-sm font-bold text-muted-foreground/80">
                          {new Date(caseItem.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
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
                            Case Operations
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(caseItem)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Clinical Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">
                            Delete Record
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
        title={selectedCase ? "Update Clinical Case" : "Register Visit"}
        description={
          selectedCase
            ? `Updating records for case ${selectedCase.id}`
            : "Provide initial diagnosis and assignment for the clinical visit."
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel={selectedCase ? "Save Case Profile" : "Open Case"}
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Pet ID
              </Label>
              <Input
                placeholder="PET-001"
                defaultValue={selectedCase?.id}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Client ID
              </Label>
              <Input
                placeholder="CLI-001"
                defaultValue={selectedCase?.ownerName}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Doctor ID
              </Label>
              <Input
                placeholder="DOC-001"
                defaultValue={selectedCase?.doctorName}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Prescription ID
              </Label>
              <Input
                placeholder="RX-001"
                defaultValue={selectedCase?.reason}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Visit Date
            </Label>
            <Input
              type="date"
              defaultValue={selectedCase?.date}
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Clinical Notes
            </Label>
            <textarea
              placeholder="Detailed observations and findings..."
              defaultValue={selectedCase?.reason}
              className="w-full min-h-35 p-5 bg-white/5 border border-white/5 focus:border-emerald/30 focus:ring-1 focus:ring-emerald/20 rounded-2xl font-medium outline-none transition-all"
            />
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
