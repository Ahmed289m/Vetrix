"use client";

import { useMemo } from "react";
import { motion } from "@/app/_components/fast-motion";
import { Users, Heart, CalendarCheck, FileText, Activity } from "lucide-react";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { useVisits } from "@/app/_hooks/queries/use-visits";
import type { Appointment, Pet, Prescription, User, Visit } from "@/app/_lib/types/models";

const EMPTY_USERS: User[] = [];
const EMPTY_PETS: Pet[] = [];
const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_PRESCRIPTIONS: Prescription[] = [];
const EMPTY_VISITS: Visit[] = [];

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function OwnerDashboard() {
  const { data: usersData } = useUsers();
  const { data: petsData } = usePets();
  const { data: appointmentsData } = useAppointments();
  const { data: prescriptionsData } = usePrescriptions();
  const { data: visitsData } = useVisits();

  const users = usersData?.data ?? EMPTY_USERS;
  const pets = petsData?.data ?? EMPTY_PETS;
  const appointments = appointmentsData?.data ?? EMPTY_APPOINTMENTS;
  const prescriptions = prescriptionsData?.data ?? EMPTY_PRESCRIPTIONS;
  const visits = visitsData?.data ?? EMPTY_VISITS;

  const clinicStats = useMemo(() => {
    const activeClients = users.filter(
      (user) => user.role === "client" && user.is_active,
    ).length;
    const doctorsOnTeam = users.filter(
      (user) => user.role === "doctor" && user.is_active,
    ).length;
    const staffOnTeam = users.filter(
      (user) => user.role === "staff" && user.is_active,
    ).length;

    const completedAppointments = appointments.filter((appointment) => {
      const normalized = appointment.status.toLowerCase();
      return (
        normalized === "completed" ||
        normalized === "done" ||
        normalized === "closed"
      );
    }).length;

    const completionRate =
      appointments.length > 0
        ? Math.round((completedAppointments / appointments.length) * 100)
        : 0;

    const now = new Date();
    const monthlyVisits = visits.filter((visit) => {
      const visitDate = new Date(visit.date);
      return (
        !Number.isNaN(visitDate.getTime()) &&
        visitDate.getMonth() === now.getMonth() &&
        visitDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      activeClients,
      doctorsOnTeam,
      staffOnTeam,
      completionRate,
      monthlyVisits,
    };
  }, [users, appointments, visits]);

  const statCards = [
    {
      label: "Active Clients",
      value: clinicStats.activeClients,
      icon: Users,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: "Registered Pets",
      value: pets.length,
      icon: Heart,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: "Appointments",
      value: appointments.length,
      icon: CalendarCheck,
      color: "text-orange",
      bg: "bg-orange/10",
      border: "border-orange/20",
    },
    {
      label: "Prescriptions",
      value: prescriptions.length,
      icon: FileText,
      color: "text-coral",
      bg: "bg-coral/10",
      border: "border-coral/20",
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
            Clinic Performance
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">
            Owner <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Track revenue, appointments, and overall clinic health.
          </p>
        </div>
      </motion.div>

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
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
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
        <h3 className="text-lg font-bold mb-5">Clinic Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Visit Activity (This Month)
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-emerald">
              {clinicStats.monthlyVisits}
            </p>
          </div>
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Appointment Completion
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-cyan">
              {clinicStats.completionRate}%
            </p>
          </div>
          <div className="rounded-xl border border-orange/20 bg-orange/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Care Team Online
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-orange">
              {clinicStats.doctorsOnTeam + clinicStats.staffOnTeam}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {clinicStats.doctorsOnTeam} doctors, {clinicStats.staffOnTeam} staff
            </p>
          </div>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-emerald" />
          Data is sourced from users, pets, appointments, prescriptions, and visits.
        </div>
      </motion.div>
    </motion.div>
  );
}
