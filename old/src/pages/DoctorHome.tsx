import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe, Activity, ArrowRight, TrendingUp, TrendingDown, Clock,
  ChevronRight, Stethoscope, Dog, Cat, Plus, UserPlus, FileText,
  Video, Heart, Thermometer, Scale, Droplets, AlertTriangle,
  CheckCircle2, Timer, Users, Zap, Play
} from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import SimulationMode from "@/components/SimulationMode";
import { useLang } from "@/hooks/useLanguage";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } } };

const appointments = [
  { time: "09:00", pet: "Bella", breed: "Golden Retriever", owner: "Sarah M.", type: "Post-op Follow-up", status: "completed", doctor: "Dr. Emily", icon: Dog },
  { time: "09:30", pet: "Whiskers", breed: "Persian Cat", owner: "Tom P.", type: "Dental Cleaning", status: "in-progress", doctor: "Dr. Emily", icon: Cat },
  { time: "10:00", pet: "Luna", breed: "Labrador", owner: "Maria G.", type: "Vaccination", status: "normal", doctor: "Dr. Emily", icon: Dog },
  { time: "10:30", pet: "Rocky", breed: "German Shepherd", owner: "James W.", type: "Skin Allergy", status: "follow-up", doctor: "Dr. Emily", icon: Dog },
  { time: "11:00", pet: "Mittens", breed: "Siamese Cat", owner: "Amy C.", type: "Emergency - Breathing", status: "emergency", doctor: "Dr. Emily", icon: Cat },
];

