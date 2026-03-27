"use client";

import * as React from "react";
import { Plus, MoreHorizontal, FileText, User, Pill, Search, Download, Trash2, ShieldCheck } from "lucide-react";
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

const mockPrescriptions = [
  { id: "RX-9901", petName: "Max", doctorName: "Dr. Sarah", date: "2024-03-27", medication: "Amoxicillin", status: "Active" },
  { id: "RX-9902", petName: "Luna", doctorName: "Dr. Mike", date: "2024-03-25", medication: "Meloxicam", status: "Expired" },
  { id: "RX-9903", petName: "Rocky", doctorName: "Dr. Sarah", date: "2024-03-27", medication: "Prednisone", status: "Active" },
];

export default function PrescriptionsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRx, setSelectedRx] = React.useState<any>(null);

  const handleOpenForm = (rx: any = null) => {
    setSelectedRx(rx);
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
            <FileText className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Pharmacy Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Medical <span className="text-emerald">Prescriptions</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Review patient medication history and issue new clinical prescriptions.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
           New Prescription
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input 
            placeholder="Search by Rx ID, patient or medication..." 
            className="pl-12 h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
            <SelectItem value="all">All Prescriptions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Item */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-muted/40 backdrop-blur-md rounded-[2rem] border border-border/10 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/10 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Rx ID & Patient</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Primary Medication</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Doctor / Date</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Status</TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPrescriptions.map((rx) => (
                <TableRow key={rx.id} className="border-b border-border/10 hover:bg-muted/40 transition-colors group/row">
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md uppercase">
                        {rx.id}
                      </span>
                      <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                        {rx.petName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2">
                       <Pill className="w-4 h-4 text-emerald" />
                      <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                        {rx.medication}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                     <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-muted-foreground/80 leading-none">
                        {rx.doctorName}
                      </span>
                      <span className="text-xs text-muted-foreground/40 font-bold">
                        {rx.date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <Badge className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                      rx.status === "Active" ? "bg-emerald/10 text-emerald" : "bg-muted/40 text-muted-foreground"
                    )}>
                      {rx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="group-hover/row:bg-muted/50 rounded-xl h-10 w-10">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border/10 rounded-2xl p-2 w-56 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Pharmacy Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                          <Download className="w-4 h-4" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Verify Signature
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-muted/40 mx-2" />
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Revoke
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
        title="Issue Prescription"
        description="Select a patient and medications to generate a clinical prescription."
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel="Generate Rx"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Patient</Label>
            <Select defaultValue="max">
              <SelectTrigger className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/10">
                <SelectItem value="max">Max (Golden Retriever)</SelectItem>
                <SelectItem value="luna">Luna (Persian Cat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/10">
            <Label className="text-sm font-black uppercase tracking-widest text-emerald ml-1">Medication Details</Label>
            <div className="grid gap-4 mt-2">
               <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Drug Name</Label>
                <Input placeholder="e.g. Amoxicillin 500mg" className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Dosage</Label>
                  <Input placeholder="1 tablet" className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Frequency</Label>
                  <Input placeholder="Twice daily" className="h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/10">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Clinical Instructions</Label>
            <textarea 
              placeholder="Take with food, full 7 day course..." 
              className="w-full min-h-[100px] p-4 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium outline-none transition-all"
            />
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
