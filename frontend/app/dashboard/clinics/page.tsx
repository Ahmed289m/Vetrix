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
import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const { user } = useAuth();
  const { t } = useLang();

  const { data: clinicsData, isLoading: clinicsLoading } = useClinics();
  const { data: usersData } = useUsers();

  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const deleteClinic = useDeleteClinic();

  const clinics = clinicsData?.data || [];
  const users = usersData?.data || [];

  const filteredClinics = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clinics.filter((clinic) => {
      const ownerName = getClinicOwner(clinic.clinic_id).toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        clinic.clinicName.toLowerCase().includes(q) ||
        clinic.address.toLowerCase().includes(q) ||
        ownerName.includes(q);
      const matchesStatus =
        statusFilter === "all" || clinic.subscriptionStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clinics, searchQuery, statusFilter, users]);

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
    if (confirm(t("confirm_delete_clinic"))) {
      deleteClinic.mutate(id);
    }
  };

  const getClinicOwner = (clinicId: string) => {
    const owner = users.find(
      (u) => u.clinic_id === clinicId && u.role === "owner",
    );
    return owner ? owner.fullname : t("no_owner_assigned");
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("global_network")}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            {t("clinic_management")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("manage_clinic_network")}
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          {t("add_new_clinic")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder={t("search_clinics")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5">
            <SelectItem value="all">{t("all_statuses")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white/5 backdrop-blur-md rounded-4xl border border-white/5 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("clinic_info")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("location")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("owner")}
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("status")}
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
                    {t("loading_clinics")}
                  </TableCell>
                </TableRow>
              ) : filteredClinics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_clinics_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinics.map((clinic) => (
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
                        {t(clinic.subscriptionStatus)}
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
                            {t("clinic_settings")}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(clinic)}
                            className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            {t("configure_details")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          {(user?.role === "admin" ||
                            user?.role === "owner") && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(clinic.clinic_id)}
                              className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold"
                            >
                              {t("delete_clinic")}
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
        title={
          selectedClinic ? t("update_clinic_details") : t("register_branch")
        }
        description={
          selectedClinic
            ? `${t("configuring_settings_for")} ${selectedClinic.clinicName}`
            : t("connect_new_branch")
        }
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(e) =>
          formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
        submitLabel={
          formik.isSubmitting
            ? t("saving")
            : selectedClinic
              ? t("save_settings")
              : t("register_clinic")
        }
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("clinic_name")}
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                name="clinicName"
                value={formik.values.clinicName}
                onChange={formik.handleChange}
                placeholder={t("central_vet")}
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              {t("address")}
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                placeholder={t("city_country")}
                className="pl-12 h-14 bg-white/5 border-white/5 focus:border-emerald/30 focus:ring-emerald/20 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                {t("phone")}
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
                {t("subscription")}
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
                    {t("active")}
                  </SelectItem>
                  <SelectItem value="trial" className="rounded-xl font-bold">
                    {t("trial")}
                  </SelectItem>
                  <SelectItem value="expired" className="rounded-xl font-bold">
                    {t("expired")}
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
