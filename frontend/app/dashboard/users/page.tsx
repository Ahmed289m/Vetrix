"use client";

import * as React from "react";
import { Plus, MoreHorizontal, User, Mail, Shield, Store, Search } from "lucide-react";
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
const mockUsers = [
  { id: "1", name: "Ahmed", email: "ahmed@vetrix.com", role: "owner", clinic: "Central Vet", status: "active" },
  { id: "2", name: "Sarah Connor", email: "sarah@vetrix.com", role: "doctor", clinic: "Central Vet", status: "active" },
  { id: "3", name: "John Doe", email: "john@vetrix.com", role: "staff", clinic: "West Side Clinic", status: "inactive" },
];

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);

  const handleOpenForm = (user: any = null) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now just close the form
    setIsFormOpen(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            User <span className="text-emerald">Management</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your clinic staff, doctors, and global administrators.
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

      {/* Filters & Search */}
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

      {/* Table Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald/10 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">User Info</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Role</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Clinic</TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Status</TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/20 flex items-center justify-center text-emerald font-black text-lg shadow-inner">
                        {user.name[0]}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors">
                          {user.name}
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
                        {user.clinic}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <Badge className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                      user.status === "active" ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-400"
                    )}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="group-hover/row:bg-white/10 rounded-xl h-10 w-10">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2 w-48 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenForm(user)}
                          className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold"
                        >
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold">
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">
                          Deactivate
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
        title={selectedUser ? "Edit User" : "Create New User"}
        description={selectedUser ? `Modifying profile for ${selectedUser.name}` : "Invite a new member to your clinic by providing their details."}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel={selectedUser ? "Update User" : "Create User"}
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                placeholder="Ahmed"
                defaultValue={selectedUser?.fullname || selectedUser?.name}
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
                <Input
                  type="email"
                  placeholder="ahmed@vetrix.com"
                  defaultValue={selectedUser?.email}
                  className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Phone Number</Label>
              <Input
                placeholder="+123456789"
                defaultValue={selectedUser?.phone}
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Role Type</Label>
              <Select defaultValue={selectedUser?.role || "staff"}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="owner" className="rounded-xl font-bold">Owner</SelectItem>
                  <SelectItem value="doctor" className="rounded-xl font-bold">Doctor</SelectItem>
                  <SelectItem value="staff" className="rounded-xl font-bold">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Clinic</Label>
              <Select defaultValue={selectedUser?.clinic || "central"}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-black uppercase tracking-tight text-left px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="central" className="rounded-xl font-bold">Central Vet</SelectItem>
                  <SelectItem value="west" className="rounded-xl font-bold">West Side Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedUser && (
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Temporary Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
              <p className="text-[10px] text-muted-foreground font-bold italic px-2">
                User will be prompted to change this upon first login.
              </p>
            </div>
          )}
        </div>
      </DashboardForm>
    </div>
  );
}
