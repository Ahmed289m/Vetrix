"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { Pill, Plus, Search, X, Download, Clock, AlertTriangle } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Prescription {
  id: string;
  caseNumber: string;
  petName: string;
  species: "dog" | "cat";
  ownerName: string;
  date: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  notes: string;
  status: "active" | "completed";
}

const initialPrescriptions: Prescription[] = [
  { id: "1", caseNumber: "VET-2024-0152", petName: "Bella", species: "dog", ownerName: "Sarah Mitchell", date: "2024-03-15", medications: [
    { name: "Meloxicam", dosage: "0.1 mg/kg", frequency: "PO q24h", duration: "14 days" },
    { name: "Amoxicillin", dosage: "22 mg/kg", frequency: "PO q12h", duration: "10 days" },
    { name: "Tramadol", dosage: "3 mg/kg", frequency: "PO q8-12h PRN", duration: "7 days" },
  ], notes: "Administer with food. Reassess pain at 7-day recheck.", status: "active" },
  { id: "2", caseNumber: "VET-2024-0153", petName: "Max", species: "cat", ownerName: "Tom Parker", date: "2024-03-18", medications: [
    { name: "Buprenorphine", dosage: "0.02 mg/kg", frequency: "SL q8h", duration: "3 days" },
    { name: "Clindamycin", dosage: "11 mg/kg", frequency: "PO q12h", duration: "7 days" },
  ], notes: "Soft food only for 14 days post dental procedure.", status: "active" },
  { id: "3", caseNumber: "VET-2024-0150", petName: "Rocky", species: "dog", ownerName: "James Wilson", date: "2024-03-17", medications: [
    { name: "Apoquel (oclacitinib)", dosage: "0.4 mg/kg", frequency: "PO q12h", duration: "14 days" },
    { name: "Cephalexin", dosage: "22 mg/kg", frequency: "PO q12h", duration: "14 days" },
  ], notes: "Reduce Apoquel to q24h after 14 days if improved.", status: "active" },
  { id: "4", caseNumber: "VET-2024-0149", petName: "Shadow", species: "cat", ownerName: "Lisa Brown", date: "2024-03-16", medications: [
    { name: "Prazosin", dosage: "0.25 mg", frequency: "PO q12h", duration: "30 days" },
    { name: "Buprenorphine", dosage: "0.02 mg/kg", frequency: "SL q8h", duration: "3 days" },
  ], notes: "Prescription urinary diet long-term.", status: "completed" },
];

const drugInteractions: Record<string, { conflicts: string[]; warning: string }> = {
  "Meloxicam": { conflicts: ["Prednisolone", "Furosemide", "Other NSAIDs"], warning: "NSAID — avoid with corticosteroids. GI ulceration risk." },
  "Amoxicillin": { conflicts: ["Methotrexate", "Warfarin"], warning: "May increase anticoagulant effect." },
  "Tramadol": { conflicts: ["SSRIs", "MAOIs", "Sedatives", "Gabapentin"], warning: "Serotonin syndrome risk. Additive sedation." },
  "Cephalexin": { conflicts: ["Aminoglycosides"], warning: "Nephrotoxicity risk with aminoglycosides." },
  "Apoquel (oclacitinib)": { conflicts: ["Immunosuppressants", "Live vaccines"], warning: "Do not combine with other immunosuppressive drugs." },
  "Prazosin": { conflicts: ["Other antihypertensives", "PDE5 inhibitors"], warning: "Hypotension risk." },
  "Buprenorphine": { conflicts: ["Full opioid agonists", "CNS depressants"], warning: "Partial agonist — may reduce efficacy of full agonists." },
  "Clindamycin": { conflicts: ["Erythromycin", "Neuromuscular blockers"], warning: "May potentiate neuromuscular blockade." },
};

function checkInteractions(meds: { name: string }[]): { drug1: string; drug2: string; warning: string }[] {
  const results: { drug1: string; drug2: string; warning: string }[] = [];
  for (let i = 0; i < meds.length; i++) {
    for (let j = i + 1; j < meds.length; j++) {
      const d1 = drugInteractions[meds[i].name];
      const d2 = drugInteractions[meds[j].name];
      if (d1?.conflicts.some((c) => meds[j].name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(meds[j].name.toLowerCase()))) {
        results.push({ drug1: meds[i].name, drug2: meds[j].name, warning: d1.warning });
      } else if (d2?.conflicts.some((c) => meds[i].name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(meds[i].name.toLowerCase()))) {
        results.push({ drug1: meds[j].name, drug2: meds[i].name, warning: d2.warning });
      }
    }
  }
  return results;
}

