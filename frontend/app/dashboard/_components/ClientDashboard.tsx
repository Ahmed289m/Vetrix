"use client";

import { motion } from "@/app/_components/fast-motion";
import { Cat, Calendar, FileText, Bell } from "lucide-react";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } } };

export function ClientDashboard() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">My Pets</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client <span className="gradient-text">Portal</span></h2>
          <p className="text-sm text-muted-foreground mt-1.5">Manage your pets, appointments, and records.</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "My Pets", value: 2, icon: Cat, color: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/20" },
            { label: "Upcoming Appts", value: 1, icon: Calendar, color: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/20" },
            { label: "Medical Records", value: 14, icon: FileText, color: "text-orange", bg: "bg-orange/10", border: "border-orange/20" },
            { label: "Notifications", value: 2, icon: Bell, color: "text-coral", bg: "bg-coral/10", border: "border-coral/20" },
          ].map((s, i) => (
            <motion.div key={s.label} className={`rounded-xl p-5 border ${s.border} bg-card/50 backdrop-blur-sm card-hover cursor-default`}>
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <motion.p className="text-3xl font-extrabold mt-4 tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>{s.value}</motion.p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center mt-8">
        <h3 className="text-lg font-bold">Client Module (Placeholder)</h3>
        <p className="text-muted-foreground mt-2">Pet profiles, vaccination history, and appointment booking will be implemented here.</p>
      </motion.div>
    </motion.div>
  );
}