const clinicStats = [
  { label: "Waiting", value: 4, icon: Timer, color: "text-orange", bg: "bg-orange-50", border: "border-orange/20" },
  { label: "In Treatment", value: 3, icon: Activity, color: "text-cyan", bg: "bg-cyan-50", border: "border-cyan/20" },
  { label: "Emergencies", value: 1, icon: AlertTriangle, color: "text-coral", bg: "bg-coral-50", border: "border-coral/20" },
  { label: "Completed", value: 12, icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald-50", border: "border-emerald/20" },
];

const visitData = [
  { month: "Jan", visits: 120 }, { month: "Feb", visits: 145 }, { month: "Mar", visits: 160 },
  { month: "Apr", visits: 135 }, { month: "May", visits: 180 }, { month: "Jun", visits: 195 },
];

const diseaseData = [
  { name: "Dermatology", value: 28, color: "hsl(160, 84%, 39%)" },
  { name: "Dental", value: 22, color: "hsl(187, 92%, 42%)" },
  { name: "Orthopedic", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "GI Issues", value: 15, color: "hsl(270, 70%, 55%)" },
  { name: "Cardiology", value: 10, color: "hsl(347, 77%, 50%)" },
];

const quickActions = [
  { title: "Add Patient", icon: UserPlus, gradient: "gradient-emerald-cyan" },
  { title: "New Appointment", icon: Plus, gradient: "gradient-emerald-cyan" },
  { title: "Prescription", icon: FileText, gradient: "gradient-cyan-blue" },
  { title: "Consultation", icon: Video, gradient: "gradient-cyan-blue" },
];

const statusColors: Record<string, string> = {
  normal: "border-emerald/30 bg-emerald/5", "follow-up": "border-orange/30 bg-orange/5",
  emergency: "border-coral/30 bg-coral/5", "in-progress": "border-cyan/30 bg-cyan/5",
  completed: "border-muted-foreground/20 bg-muted/30",
};
const statusDot: Record<string, string> = {
  normal: "bg-emerald", "follow-up": "bg-orange", emergency: "bg-coral animate-pulse",
  "in-progress": "bg-cyan animate-pulse", completed: "bg-muted-foreground/40",
};

export default function DoctorHome() {
  const [showSim, setShowSim] = useState(false);
  const { t } = useLang();

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">{t("good_morning")}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("welcome_back")} <span className="gradient-text">Dr. Emily</span></h2>
          <p className="text-sm text-muted-foreground mt-1.5"><span className="font-semibold text-foreground">4 {t("surgeries")}</span> and <span className="font-semibold text-foreground">8 {t("consultations")}</span> {t("scheduled_today")}</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSim(!showSim)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showSim ? "bg-coral/10 border border-coral/30 text-coral" : "gradient-emerald-cyan text-primary-foreground glow-emerald"}`}>
            <Play className="w-3.5 h-3.5" /> {showSim ? t("exit_sim") : t("simulation")}
          </motion.button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald/10 border border-emerald/20">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-xs font-bold text-emerald uppercase tracking-wider">{t("on_duty")}</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSim && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-5 border-glow">
              <SimulationMode role="doctor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {clinicStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`glass-card p-4 card-hover cursor-default border ${s.border}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <motion.p className="text-3xl font-extrabold mt-3 tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}>{s.value}</motion.p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <div className="glass-card p-5 border-glow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald" /><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("todays_appointments")}</h3></div>
              <span className="text-xs font-bold text-emerald tabular-nums">{appointments.length} {t("scheduled")}</span>
            </div>
            <div className="relative space-y-0">
              <div className="absolute left-[55px] sm:left-[67px] top-0 bottom-0 w-px bg-border" />
              {appointments.map((apt, i) => (
                <motion.div key={apt.time} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="relative flex items-stretch gap-3 sm:gap-4 py-3 group cursor-pointer">
                  <span className="text-xs sm:text-sm font-mono tabular-nums text-muted-foreground w-10 sm:w-12 shrink-0 pt-2 text-right">{apt.time}</span>
                  <div className="relative z-10 flex flex-col items-center shrink-0 pt-2"><div className={`w-3 h-3 rounded-full ${statusDot[apt.status]} ring-2 ring-background`} /></div>
                  <div className={`flex-1 p-3 sm:p-4 rounded-xl border ${statusColors[apt.status]} backdrop-blur-sm group-hover:scale-[1.01] transition-all duration-300`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0"><apt.icon className="w-5 h-5 text-muted-foreground" /></div>
                        <div className="min-w-0"><p className="text-sm font-bold truncate">{apt.pet}</p><p className="text-xs text-muted-foreground truncate">{apt.breed} · {apt.owner}</p></div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 ${apt.status === "emergency" ? "bg-coral/20 text-coral" : apt.status === "in-progress" ? "bg-cyan/20 text-cyan" : apt.status === "completed" ? "bg-muted text-muted-foreground" : "bg-emerald/20 text-emerald"}`}>{apt.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{apt.type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t("quick_actions")}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action, i) => (
                <motion.button key={action.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-emerald/30 hover:bg-emerald/5 transition-all duration-300 ripple"
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                  <div className={`w-10 h-10 rounded-xl ${action.gradient} flex items-center justify-center group-hover:shadow-lg transition-shadow`}><action.icon className="w-5 h-5 text-primary-foreground" /></div>
                  <span className="text-xs font-semibold text-center">{action.title}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t("case_distribution")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={diseaseData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                {diseaseData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie><Tooltip contentStyle={{ backgroundColor: "hsl(217, 33%, 17%)", border: "1px solid hsl(217, 33%, 22%)", borderRadius: "12px", fontSize: "12px", color: "hsl(210, 20%, 92%)" }} /></PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {diseaseData.slice(0, 4).map(d => (
                <div key={d.name} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} /><span className="text-[11px] text-muted-foreground truncate">{d.name}</span><span className="text-[11px] font-bold tabular-nums ml-auto">{d.value}%</span></div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("visit_trends")}</h3><span className="flex items-center gap-1 text-xs font-bold text-emerald"><TrendingUp className="w-3.5 h-3.5" /> +12%</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={visitData}>
              <defs><linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(217, 33%, 17%)", border: "1px solid hsl(217, 33%, 22%)", borderRadius: "12px", fontSize: "12px", color: "hsl(210, 20%, 92%)" }} />
              <Area type="monotone" dataKey="visits" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} fill="url(#visitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
