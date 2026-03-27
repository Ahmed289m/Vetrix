import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, DollarSign, Package, AlertTriangle, CheckCircle2, Clock, UserCheck, Plus, Dog, Cat, Timer, TrendingUp, Play } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import SimulationMode from "@/components/SimulationMode";
import { useLang } from "@/hooks/useLanguage";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } } };

const stats = [
  { label: "Appointments", value: "14", icon: CalendarCheck, change: "+2", color: "text-emerald", bg: "bg-emerald-50", border: "border-emerald/20" },
  { label: "Checked In", value: "6", icon: UserCheck, change: "3 waiting", color: "text-cyan", bg: "bg-cyan-50", border: "border-cyan/20" },
  { label: "Unpaid", value: "$2,340", icon: DollarSign, change: "5 pending", color: "text-orange", bg: "bg-orange-50", border: "border-orange/20" },
  { label: "Alerts", value: "3", icon: AlertTriangle, change: "Action needed", color: "text-coral", bg: "bg-coral-50", border: "border-coral/20" },
];

const appointments = [
  { time: "09:00", pet: "Bella", breed: "Golden Retriever", owner: "Sarah Mitchell", type: "Post-op Follow-up", status: "checked-in", doctor: "Dr. Emily", icon: Dog },
  { time: "09:30", pet: "Max", breed: "Persian Cat", owner: "Tom Parker", type: "Dental Cleaning", status: "checked-in", doctor: "Dr. Emily", icon: Cat },
  { time: "10:00", pet: "Luna", breed: "Labrador", owner: "Maria Garcia", type: "Vaccination", status: "waiting", doctor: "Dr. Aris", icon: Dog },
  { time: "10:30", pet: "Rocky", breed: "German Shepherd", owner: "James Wilson", type: "Skin Allergy", status: "scheduled", doctor: "Dr. Emily", icon: Dog },
  { time: "11:00", pet: "Mittens", breed: "Siamese Cat", owner: "Amy Chen", type: "Annual Checkup", status: "scheduled", doctor: "Dr. Aris", icon: Cat },
];

const billingQueue = [
  { invoice: "INV-2024-0847", owner: "Sarah Mitchell", amount: "$420.00", status: "unpaid" },
  { invoice: "INV-2024-0846", owner: "Tom Parker", amount: "$185.00", status: "unpaid" },
  { invoice: "INV-2024-0845", owner: "Maria Garcia", amount: "$95.00", status: "partial" },
];

const inventoryAlerts = [
  { item: "Propofol 10mg/mL", stock: "2 vials", level: "critical" },
  { item: "Meloxicam 1.5mg/mL", stock: "8 units", level: "low" },
  { item: "Surgical Gloves (M)", stock: "1 box", level: "critical" },
];

const revenueData = [
  { day: "Mon", rev: 2400 }, { day: "Tue", rev: 3200 }, { day: "Wed", rev: 2800 },
  { day: "Thu", rev: 3600 }, { day: "Fri", rev: 4100 }, { day: "Sat", rev: 2900 },
];

