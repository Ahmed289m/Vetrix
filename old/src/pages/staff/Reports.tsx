import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Download, Eye, X, Dog, Cat, Calendar, Stethoscope } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Report {
  id: string;
  caseNumber: string;
  title: string;
  petName: string;
  species: "dog" | "cat";
  ownerName: string;
  doctor: string;
  date: string;
  summary: string;
  content: string;
}

const initialReports: Report[] = [
  { id: "1", caseNumber: "VET-2024-0152", title: "ACL Repair Surgical Report", petName: "Bella", species: "dog", ownerName: "Sarah Mitchell", doctor: "Dr. Emily Chen", date: "2024-03-15", summary: "Left cruciate ligament repair via TPLO technique", content: "Patient: Bella (Golden Retriever, 4y, 28.5kg)\n\nProcedure: Tibial Plateau Leveling Osteotomy (TPLO)\n\nAnesthesia: General - Propofol induction, Isoflurane maintenance\n\nFindings: Complete rupture of left cranial cruciate ligament. Mild meniscal damage noted.\n\nProcedure Details: Standard lateral approach. TPLO plate (3.5mm) applied. Rotation angle: 24°. Meniscal inspection performed - partial meniscectomy of caudal horn.\n\nPost-op: Recovery uneventful. Pain management with Meloxicam and Tramadol.\n\nPrognosis: Good with appropriate rehabilitation protocol." },
  { id: "2", caseNumber: "VET-2024-0153", title: "Dental Procedure Report", petName: "Max", species: "cat", ownerName: "Tom Parker", doctor: "Dr. Emily Chen", date: "2024-03-18", summary: "Stage 2 periodontal disease - dental cleaning and extractions", content: "Patient: Max (Persian Cat, 3y, 3.8kg)\n\nProcedure: Full dental cleaning, radiographs, and selective extractions\n\nFindings: Stage 2 periodontal disease. Two mandibular incisors with >50% bone loss.\n\nExtractions: #301, #302 (mandibular incisors)\n\nPost-op: Buprenorphine for pain management. Soft food for 14 days. Clindamycin antibiotics for 7 days.\n\nFollow-up: 2-week recheck recommended." },
  { id: "3", caseNumber: "VET-2024-0149", title: "Emergency Urinary Obstruction Report", petName: "Shadow", species: "cat", ownerName: "Lisa Brown", doctor: "Dr. Aris Rahman", date: "2024-03-16", summary: "Emergency catheterization for urethral obstruction", content: "Patient: Shadow (DSH Cat, 5y, 5.2kg)\n\nPresentation: Straining to urinate x 24hrs. Distended, painful bladder on palpation.\n\nDiagnosis: Urethral obstruction (struvite crystals)\n\nTreatment: Sedation with Dexmedetomidine + Butorphanol. Urethral catheterization under aseptic technique. Approximately 180mL turbid urine drained.\n\nLab: BUN 42, Creatinine 3.8, K+ 7.2 (corrected with IV fluids + calcium gluconate)\n\nPlan: Indwelling catheter 48hrs. IV fluid diuresis. Switch to prescription urinary diet long-term." },
];

export default function Reports() {
  const [reports] = useState<Report[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newReport, setNewReport] = useState({ caseNumber: "", title: "", petName: "", summary: "", content: "" });

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Documentation</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Medical Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">{reports.length} reports generated</p>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <Plus className="w-4 h-4" /> Create Report
        </motion.button>
      </motion.div>

      {/* Report cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, i) => {
          const Icon = report.species === "dog" ? Dog : Cat;
          return (
            <motion.div key={report.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card p-5 card-hover border border-border/30 cursor-pointer group" onClick={() => setSelectedReport(report)}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground">{report.caseNumber}</span>
                  <p className="text-sm font-bold mt-0.5 group-hover:text-emerald transition-colors">{report.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{report.petName} · {report.ownerName}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{report.doctor} · {report.date}</p>
                  <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{report.summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/30 hover:bg-emerald/10 hover:text-emerald transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/30 hover:bg-cyan/10 hover:text-cyan transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* View Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{selectedReport.caseNumber}</span>
                  <h3 className="text-xl font-bold mt-1">{selectedReport.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedReport.petName} · {selectedReport.ownerName} · {selectedReport.doctor}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{selectedReport.date}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Summary</p>
                <p className="text-sm">{selectedReport.summary}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Full Report</p>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground/85">{selectedReport.content}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Report Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Create Medical Report</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Case Number</label>
                  <input value={newReport.caseNumber} onChange={e => setNewReport(p => ({ ...p, caseNumber: e.target.value }))} placeholder="VET-2024-XXXX" className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Patient Name</label>
                  <input value={newReport.petName} onChange={e => setNewReport(p => ({ ...p, petName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Report Title</label>
                <input value={newReport.title} onChange={e => setNewReport(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Summary</label>
                <input value={newReport.summary} onChange={e => setNewReport(p => ({ ...p, summary: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Report Content</label>
                <textarea value={newReport.content} onChange={e => setNewReport(p => ({ ...p, content: e.target.value }))} rows={6} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 resize-none" />
              </div>
              <button onClick={() => setShowCreate(false)} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Create Report</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
