"use client";

import * as React from "react";
import { Plus, MoreHorizontal, User, Phone, Heart, Dog, Cat, Search, Calendar } from "lucide-react";
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

// Mock data for clients (linking pets)
const mockClients = [
  { id: "CLI-001", name: "Ahmed", phone: "+123456789" },
  { id: "CLI-002", name: "Sarah Connor", phone: "+987654321" },
  { id: "CLI-003", name: "John Doe", phone: "+555666777" },
];

const mockPets = [
  { id: "1", petName: "Max", ownerId: "CLI-001", ownerName: "Ahmed", species: "Dog", breed: "Golden Retriever", contact: "+123456789", status: "Healthy" },
  { id: "2", petName: "Luna", ownerId: "CLI-002", ownerName: "Sarah Connor", species: "Cat", breed: "Persian", contact: "+987654321", status: "Under Treatment" },
  { id: "3", petName: "Rocky", ownerId: "CLI-003", ownerName: "John Doe", species: "Dog", breed: "German Shepherd", contact: "+555666777", status: "Healthy" },
];

export default function PetsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPet, setSelectedPet] = React.useState<any>(null);

  const handleOpenForm = (pet: any = null) => {
    setSelectedPet(pet);
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
            <Heart className="w-5 h-5 text-emerald fill-emerald/20" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Patient Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Patient <span className="text-emerald">Records</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage patient records, owner information, and clinical history.
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add New Patient
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by pet name, breed or owner..."
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="dog">Dogs</SelectItem>
            <SelectItem value="cat">Cats</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Patient & Owner</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Species/Breed</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Contact info</TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPets.map((pet) => (
                <TableRow key={pet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/20 flex items-center justify-center text-emerald font-black text-lg shadow-inner group-hover/row:scale-105 transition-transform duration-300">
                        {pet.species === "Dog" ? <Dog className="w-6 h-6" /> : <Cat className="w-6 h-6" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                          {pet.petName}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 opacity-50" />
                          {pet.ownerName}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                        {pet.species}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-widest bg-white/5 w-fit px-2 py-0.5 rounded-md">
                        {pet.breed}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground/60" />
                      <span className="text-sm font-bold text-muted-foreground/80">
                        {pet.contact}
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
                      <DropdownMenuContent align="end" className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-48 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Patient Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenForm(pet)}
                          className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                        >
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold">
                          Create Visit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold">
                          History Reports
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">
                          Archived Records
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
        title={selectedPet ? "Update Patient Profile" : "Register New Patient"}
        description={selectedPet ? `Modifying clinical records for ${selectedPet.petName}` : "Enter patient details and link them to an existing clinical owner."}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel={selectedPet ? "Save Profile" : "Register Patient"}
      >
        <div className="space-y-6">
          {/* Prominent Client Selection Box */}
          <div className="p-6 bg-emerald/5 border border-emerald/10 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-2 px-2">
              <User className="w-4 h-4 text-emerald" />
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Assigned Clinical Owner *</Label>
            </div>
            <Select defaultValue={selectedPet?.ownerId || ""}>
              <SelectTrigger className="h-16 bg-white/10 border-white/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-xl text-left px-5">
                <SelectValue placeholder="Search or Select Client" />
              </SelectTrigger>
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 max-h-[300px]">
                {mockClients.map(client => (
                  <SelectItem key={client.id} value={client.id} className="rounded-xl py-4 cursor-pointer focus:bg-emerald/10 focus:text-emerald">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-lg tracking-tight leading-none mb-1">{client.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{client.id} · {client.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="px-2 text-[10px] font-black text-muted-foreground/40 italic flex items-center gap-1.5 uppercase tracking-widest">
              <Plus className="w-3 h-3" /> Register new clients in the "Owners" section
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Patient Identity</Label>
              <div className="relative group/field">
                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-emerald transition-colors" />
                <Input
                  placeholder="Patient name..."
                  defaultValue={selectedPet?.petName}
                  className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Species Type</Label>
              <Select defaultValue={selectedPet?.species?.toLowerCase() || "dog"}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-widest text-xs text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="dog" className="rounded-xl font-bold">Dog</SelectItem>
                  <SelectItem value="cat" className="rounded-xl font-bold">Cat</SelectItem>
                  <SelectItem value="bird" className="rounded-xl font-bold">Bird</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Weight (KG)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="10.5"
                defaultValue={selectedPet?.weight || 12.0}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black text-lg"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Breed / Variety</Label>
              <Input
                placeholder="e.g. Golden Retriever"
                defaultValue={selectedPet?.breed}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
