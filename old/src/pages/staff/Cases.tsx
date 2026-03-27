import { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Search, Dog, Cat, Eye, TrendingUp } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Case {
  id: string;
  caseNumber: string;
  caseName: string;
  petName: string;
  species: "dog" | "cat";
  ownerName: string;
  doctor: string;
  date: string;
  status: "active" | "closed";
  diagnosis: string;
}

const allCases: Case[] = [
  { id: "1", caseNumber: "VET-2024-0152", caseName: "ACL Repair Post-Op", petName: "Bella", species: "dog", ownerName: "Sarah Mitchell", doctor: "Dr. Emily Chen", date: "2024-03-15", status: "active", diagnosis: "Left cruciate ligament repair" },
  { id: "2", caseNumber: "VET-2024-0153", caseName: "Dental Stage 2", petName: "Max", species: "cat", ownerName: "Tom Parker", doctor: "Dr. Emily Chen", date: "2024-03-18", status: "active", diagnosis: "Periodontal disease stage 2" },
  { id: "3", caseNumber: "VET-2024-0151", caseName: "Annual Vaccination", petName: "Duke", species: "dog", ownerName: "Mike Johnson", doctor: "Dr. Aris Rahman", date: "2024-03-17", status: "closed", diagnosis: "Healthy - DHPP and Rabies booster" },
  { id: "4", caseNumber: "VET-2024-0150", caseName: "Dermatitis Treatment", petName: "Rocky", species: "dog", ownerName: "James Wilson", doctor: "Dr. Emily Chen", date: "2024-03-17", status: "active", diagnosis: "Atopic dermatitis with secondary infection" },
  { id: "5", caseNumber: "VET-2024-0149", caseName: "Urinary Obstruction", petName: "Shadow", species: "cat", ownerName: "Lisa Brown", doctor: "Dr. Aris Rahman", date: "2024-03-16", status: "closed", diagnosis: "Urethral obstruction - struvite crystals" },
  { id: "6", caseNumber: "VET-2024-0148", caseName: "Fractured Limb", petName: "Coco", species: "dog", ownerName: "David Lee", date: "2024-03-14", doctor: "Dr. Emily Chen", status: "closed", diagnosis: "Right forelimb fracture - splinted" },
  { id: "7", caseNumber: "VET-2024-0147", caseName: "Ear Infection", petName: "Mittens", species: "cat", ownerName: "Amy Chen", date: "2024-03-13", doctor: "Dr. Aris Rahman", status: "closed", diagnosis: "Bilateral otitis externa - yeast" },
  { id: "8", caseNumber: "VET-2024-0146", caseName: "GI Distress", petName: "Bruno", species: "dog", ownerName: "Karen White", date: "2024-03-12", doctor: "Dr. Emily Chen", status: "closed", diagnosis: "Acute gastroenteritis - dietary indiscretion" },
];

export default function Cases() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const filtered = allCases
    .filter(c => filter === "all" || c.status === filter)
    .filter(c => c.caseName.toLowerCase().includes(search.toLowerCase()) || c.caseNumber.toLowerCase().includes(search.toLowerCase()) || c.petName.toLowerCase().includes(search.toLowerCase()));

  const totalCases = allCases.length;
  const currentCase = allCases[0].caseNumber;
  const lastCase = allCases[allCases.length - 1].caseNumber;

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Case Management</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">All Cases</h2>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-5 border border-emerald/20">
          <div className="flex items-center gap-2 mb-2"><Hash className="w-4 h-4 text-emerald" /><span className="text-xs font-bold uppercase text-muted-foreground">Total Cases</span></div>
          <motion.p className="text-3xl font-extrabold text-emerald tabular-nums" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>{totalCases}</motion.p>
        </div>
        <div className="glass-card p-5 border border-cyan/20">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-cyan" /><span className="text-xs font-bold uppercase text-muted-foreground">Current Case</span></div>
          <p className="text-lg font-bold font-mono text-cyan">{currentCase}</p>
        </div>
        <div className="glass-card p-5 border border-orange/20">
          <div className="flex items-center gap-2 mb-2"><Hash className="w-4 h-4 text-orange" /><span className="text-xs font-bold uppercase text-muted-foreground">Last Case</span></div>
          <p className="text-lg font-bold font-mono text-orange">{lastCase}</p>
        </div>
      </motion.div>

      {/* Search & filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by case number, name..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f ? "gradient-emerald-cyan text-primary-foreground glow-emerald" : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}>{f}</button>
          ))}
        </div>
      </motion.div>

      {/* Cases table */}
      <motion.div variants={fadeUp} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Case #</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Case Name</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Patient</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Doctor</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const Icon = c.species === "dog" ? Dog : Cat;
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald">{c.caseNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{c.caseName}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{c.petName} · {c.ownerName}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{c.petName}</p>
                          <p className="text-xs text-muted-foreground">{c.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{c.doctor}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{c.date}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        c.status === "active" ? "bg-cyan/15 text-cyan" : "bg-muted/40 text-muted-foreground"
                      }`}>{c.status}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