export default function PrescriptionsPage() {
  const [prescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [newRx, setNewRx] = useState({ caseNumber: "", petName: "", ownerName: "", notes: "" });
  const [newMeds, setNewMeds] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);

  const filtered = prescriptions.filter((p) => p.petName.toLowerCase().includes(search.toLowerCase()) || p.caseNumber.toLowerCase().includes(search.toLowerCase()));
  const addMed = () => setNewMeds((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "" }]);
  const newMedInteractions = checkInteractions(newMeds.filter((m) => m.name.trim()));

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Pharmacy</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Prescriptions</h2>
          <p className="text-sm text-muted-foreground mt-1">{prescriptions.filter((p) => p.status === "active").length} active prescriptions</p>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <Plus className="w-4 h-4" /> New Prescription
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prescriptions..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        {filtered.map((rx, i) => (
          <motion.div key={rx.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-5 card-hover cursor-pointer border ${rx.status === "active" ? "border-emerald/20" : "border-border/30"}`} onClick={() => setSelectedRx(rx)}>
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${rx.status === "active" ? "bg-emerald/10" : "bg-muted/30"}`}>
                <Pill className={`w-5 h-5 ${rx.status === "active" ? "text-emerald" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-muted-foreground">{rx.caseNumber}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${rx.status === "active" ? "bg-emerald/15 text-emerald" : "bg-muted/40 text-muted-foreground"}`}>{rx.status}</span>
                </div>
                <p className="text-sm font-bold mt-1">{rx.petName} — {rx.ownerName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {rx.medications.map((med, j) => (
                    <span key={j} className="px-2 py-1 rounded-lg bg-muted/20 border border-border/30 text-[11px] font-mono">{med.name} {med.dosage}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3.5 h-3.5" />{rx.date}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* View Rx Modal */}
      <AnimatePresence>
        {selectedRx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRx(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{selectedRx.caseNumber}</span>
                  <h3 className="text-xl font-bold mt-1">Prescription — {selectedRx.petName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRx.ownerName} · {selectedRx.date}</p>
                </div>
                <button onClick={() => setSelectedRx(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              {(() => {
                const interactions = checkInteractions(selectedRx.medications);
                return interactions.length > 0 && (
                  <div className="space-y-2">
                    {interactions.map((inter, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-xl border border-coral/20 bg-coral/5 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-coral">⚠️ {inter.drug1} × {inter.drug2}</p>
                          <p className="text-[11px] text-foreground/70 mt-0.5">{inter.warning}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/30">
                  <th className="text-left py-2 text-[10px] font-bold uppercase text-muted-foreground">Medications</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase text-muted-foreground">Dosage</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase text-muted-foreground">Frequency</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase text-muted-foreground">Duration</th>
                </tr></thead>
                <tbody>
                  {selectedRx.medications.map((med, j) => (
                    <tr key={j} className="border-b border-border/20">
                      <td className="py-2.5 font-semibold">{med.name}</td>
                      <td className="py-2.5 font-mono text-xs">{med.dosage}</td>
                      <td className="py-2.5 text-xs">{med.frequency}</td>
                      <td className="py-2.5 text-xs">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedRx.notes && (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedRx.notes}</p>
                </div>
              )}
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50">
                <Download className="w-3.5 h-3.5" /> Print / Export
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Rx Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Create Prescription</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Case Number</label>
                  <input value={newRx.caseNumber} onChange={(e) => setNewRx((p) => ({ ...p, caseNumber: e.target.value }))} placeholder="VET-2024-XXXX" className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Patient</label>
                  <input value={newRx.petName} onChange={(e) => setNewRx((p) => ({ ...p, petName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Medications</span>
                  <button onClick={addMed} className="text-xs font-semibold text-emerald hover:underline">+ Add</button>
                </div>
                {newMeds.map((med, j) => (
                  <div key={j} className="grid grid-cols-4 gap-2 mb-2">
                    <input placeholder="Drug" value={med.name} onChange={(e) => { const m = [...newMeds]; m[j].name = e.target.value; setNewMeds(m); }} className="px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                    <input placeholder="Dose" value={med.dosage} onChange={(e) => { const m = [...newMeds]; m[j].dosage = e.target.value; setNewMeds(m); }} className="px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                    <input placeholder="Freq" value={med.frequency} onChange={(e) => { const m = [...newMeds]; m[j].frequency = e.target.value; setNewMeds(m); }} className="px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                    <input placeholder="Days" value={med.duration} onChange={(e) => { const m = [...newMeds]; m[j].duration = e.target.value; setNewMeds(m); }} className="px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {newMedInteractions.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-coral" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-coral">Drug Interaction Check</span>
                    </div>
                    {newMedInteractions.map((inter, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl border border-coral/20 bg-coral/5 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-coral">⚠️ {inter.drug1} × {inter.drug2}</p>
                          <p className="text-[10px] text-foreground/70">{inter.warning}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes</label>
                <textarea value={newRx.notes} onChange={(e) => setNewRx((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 resize-none" />
              </div>
              <button onClick={() => setShowCreate(false)} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Create Prescription</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
