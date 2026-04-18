"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  Activity,
  TrendingUp,
  Clock,
  Dog,
  Cat,
  Plus,
  UserPlus,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Play,
} from "lucide-react";
import { fadeUp, stagger } from "@/app/_lib/utils/shared-animations";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SimulationMode from "../../_components/SimulationMode";
import { formatGreeting } from "@/app/_lib/utils/greeting";
import { useAuth } from "@/app/_hooks/useAuth";
import { useUsers } from "@/app/_hooks/queries/use-users";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { useLang } from "@/app/_hooks/useLanguage";

const quickActions = [
  {
    titleKey: "add_patient",
    icon: UserPlus,
    gradient: "gradient-emerald-cyan",
  },
  { titleKey: "new_appt", icon: Plus, gradient: "gradient-emerald-cyan" },
  { titleKey: "prescription", icon: FileText, gradient: "gradient-cyan-blue" },
  { titleKey: "consultation", icon: Video, gradient: "gradient-cyan-blue" },
];

// Sample disease data for the pie chart - can be populated with real data from API
const diseaseData = [
  { name: "Diabetes", value: 25, color: "hsl(160, 84%, 39%)" },
  { name: "Infection", value: 20, color: "hsl(197, 99%, 51%)" },
  { name: "Injury", value: 20, color: "hsl(355, 90%, 61%)" },
  { name: "Other", value: 35, color: "hsl(42, 99%, 46%)" },
];

// Sample visit trends data - can be populated with real data from API
const visitData = [
  { month: "Jan", visits: 40 },
  { month: "Feb", visits: 50 },
  { month: "Mar", visits: 45 },
  { month: "Apr", visits: 60 },
  { month: "May", visits: 55 },
  { month: "Jun", visits: 70 },
];

export function DoctorDashboard() {
  const [showSim, setShowSim] = useState(false);
  const { user } = useAuth();
  const { t } = useLang();
  const { data: appointmentsData } = useAppointments();
  const { data: petsData } = usePets();
  const { data: usersData } = useUsers();

  const appointments = appointmentsData?.data || [];
  const pets = petsData?.data || [];
  const users = usersData?.data || [];

  // Get today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments
      .filter((apt: any) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      })
      .map((apt: any) => {
        const pet = pets.find((p: any) => p.pet_id === apt.pet_id);
        const client = users.find((u: any) => u.user_id === apt.client_id);
        const time = new Date(apt.appointment_date).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        );

        return {
          time,
          pet: pet?.name || "Unknown",
          breed: pet?.breed || "Unknown",
          owner: client?.fullname || "Unknown",
          type: apt.reason || "Appointment",
          status: "confirmed",
          doctor: "Dr. " + (user?.fullname || "Unknown"),
          icon: pet?.type === "cat" ? Cat : Dog,
        };
      })
      .sort((a: any, b: any) => a.time.localeCompare(b.time));
  }, [appointments, pets, users, user?.fullname]);

  // Calculate stats
  const stats = useMemo(() => {
    const confirmed = appointments.filter(
      (apt: any) => apt.status === "confirmed",
    ).length;
    const pending = appointments.filter(
      (apt: any) => apt.status === "pending",
    ).length;
    const total = appointments.length;

    return [
      {
        label: t("confirmed_stat"),
        value: confirmed,
        icon: CheckCircle2,
        color: "text-emerald",
        bg: "bg-emerald/10",
        border: "border-emerald/20",
      },
      {
        label: t("pending_stat"),
        value: pending,
        icon: Timer,
        color: "text-orange",
        bg: "bg-orange/10",
        border: "border-orange/20",
      },
      {
        label: t("todays_patients"),
        value: todayAppointments.length,
        icon: Dog,
        color: "text-cyan",
        bg: "bg-cyan/10",
        border: "border-cyan/20",
      },
      {
        label: t("total_stat"),
        value: total,
        icon: Activity,
        color: "text-purple",
        bg: "bg-purple/10",
        border: "border-purple/20",
      },
    ];
  }, [appointments, todayAppointments.length, t]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-5 sm:space-y-6 max-w-7xl mx-auto"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("hello")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">
            {t("welcome")}{" "}
            <span className="gradient-text">
              {user?.role === "doctor" ? "Dr. " : ""}
              {user?.fullname || "User"}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            <span className="font-semibold text-foreground">
              {todayAppointments.length}
            </span>
            {" "}{t("appointments_scheduled_today")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSim(!showSim)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showSim ? "bg-coral/10 border border-coral/30 text-coral" : "gradient-emerald-cyan text-primary-foreground glow-emerald"}`}
          >
            <Play className="w-3.5 h-3.5" />{" "}
            {showSim ? t("exit_simulation") : t("simulation_label")}
          </motion.button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald/10 border border-emerald/20">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-xs font-bold text-emerald uppercase tracking-wider">
              {t("on_duty_status")}
            </span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSim && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-5 border-glow">
              <SimulationMode role="doctor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-card-foreground">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-4 card-hover cursor-default border ${s.border}`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
              >
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <motion.p
                className="text-3xl font-extrabold mt-3 tabular-nums"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.1 + 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                {s.value}
              </motion.p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <div className="glass-card p-5 border-glow text-card-foreground">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("todays_appointments_title")}
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald tabular-nums">
                {todayAppointments.length}{" "}
                {t("scheduled")}
              </span>
            </div>
            <div className="relative space-y-0">
              <div className="absolute left-[50px] sm:left-[67px] top-0 bottom-0 w-px bg-border/50" />
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt: any, i: number) => (
                  <motion.div
                    key={apt.time + i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex items-stretch gap-3 sm:gap-4 py-3 group cursor-pointer"
                  >
                    <span className="text-[11px] sm:text-sm font-mono tabular-nums text-muted-foreground w-9 sm:w-12 shrink-0 pt-2 text-right">
                      {apt.time}
                    </span>
                    <div className="relative z-10 flex flex-col items-center shrink-0 pt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald ring-2 ring-background" />
                    </div>
                    <div className="flex-1 p-3 sm:p-4 rounded-xl border border-emerald/30 bg-emerald/5 backdrop-blur-sm group-hover:scale-[1.01] transition-all duration-300">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                            <apt.icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">
                              {apt.pet}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {apt.breed} · {apt.owner}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {apt.type}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {t("no_appointments_today")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-6">
          <div className="glass-card p-5 text-card-foreground">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t("quick_actions")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.titleKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-emerald/30 hover:bg-emerald/5 transition-all duration-300 ripple"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${action.gradient} flex items-center justify-center group-hover:shadow-lg transition-shadow`}
                  >
                    <action.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-center">
                    {t(action.titleKey)}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 text-card-foreground">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t("case_distribution")}
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={diseaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {diseaseData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(217, 33%, 17%)",
                    border: "1px solid hsl(217, 33%, 22%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "hsl(210, 20%, 92%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              {diseaseData.slice(0, 4).map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-[11px] text-muted-foreground truncate">
                    {d.name}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums ml-auto">
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <div className="glass-card p-5 text-card-foreground">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("visit_trends")}
            </h3>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={visitData}>
              <defs>
                <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(160, 84%, 39%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(160, 84%, 39%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(217, 33%, 17%)",
                  border: "1px solid hsl(217, 33%, 22%)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "hsl(210, 20%, 92%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2.5}
                fill="url(#visitGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
