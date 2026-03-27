"use client";

import * as React from "react";
import { Plus, MoreHorizontal, User, FileText, Hash, Eye, Search, Calendar, CheckCircle2 } from "lucide-react";
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

// Mock data
const mockCases = [
  { id: "CASE-001", patientName: "Max", ownerName: "Ahmed", doctorName: "Dr. Sarah", reason: "Annual Vaccination", date: "2024-03-27", status: "Ongoing" },
  { id: "CASE-002", patientName: "Luna", ownerName: "Sarah Connor", doctorName: "Dr. Mike", reason: "Skin Allergy", date: "2024-03-26", status: "Completed" },
  { id: "CASE-003", patientName: "Rocky", ownerName: "John Doe", doctorName: "Dr. Sarah", reason: "Post-surgery checkup", date: "2024-03-27", status: "Waiting" },
];

export default function CasesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<any>(null);

  const handleOpenForm = (caseItem: any = null) => {
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Clinical Tracker</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Visits & <span className="text-emerald">Cases</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Monitor ongoing clinical cases, visit history and medical progress.
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Create New Case
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by case ID, patient or reason..."
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">All Doctors</SelectItem>
            <SelectItem value="sarah">Dr. Sarah</SelectItem>
            <SelectItem value="mike">Dr. Mike</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Case ID & Patient</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Reason & Doctor</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Visit Date</TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCases.map((caseItem) => (
                <TableRow key={caseItem.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md">
                        {caseItem.id}
                      </span>
                      <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                        {caseItem.patientName}
                        <span className="text-muted-foreground/50 font-medium text-xs ml-1.5">(Owner: {caseItem.ownerName})</span>
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
                        {new Date(caseItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="group-hover/row:bg-white/10 rounded-xl h-10 w-10">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-56 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Case Operations</DropdownMenuLabel>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CRUD Form */}
      <DashboardForm
        title={selectedCase ? "Update Clinical Case" : "Register Visit"}
        description={selectedCase ? `Updating records for case ${selectedCase.id}` : "Provide initial diagnosis and assignment for the clinical visit."}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel={selectedCase ? "Save Case Profile" : "Open Case"}
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Pet ID</Label>
              <Input
                placeholder="PET-001"
                defaultValue={selectedCase?.pet_id}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Client ID</Label>
              <Input
                placeholder="CLI-001"
                defaultValue={selectedCase?.client_id}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Doctor ID</Label>
              <Input
                placeholder="DOC-001"
                defaultValue={selectedCase?.doctor_id}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Prescription ID</Label>
              <Input
                placeholder="RX-001"
                defaultValue={selectedCase?.prescription_id}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Visit Date</Label>
            <Input
              type="date"
              defaultValue={selectedCase?.date}
              className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Clinical Notes</Label>
            <textarea
              placeholder="Detailed observations and findings..."
              defaultValue={selectedCase?.notes}
              className="w-full min-h-[140px] p-5 bg-white/5 border border-white/5 focus:border-emerald/30 focus:ring-1 focus:ring-emerald/20 rounded-2xl font-medium outline-none transition-all"
            />
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
