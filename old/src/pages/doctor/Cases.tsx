import { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Search, Dog, Cat, TrendingUp, Stethoscope } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const doctorCases = [
  { id: "1", caseNumber: "VET-2024-0152", caseName: "ACL Repair Post-Op", petName: "Bella", species: "dog" as const, ownerName: "Sarah Mitchell", date: "2024-03-15", status: "active" as const, diagnosis: "Left cruciate ligament repair" },
  { id: "2", caseNumber: "VET-2024-0153", caseName: "Dental Stage 2", petName: "Max", species: "cat" as const, ownerName: "Tom Parker", date: "2024-03-18", status: "active" as const, diagnosis: "Periodontal disease stage 2" },
  { id: "3", caseNumber: "VET-2024-0150", caseName: "Dermatitis Treatment", petName: "Rocky", species: "dog" as const, ownerName: "James Wilson", date: "2024-03-17", status: "active" as const, diagnosis: "Atopic dermatitis" },
  { id: "4", caseNumber: "VET-2024-0148", caseName: "Fractured Limb", petName: "Coco", species: "dog" as const, ownerName: "David Lee", date: "2024-03-14", status: "closed" as const, diagnosis: "Right forelimb fracture" },
  { id: "5", caseNumber: "VET-2024-0146", caseName: "GI Distress", petName: "Bruno", species: "dog" as const, ownerName: "Karen White", date: "2024-03-12", status: "closed" as const, diagnosis: "Acute gastroenteritis" },
];

export default function DoctorCases() {
  const [search, setSearch] = useState("");

  const filtered = doctorCases.filter(c =>
    c.caseName.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.petName.toLowerCase().includes(search.toLowerCase())
  );

  const totalCases = doctorCases.length;
  const activeCases = doctorCases.filter(c => c.status === "active").length;
  const currentCase = doctorCases[0].caseNumber;

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">My Caseload</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Cases</h2>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-5 border border-emerald/20">
          <div className="flex items-center gap-2 mb-2"><Hash className="w-4 h-4 text-emerald" /><span className="text-xs font-bold uppercase text-muted-foreground">Total Cases</span></div>
          <motion.p className="text-3xl font-extrabold text-emerald tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>{totalCases}</motion.p>
        </div>
        <div className="glass-card p-5 border border-cyan/20">
          <div className="flex items-center gap-2 mb-2"><Stethoscope className="w-4 h-4 text-cyan" /><span className="text-xs font-bold uppercase text-muted-foreground">Active</span></div>
          <p className="text-3xl font-extrabold text-cyan tabular-nums">{activeCases}</p>
        </div>
        <div className="glass-card p-5 border border-orange/20">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-orange" /><span className="text-xs font-bold uppercase text-muted-foreground">Current Case</span></div>
          <p className="text-lg font-bold font-mono text-orange">{currentCase}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
      </motion.div>

      {/* Case list */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((c, i) => {
          const Icon = c.species === "dog" ? Dog : Cat;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card p-4 sm:p-5 flex items-center gap-4 card-hover border ${c.status === "active" ? "border-emerald/20" : "border-border/30"}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.status === "active" ? "bg-emerald/10" : "bg-muted/30"}`}>
                <Icon className={`w-5 h-5 ${c.status === "active" ? "text-emerald" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-emerald font-semibold">{c.caseNumber}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${c.status === "active" ? "bg-emerald/15 text-emerald" : "bg-muted/40 text-muted-foreground"}`}>{c.status}</span>
                </div>
                <p className="text-sm font-bold mt-0.5">{c.caseName}</p>
                <p className="text-xs text-muted-foreground">{c.petName} · {c.ownerName} · {c.date}</p>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block max-w-[200px] truncate">{c.diagnosis}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
