"use client";

import { useMemo, useState } from "react";
import { motion } from "@/app/_components/fast-motion";
import {
  CalendarCheck,
  FileText,
  Heart,
  Activity,
  Pill,
  AlertCircle,
  Play,
} from "lucide-react";
import { fadeUp, stagger } from "@/app/_lib/utils/shared-animations";
import SimulationMode from "@/app/_components/SimulationMode";
import { useLang } from "@/app/_hooks/useLanguage";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { useVisits } from "@/app/_hooks/queries/use-visits";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useDrugs } from "@/app/_hooks/queries/use-drugs";
import type {
  Appointment,
  Pet,
  Prescription,
  Visit,
  Drug,
} from "@/app/_lib/types/models";

const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_PRESCRIPTIONS: Prescription[] = [];
const EMPTY_VISITS: Visit[] = [];
const EMPTY_PETS: Pet[] = [];
const EMPTY_DRUGS: Drug[] = [];

export function StaffDashboard() {
  const [showSim, setShowSim] = useState(false);
  const { t } = useLang();

  const { data: appointmentsData } = useAppointments();
  const { data: prescriptionsData } = usePrescriptions();
  const { data: visitsData } = useVisits();
  const { data: petsData } = usePets();
  const { data: drugsData } = useDrugs();

  const appointments = appointmentsData?.data ?? EMPTY_APPOINTMENTS;
  const prescriptions = prescriptionsData?.data ?? EMPTY_PRESCRIPTIONS;
  const visits = visitsData?.data ?? EMPTY_VISITS;
  const pets = petsData?.data ?? EMPTY_PETS;
  const drugs = drugsData?.data ?? EMPTY_DRUGS;

  const staffStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date ?? "");
      return aptDate >= todayStart && aptDate < todayEnd;
    }).length;

    const upcomingAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date ?? "");
      const normalized = apt.status?.toLowerCase() ?? "";
      return (
        aptDate >= now &&
        (normalized === "scheduled" || normalized === "pending")
      );
    }).length;

    const pendingPrescriptions = prescriptions.filter((rx) => {
      const normalized = rx.status?.toLowerCase() ?? "";
      return normalized === "pending" || normalized === "processing";
    }).length;

    const todayVisits = visits.filter((visit) => {
      const visitDate = new Date(visit.date);
      return visitDate >= todayStart && visitDate < todayEnd;
    }).length;

    const activePatients = pets.filter((pet) => pet.is_active ?? true).length;

    const lowStockDrugs = 0; // Drugs no longer track quantity directly

    return {
      todayAppointments,
      upcomingAppointments,
      pendingPrescriptions,
      todayVisits,
      activePatients,
      lowStockDrugs,
    };
  }, [appointments, prescriptions, visits, pets, drugs]);

  const statCards = [
    {
      label: t("todays_appointments"),
      value: staffStats.todayAppointments,
      icon: CalendarCheck,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: t("upcoming_appointments"),
      value: staffStats.upcomingAppointments,
      icon: Activity,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: t("pending_prescriptions"),
      value: staffStats.pendingPrescriptions,
      icon: FileText,
      color: staffStats.pendingPrescriptions > 0 ? "text-coral" : "text-orange",
      bg: staffStats.pendingPrescriptions > 0 ? "bg-coral/10" : "bg-orange/10",
      border:
        staffStats.pendingPrescriptions > 0
          ? "border-coral/20"
          : "border-orange/20",
    },
    {
      label: t("active_patients"),
      value: staffStats.activePatients,
      icon: Heart,
      color: "text-violet",
      bg: "bg-violet/10",
      border: "border-violet/20",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("clinic_operations")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">
            {t("staff_dashboard")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {t("manage_appointments_prescriptions_and_patient_care")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowSim(!showSim)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            showSim
              ? "bg-coral/10 border border-coral/30 text-coral"
              : "gradient-emerald-cyan text-primary-foreground glow-emerald"
          }`}
        >
          <Play className="w-4 h-4" />
          {showSim ? t("exit_sim") : t("simulation")}
        </motion.button>
      </motion.div>

      {/* Simulation Mode */}
      {showSim && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
        >
          <SimulationMode role="staff" />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <motion.div
              key={s.label}
              className={`glass-card p-5 border ${s.border} card-hover cursor-default`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}
              >
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <motion.p
                className="text-3xl font-extrabold mt-4 tabular-nums"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {typeof s.value === "number"
                  ? s.value.toLocaleString()
                  : s.value}
              </motion.p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 mt-8"
      >
        <h3 className="text-lg font-bold mb-5">
          {t("staff_priority_summary")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("todays_workload")}
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-emerald">
              {staffStats.todayAppointments + staffStats.todayVisits}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {staffStats.todayAppointments} {t("appointments")},{" "}
              {staffStats.todayVisits} {t("visits")}
            </p>
          </div>
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("action_required")}
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-cyan">
              {staffStats.pendingPrescriptions}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("prescriptions_pending")}
            </p>
          </div>
          <div
            className={`rounded-xl border ${
              staffStats.lowStockDrugs > 0
                ? "border-coral/20 bg-coral/5"
                : "border-orange/20 bg-orange/5"
            } p-4`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("inventory_status")}
            </p>
            <p
              className={`mt-2 text-2xl font-extrabold tabular-nums ${
                staffStats.lowStockDrugs > 0 ? "text-coral" : "text-orange"
              }`}
            >
              {staffStats.lowStockDrugs}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {staffStats.lowStockDrugs > 0
                ? t("drugs_low")
                : t("stock_healthy")}
            </p>
          </div>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-emerald" />
          {t("data_source_summary")}
        </div>
      </motion.div>

      {staffStats.pendingPrescriptions > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-coral/20 bg-coral/5 p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-coral mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {t("pending_prescriptions")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {staffStats.pendingPrescriptions} -{" "}
              {t("pending_prescriptions_alert")}
            </p>
          </div>
        </motion.div>
      )}

      {staffStats.lowStockDrugs > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-orange/20 bg-orange/5 p-4 flex items-start gap-3"
        >
          <Pill className="w-5 h-5 text-orange mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{t("low_drug_stock")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {staffStats.lowStockDrugs} - {t("low_stock_alert")}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
