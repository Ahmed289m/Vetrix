"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  CheckCircle2,
  Dog,
  Cat,
  Eye,
  X,
  FileText,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

interface Visit {
  id: string;
  caseNumber: string;
  caseName: string;
  petName: string;
  species: "dog" | "cat";
  ownerName: string;
  doctor: string;
  date: string;
  time: string;
  status: "in-progress" | "completed";
  diagnosis: string;
  prescriptions: string[];
  report: string;
}

const initialVisits: Visit[] = [
  {
    id: "1",
    caseNumber: "VET-2024-0152",
    caseName: "ACL Repair Post-Op",
    petName: "Bella",
    species: "dog",
    ownerName: "Sarah Mitchell",
    doctor: "Dr. Emily Chen",
    date: "2024-03-18",
    time: "09:00",
    status: "in-progress",
    diagnosis:
      "Left cruciate ligament repair - day 3 post-op. Healing well, no signs of infection.",
    prescriptions: [
      "Meloxicam 0.1mg/kg PO q24h",
      "Amoxicillin 22mg/kg PO q12h",
    ],
    report:
      "Patient recovering well from left ACL repair surgery. Incision site clean and dry. Range of motion improving. Continue restricted activity for 6 weeks.",
  },
  {
    id: "2",
    caseNumber: "VET-2024-0153",
    caseName: "Dental Stage 2",
    petName: "Max",
    species: "cat",
    ownerName: "Tom Parker",
    doctor: "Dr. Emily Chen",
    date: "2024-03-18",
    time: "09:30",
    status: "in-progress",
    diagnosis: "Periodontal disease stage 2. Two extractions performed.",
    prescriptions: [
      "Buprenorphine 0.02mg/kg SL q8h x3d",
      "Clindamycin 11mg/kg PO q12h x7d",
    ],
    report:
      "Full dental cleaning and two incisor extractions performed under general anesthesia. Patient recovered well from anesthesia.",
  },
  {
    id: "3",
    caseNumber: "VET-2024-0151",
    caseName: "Annual Vaccination",
    petName: "Duke",
    species: "dog",
    ownerName: "Mike Johnson",
    doctor: "Dr. Aris Rahman",
    date: "2024-03-17",
    time: "14:00",
    status: "completed",
    diagnosis: "Healthy. Annual DHPP and Rabies booster administered.",
    prescriptions: [],
    report:
      "Annual wellness exam complete. All vitals normal. Vaccinations administered. Next visit in 12 months.",
  },
  {
    id: "4",
    caseNumber: "VET-2024-0150",
    caseName: "Dermatitis Treatment",
    petName: "Rocky",
    species: "dog",
    ownerName: "James Wilson",
    doctor: "Dr. Emily Chen",
    date: "2024-03-17",
    time: "10:30",
    status: "completed",
    diagnosis: "Atopic dermatitis with secondary bacterial infection.",
    prescriptions: [
      "Apoquel 0.4mg/kg PO q12h x14d",
      "Cephalexin 22mg/kg PO q12h x14d",
      "Medicated shampoo 2x/week",
    ],
    report:
      "Skin scraping negative for mites. Cytology shows bacterial overgrowth. Started on immunomodulator and antibiotics.",
  },
  {
    id: "5",
    caseNumber: "VET-2024-0149",
    caseName: "Urinary Blockage",
    petName: "Shadow",
    species: "cat",
    ownerName: "Lisa Brown",
    doctor: "Dr. Aris Rahman",
    date: "2024-03-16",
    time: "Emergency",
    status: "completed",
    diagnosis: "Urethral obstruction. Emergency catheterization performed.",
    prescriptions: [
      "Prazosin 0.25mg PO q12h",
      "Buprenorphine 0.02mg/kg SL q8h x3d",
      "Prescription urinary diet",
    ],
    report:
      "Male cat presented with urethral obstruction. Emergency catheterization performed successfully. Catheter to remain 48 hours. Switch to prescription urinary diet long-term.",
  },
];

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">(
    "all",
  );
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const { t } = useLang();

  const filtered =
    filter === "all" ? visits : visits.filter((v) => v.status === filter);
  const inProgressCount = visits.filter(
    (v) => v.status === "in-progress",
  ).length;

  const handleComplete = (id: string) => {
    setVisits((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: "completed" as const } : v,
      ),
    );
  };

  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
          {t("visit_management")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t("visits_history")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {inProgressCount} {t("in_progress")} · {visits.length} {t("total")}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2">
        {(["all", "in-progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((visit, i) => {
          const Icon = visit.species === "dog" ? Dog : Cat;
          const isInProgress = visit.status === "in-progress";
          return (
            <motion.div
              key={visit.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card p-4 sm:p-5 border ${isInProgress ? "border-cyan/20" : "border-border/30"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isInProgress ? "bg-cyan/10" : "bg-muted/30"}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isInProgress ? "text-cyan" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {visit.caseNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${isInProgress ? "bg-cyan/15 text-cyan" : "bg-emerald/15 text-emerald"}`}
                      >
                        {visit.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-bold mt-0.5">{visit.caseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {visit.petName} · {visit.ownerName} · {visit.doctor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {visit.date} {visit.time}
                  </span>
                  <button
                    onClick={() => setSelectedVisit(visit)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50 hover:border-emerald/30"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t("details")}
                  </button>
                  {isInProgress && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleComplete(visit.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-emerald-cyan text-primary-foreground glow-emerald"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Visit Detail Modal */}
      <AnimatePresence>
        {selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVisit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedVisit.caseNumber}
                  </span>
                  <h3 className="text-xl font-bold mt-1">
                    {selectedVisit.caseName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVisit.petName} · {selectedVisit.ownerName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Date
                  </p>
                  <p className="text-sm font-semibold">{selectedVisit.date}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Time
                  </p>
                  <p className="text-sm font-semibold">{selectedVisit.time}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Doctor
                  </p>
                  <p className="text-sm font-semibold">
                    {selectedVisit.doctor}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Status
                  </p>
                  <p
                    className={`text-sm font-semibold ${selectedVisit.status === "in-progress" ? "text-cyan" : "text-emerald"}`}
                  >
                    {selectedVisit.status}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-emerald" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Diagnosis
                    </span>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {selectedVisit.diagnosis}
                  </p>
                </div>
                {selectedVisit.prescriptions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-cyan" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Prescriptions
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedVisit.prescriptions.map((rx, j) => (
                        <li
                          key={j}
                          className="text-sm text-foreground/85 font-mono bg-muted/20 px-3 py-2 rounded-lg border border-border/30"
                        >
                          {rx}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Report
                    </span>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {selectedVisit.report}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
