import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, Dog, Cat, Clock, Activity, ChevronRight, AlertTriangle, ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/useLanguage";

interface SimCase {
  id: string;
  caseNumber: string;
  petName: string;
  species: "dog" | "cat";
  breed: string;
  ownerName: string;
  complaint: string;
  severity: "normal" | "urgent" | "emergency";
  doctor: string;
  status: "waiting" | "in-progress" | "completed";
}

const mockCases: SimCase[] = [
  { id: "1", caseNumber: "VET-2026-0142", petName: "Bella", species: "dog", breed: "Golden Retriever", ownerName: "Sarah Mitchell", complaint: "Persistent vomiting, lethargy for 2 days", severity: "urgent", doctor: "Dr. Emily", status: "waiting" },
  { id: "2", caseNumber: "VET-2026-0143", petName: "Whiskers", species: "cat", breed: "Persian", ownerName: "Tom Parker", complaint: "Annual vaccination + dental check", severity: "normal", doctor: "Dr. Emily", status: "waiting" },
  { id: "3", caseNumber: "VET-2026-0144", petName: "Rocky", species: "dog", breed: "German Shepherd", ownerName: "James Wilson", complaint: "Acute limping, possible fracture", severity: "emergency", doctor: "Dr. Aris", status: "waiting" },
  { id: "4", caseNumber: "VET-2026-0145", petName: "Luna", species: "cat", breed: "Siamese", ownerName: "Amy Chen", complaint: "Skin rash, excessive scratching", severity: "normal", doctor: "Dr. Emily", status: "waiting" },
];

const severityConfig = {
  normal: { bg: "bg-emerald/10", border: "border-emerald/30", text: "text-emerald", label: "Normal" },
  urgent: { bg: "bg-orange/10", border: "border-orange/30", text: "text-orange", label: "Urgent" },
  emergency: { bg: "bg-coral/10", border: "border-coral/30", text: "text-coral", label: "Emergency" },
};

interface Props {
  role: "staff" | "doctor";
}

export default function SimulationMode({ role }: Props) {
  const { t } = useLang();
  const [cases, setCases] = useState<SimCase[]>(mockCases.map(c => ({ ...c })));
  const [currentIdx, setCurrentIdx] = useState(0);

  const currentCase = cases[currentIdx];
  const nextCase = cases[currentIdx + 1] || null;
  const allDone = currentIdx >= cases.length;

  const handleStart = () => {
    setCases(prev => prev.map((c, i) => i === currentIdx ? { ...c, status: "in-progress" } : c));
  };

  const handleComplete = () => {
    setCases(prev => prev.map((c, i) => i === currentIdx ? { ...c, status: "completed" } : c));
    setCurrentIdx(prev => prev + 1);
  };

  const isStaff = role === "staff";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={currentCase?.status === "in-progress" ? { rotate: 360 } : {}}
            transition={{ repeat: currentCase?.status === "in-progress" ? Infinity : 0, duration: 3, ease: "linear" }}
            className="w-8 h-8 rounded-full gradient-emerald-cyan flex items-center justify-center glow-emerald"
          >
            <Activity className="w-4 h-4 text-primary-foreground" />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold">{t("sim_mode")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {isStaff ? t("staff_controls") : t("doctor_view")}
            </p>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              animate={i === currentIdx && c.status === "in-progress" ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                c.status === "completed" ? "bg-emerald" :
                i === currentIdx && c.status === "in-progress" ? "bg-cyan glow-cyan" :
                i === currentIdx ? "bg-orange" : "bg-muted/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* All done state */}
      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-xl border-2 border-emerald/30 bg-emerald/5 text-center space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <CheckCircle2 className="w-12 h-12 text-emerald mx-auto" />
          </motion.div>
          <p className="text-lg font-extrabold text-emerald">{t("no_more_cases")}</p>
        </motion.div>
      )}

      {/* Current Case */}
      <AnimatePresence mode="wait">
        {currentCase && !allDone && (
          <motion.div
            key={currentCase.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`p-5 rounded-xl border-2 ${severityConfig[currentCase.severity].border} ${severityConfig[currentCase.severity].bg} space-y-4`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("current_case")}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={currentCase.status === "in-progress" ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center"
                >
                  {currentCase.species === "dog" ? <Dog className="w-6 h-6 text-foreground" /> : <Cat className="w-6 h-6 text-foreground" />}
                </motion.div>
                <div>
                  <p className="text-lg font-extrabold">{currentCase.petName}</p>
                  <p className="text-xs text-muted-foreground">{currentCase.breed} · {currentCase.ownerName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{currentCase.caseNumber}</p>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${severityConfig[currentCase.severity].bg} ${severityConfig[currentCase.severity].text}`}>
                  {severityConfig[currentCase.severity].label}
                </span>
                <p className="text-xs text-muted-foreground">{currentCase.doctor}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80">{currentCase.complaint}</p>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                currentCase.status === "in-progress" ? "bg-cyan/15 text-cyan" : "bg-muted/30 text-muted-foreground"
              }`}>
                {currentCase.status === "in-progress" && <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-cyan" />}
                {currentCase.status === "waiting" ? t("waiting") : t("in_progress")}
              </span>
            </div>

            {/* Staff controls */}
            {isStaff && (
              <div className="flex items-center gap-3 pt-2">
                {currentCase.status === "waiting" && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleStart}
                    className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
                    <Play className="w-4 h-4" /> {t("start")}
                  </motion.button>
                )}
                {currentCase.status === "in-progress" && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleComplete}
                    className="flex items-center gap-2 bg-emerald text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
                    <CheckCircle2 className="w-4 h-4" /> {t("complete")}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Case Preview */}
      <AnimatePresence>
        {nextCase && !allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl bg-muted/10 border border-border/30 border-dashed"
          >
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("next_case")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                {nextCase.species === "dog" ? <Dog className="w-5 h-5 text-muted-foreground" /> : <Cat className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{nextCase.petName} <span className="font-normal text-muted-foreground text-xs">— {nextCase.ownerName}</span></p>
                <p className="text-xs text-muted-foreground truncate">{nextCase.complaint}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${severityConfig[nextCase.severity].bg} ${severityConfig[nextCase.severity].text}`}>
                {severityConfig[nextCase.severity].label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
