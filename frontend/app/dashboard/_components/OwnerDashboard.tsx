"use client";

import { motion } from "@/app/_components/fast-motion";
import { DollarSign, Package, CalendarCheck, Activity } from "lucide-react";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } } };

export function OwnerDashboard() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Clinic Performance</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">Owner <span className="gradient-text">Dashboard</span></h2>
          <p className="text-sm text-muted-foreground mt-1.5">Track revenue, appointments, and overall clinic health.</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Monthly Revenue", value: "$45,200", icon: DollarSign, color: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/20" },
            { label: "New Clients", value: "+34", icon: CalendarCheck, color: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/20" },
            { label: "Staff Efficiency", value: "92%", icon: Activity, color: "text-orange", bg: "bg-orange/10", border: "border-orange/20" },
            { label: "Inventory Cost", value: "$8,400", icon: Package, color: "text-coral", bg: "bg-coral/10", border: "border-coral/20" },
          ].map((s, i) => (
            <motion.div key={s.label} className={`glass-card p-5 border ${s.border} card-hover cursor-default`}>
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <motion.p className="text-3xl font-extrabold mt-4 tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>{s.value}</motion.p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center mt-8">
        <h3 className="text-lg font-bold">Owner Module (Placeholder)</h3>
        <p className="text-muted-foreground mt-2">More clinic metrics and financial reports will be implemented here.</p>
      </motion.div>
    </motion.div>
  );
}