export default function StaffHome() {
  const [showSim, setShowSim] = useState(false);
  const { t } = useLang();

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">{t("reception_desk")}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("good_morning")}, <span className="gradient-text">Sarah</span></h2>
          <p className="text-sm text-muted-foreground mt-1.5"><span className="font-semibold text-foreground">14 {t("appointments")}</span> {t("today")} · <span className="font-semibold text-foreground">2 {t("doctors_on_duty")}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSim(!showSim)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showSim ? "bg-coral/10 border border-coral/30 text-coral" : "glass-card border border-border/50 text-muted-foreground hover:border-emerald/30"}`}>
            <Play className="w-3.5 h-3.5" /> {showSim ? t("exit_sim") : t("simulation")}
          </motion.button>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
            <Plus className="w-4 h-4" /> {t("new_appointment")}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSim && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-5 border-glow">
              <SimulationMode role="staff" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`glass-card p-4 card-hover cursor-default border ${s.border}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <motion.p className="text-3xl font-extrabold mt-3 tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}>{s.value}</motion.p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.change}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <div className="glass-card p-5 border-glow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald" /><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("todays_schedule")}</h3></div>
              <span className="text-xs font-bold text-emerald">{appointments.length} {t("total")}</span>
            </div>
            <div className="relative space-y-0">
              <div className="absolute left-[55px] sm:left-[67px] top-0 bottom-0 w-px bg-border" />
              {appointments.map((apt, i) => (
                <motion.div key={apt.time} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="relative flex items-stretch gap-3 sm:gap-4 py-2.5 group cursor-pointer">
                  <span className="text-xs sm:text-sm font-mono tabular-nums text-muted-foreground w-10 sm:w-12 shrink-0 pt-3 text-right">{apt.time}</span>
                  <div className="relative z-10 flex flex-col items-center shrink-0 pt-3">
                    <div className={`w-3 h-3 rounded-full ring-2 ring-background ${apt.status === "checked-in" ? "bg-emerald" : apt.status === "waiting" ? "bg-orange animate-pulse" : "bg-muted-foreground/30"}`} />
                  </div>
                  <div className={`flex-1 p-3 sm:p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.01] ${apt.status === "checked-in" ? "border-emerald/20 bg-emerald/5" : apt.status === "waiting" ? "border-orange/20 bg-orange/5" : "border-border/50 bg-muted/10"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0"><apt.icon className="w-5 h-5 text-muted-foreground" /></div>
                        <div className="min-w-0"><p className="text-sm font-bold truncate">{apt.pet} <span className="font-normal text-muted-foreground">— {apt.owner}</span></p><p className="text-xs text-muted-foreground truncate">{apt.type} · {apt.doctor}</p></div>
                      </div>
                      {apt.status === "checked-in" ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald shrink-0"><CheckCircle2 className="w-3 h-3" /><span className="hidden sm:inline">In</span></span>
                      ) : apt.status === "waiting" ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-orange/15 text-orange shrink-0"><Timer className="w-3 h-3" /><span className="hidden sm:inline">Wait</span></span>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 text-muted-foreground hover:bg-emerald hover:text-primary-foreground transition-all">{t("check_in")}</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("weekly_revenue")}</h3><span className="flex items-center gap-1 text-xs font-bold text-emerald"><TrendingUp className="w-3.5 h-3.5" /> +18%</span></div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(187, 92%, 42%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(187, 92%, 42%)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(217, 33%, 17%)", border: "1px solid hsl(217, 33%, 22%)", borderRadius: "12px", fontSize: "12px", color: "hsl(210, 20%, 92%)" }} formatter={(value: number) => [`$${value}`, "Revenue"]} />
                <Area type="monotone" dataKey="rev" stroke="hsl(187, 92%, 42%)" strokeWidth={2} fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t("billing_queue")}</h3>
            <div className="space-y-2.5">
              {billingQueue.map(b => (
                <div key={b.invoice} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="min-w-0"><p className="text-sm font-semibold truncate">{b.owner}</p><p className="text-[10px] text-muted-foreground font-mono">{b.invoice}</p></div>
                  <div className="text-right shrink-0 ml-2"><p className="text-sm font-bold tabular-nums">{b.amount}</p><span className={`text-[10px] font-bold uppercase ${b.status === "partial" ? "text-orange" : "text-coral"}`}>{b.status}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-coral" />{t("inventory_alerts")}</h3>
            <div className="space-y-2.5">
              {inventoryAlerts.map(item => (
                <div key={item.item} className={`p-3 rounded-xl border ${item.level === "critical" ? "border-coral/20 bg-coral/5" : "border-orange/20 bg-orange/5"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{item.item}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${item.level === "critical" ? "bg-coral/15 text-coral" : "bg-orange/15 text-orange"}`}>{item.level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t("stock")}: <span className="font-mono font-semibold">{item.stock}</span></p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
