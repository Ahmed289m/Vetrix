"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Store,
  MapPin,
  User,
  Search,
  Building2,
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

import {
  useClinics,
  useCreateClinic,
  useUpdateClinic,
  useDeleteClinic,
} from "@/app/_hooks/queries/use-clinics";
import { useUsers } from "@/app/_hooks/queries/use-users";
import type { Clinic } from "@/app/_lib/types/models";

export default function ClinicsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClinic, setSelectedClinic] = React.useState<Clinic | null>(
    null,
  );

  const { data: clinicsData, isLoading: clinicsLoading } = useClinics();
  const { data: usersData } = useUsers();

  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const deleteClinic = useDeleteClinic();

  const clinics = clinicsData?.data || [];
  const users = usersData?.data || [];

  const formik = useFormik({
    initialValues: {
      clinicName: "",
      address: "",
      phone: "",
      subscriptionStatus: "active",
    },
    onSubmit: (values, { setSubmitting }) => {
      if (selectedClinic) {
        updateClinic.mutate(
          { id: selectedClinic.clinic_id, data: values },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSubmitting(false);
            },
            onError: () => setSubmitting(false),
          },
        );
      } else {
        createClinic.mutate(values, {
          onSuccess: () => {
            setIsFormOpen(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      }
    },
  });

  const handleOpenForm = (clinic?: Clinic) => {
    if (clinic) {
      setSelectedClinic(clinic);
      formik.setValues({
        clinicName: clinic.clinicName,
        address: clinic.address,
        phone: clinic.phone,
        subscriptionStatus: clinic.subscriptionStatus,
      });
    } else {
      setSelectedClinic(null);
      formik.resetForm();
    }
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this clinic?")) {
      deleteClinic.mutate(id);
    }
  };

  const getClinicOwner = (clinicId: string) => {
    const owner = users.find(
      (u) => u.clinic_id === clinicId && u.role === "owner",
    );
    return owner ? owner.fullname : "No Owner Assigned";
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              Global Network
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Clinic <span className="text-emerald">Management</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your veterinary clinic network, locations, and settings.
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add New Clinic
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search by clinic name or location..."
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
                  Clinic Info
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Location
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
              {clinicsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading clinics...
                  </TableCell>
                </TableRow>
              ) : clinics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No clinics active context.
                  </TableCell>
                </TableRow>
              ) : (
                clinics.map((clinic) => (
                  <TableRow
                    key={clinic.clinic_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group/row"
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald font-black text-lg shadow-inner group-hover/row:bg-emerald/10 transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                            {clinic.clinicName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            ID: {clinic.clinic_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-sm font-bold text-foreground/80 leading-none">
                          {clinic.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald/60" />
                        <span className="text-sm font-bold text-muted-foreground/80">
                          {getClinicOwner(clinic.clinic_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                          clinic.subscriptionStatus !== "expired"
                            ? "bg-emerald/10 text-emerald"
                            : "bg-orange-500/10 text-orange-400",
                        )}
                      >
                        {clinic.subscriptionStatus}
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
                            Clinic Settings
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(clinic)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            Configure Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(clinic.clinic_id)}
                            className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                          >
                            Delete Clinic
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
        title={selectedClinic ? "Update Clinic Details" : "Register Branch"}
        description={
          selectedClinic
            ? `Configuring settings for ${selectedClinic.clinicName}`
            : "Connect a new veterinary branch to the Vetrix network."
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formik.isSubmitting
            ? "Saving..."
            : selectedClinic
              ? "Save Settings"
              : "Register Clinic"
        }
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Clinic Name
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                name="clinicName"
                value={formik.values.clinicName}
                onChange={formik.handleChange}
                placeholder="Central Vet"
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Address
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                placeholder="City, Country"
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Phone
              </Label>
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                placeholder="+123456789"
                className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Subscription
              </Label>
              <Select
                value={formik.values.subscriptionStatus}
                onValueChange={(val) =>
                  formik.setFieldValue("subscriptionStatus", val)
                }
              >
                <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl">
                  <SelectItem value="active" className="rounded-xl font-bold">
                    Active
                  </SelectItem>
                  <SelectItem value="trial" className="rounded-xl font-bold">
                    Trial
                  </SelectItem>
                  <SelectItem value="expired" className="rounded-xl font-bold">
                    Expired
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
