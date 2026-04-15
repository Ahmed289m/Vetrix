"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  Cat,
  Calendar,
  FileText,
  Bell,
  Activity,
  Clock,
  Dog,
  ChevronRight,
  CheckCircle2,
  Play,
} from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";
import { useAuth } from "@/app/_hooks/useAuth";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { useUsers } from "@/app/_hooks/queries/use-users";
import type { Appointment, Pet } from "@/app/_lib/types/models";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ClientDashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const [showTracker, setShowTracker] = useState(false);

  const { data: appointmentsData } = useAppointments();
  const { data: petsData } = usePets();
  const { data: prescriptionsData } = usePrescriptions();
  const { data: usersData } = useUsers();

  const appointments = appointmentsData?.data ?? [];
  const pets = petsData?.data ?? [];
  const prescriptions = prescriptionsData?.data ?? [];
  const users = usersData?.data ?? [];

  // Client-scoped stats
  const clientStats = useMemo(() => {
    const myPets = pets.filter(
      (p: Pet) => p.client_id === user?.userId
    ).length;

    const now = new Date();
    const upcomingAppointments = appointments.filter((apt: Appointment) => {
      const aptDate = new Date(apt.appointment_date ?? "");
      return (
        apt.client_id === user?.userId &&
        aptDate >= now &&
        (apt.status === "pending" || apt.status === "confirmed")
      );
    }).length;

    const myPrescriptions = prescriptions.filter(
      (rx: any) => rx.client_id === user?.userId
    ).length;

    const myConfirmedAppointments = appointments.filter(
      (apt: Appointment) =>
        apt.client_id === user?.userId && apt.status === "confirmed"
    ).length;

    return {
      myPets,
      upcomingAppointments,
      myPrescriptions,
      myConfirmedAppointments,
    };
  }, [pets, appointments, prescriptions, user?.userId]);

  // Build the case queue (all confirmed appointments sorted by date)
  const caseQueue = useMemo(() => {
    return appointments
      .filter((apt: Appointment) => apt.status === "confirmed")
      .sort((a: Appointment, b: Appointment) => {
        const dateA = a.appointment_date
          ? new Date(a.appointment_date).getTime()
          : 0;
        const dateB = b.appointment_date
          ? new Date(b.appointment_date).getTime()
          : 0;
        return dateA - dateB;
      })
      .map((apt: Appointment, index: number) => {
        const pet = pets.find((p: Pet) => p.pet_id === apt.pet_id);
        const doctor = apt.doctor_id
          ? users.find((u: any) => u.user_id === apt.doctor_id)
          : null;

        return {
          id: apt.appointment_id,
          caseNumber: `APT-${String(index + 1).padStart(4, "0")}`,
          petName: pet?.name || t("unknown_pet"),
          species: (pet?.type || "dog") as "dog" | "cat",
          breed: pet?.breed || t("mixed"),
          doctor: doctor?.fullname || t("doctor_assigned"),
          complaint: apt.reason || t("regular_checkup"),
          isMyAppointment: apt.client_id === user?.userId,
        };
      });
  }, [appointments, pets, users, user?.userId, t]);

  // Find this client's position in the queue
  const myQueuePosition = useMemo(() => {
    const idx = caseQueue.findIndex((c) => c.isMyAppointment);
    return idx >= 0 ? idx + 1 : null;
  }, [caseQueue]);

  const myCase = caseQueue.find((c) => c.isMyAppointment) ?? null;

  const statCards = [
    {
      label: t("my_pets"),
      value: clientStats.myPets,
      icon: Cat,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: t("upcoming_appts"),
      value: clientStats.upcomingAppointments,
      icon: Calendar,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: t("prescriptions"),
      value: clientStats.myPrescriptions,
      icon: FileText,
      color: "text-orange",
      bg: "bg-orange/10",
      border: "border-orange/20",
    },
    {
      label: t("notifications"),
      value: clientStats.myConfirmedAppointments,
      icon: Bell,
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
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("my_pets")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">
            {t("client_portal")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {t("manage_your_pets_appointments_and_records")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowTracker(!showTracker)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            showTracker
              ? "bg-coral/10 border border-coral/30 text-coral"
              : "gradient-emerald-cyan text-primary-foreground glow-emerald"
          }`}
        >
          <Play className="w-4 h-4" />
          {showTracker ? t("exit_sim") : t("case_tracker")}
        </motion.button>
      </motion.div>

      {/* Case Tracker (Read-Only Simulation) */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-5">
              {/* Tracker Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-emerald-cyan flex items-center justify-center glow-emerald">
                    <Activity className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{t("case_tracker")}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {t("your_queue_position")}
                    </p>
                  </div>
                </div>
                {/* Queue progress dots */}
                <div className="flex items-center gap-1.5">
                  {caseQueue.slice(0, 8).map((c, i) => (
                    <div
                      key={c.id}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        c.isMyAppointment
                          ? "bg-emerald glow-emerald scale-125"
                          : "bg-muted/40"
                      }`}
                    />
                  ))}
                  {caseQueue.length > 8 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      +{caseQueue.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* No active appointment */}
              {!myCase && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 rounded-xl border-2 border-dashed border-border/30 bg-muted/5 text-center space-y-3"
                >
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("no_active_appointments")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("waiting_for_your_turn")}
                  </p>
                </motion.div>
              )}

              {/* My case in queue */}
              {myCase && myQueuePosition && (
                <div className="space-y-4">
                  {/* Position indicator */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {t("position_in_queue")}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-3xl font-extrabold tabular-nums text-emerald">
                          {myQueuePosition}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("of_total")} {caseQueue.length}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-cyan/20 bg-cyan/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {t("case_number")}
                      </p>
                      <p className="text-lg font-mono font-bold text-cyan mt-2">
                        {myCase.caseNumber}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-orange/20 bg-orange/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {t("current_case_order")}
                      </p>
                      <p className="text-lg font-bold text-orange mt-2 truncate">
                        {caseQueue[0]?.caseNumber ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* My appointment card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl border-2 border-emerald/30 bg-emerald/5 space-y-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("your_appointment")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
                        {myCase.species === "dog" ? (
                          <Dog className="w-6 h-6 text-foreground" />
                        ) : (
                          <Cat className="w-6 h-6 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-extrabold">
                          {myCase.petName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {myCase.breed} · {myCase.doctor}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {myCase.caseNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald/15 text-emerald">
                          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                          {t("confirmed")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 mt-1">
                      {myCase.complaint}
                    </p>
                  </motion.div>

                  {/* Next case preview (if not mine) */}
                  {caseQueue[0] && !caseQueue[0].isMyAppointment && (
                    <div className="p-4 rounded-xl bg-muted/10 border border-border/30 border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {t("current_case")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                          {caseQueue[0].species === "dog" ? (
                            <Dog className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Cat className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">
                            {caseQueue[0].petName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {caseQueue[0].complaint}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {caseQueue[0].caseNumber}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
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
                {s.value}
              </motion.p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Placeholder notice */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center mt-8"
      >
        <h3 className="text-lg font-bold">{t("client_module_placeholder")}</h3>
        <p className="text-muted-foreground mt-2">
          {t("client_features_coming")}
        </p>
      </motion.div>
    </motion.div>
  );
}
