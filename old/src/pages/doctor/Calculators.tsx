import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Droplets, Zap, Pill } from "lucide-react";
import FluidTherapyCalc from "@/components/calculators/FluidTherapyCalc";
import CRICalc from "@/components/calculators/CRICalc";
import DrugDoseCalc from "@/components/calculators/DrugDoseCalc";
import { useLang } from "@/hooks/useLanguage";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

type CalcMode = "drug" | "fluid" | "cri";

export default function Calculators() {
  const { t } = useLang();
  const [mode, setMode] = useState<CalcMode>("drug");

  const modes: { key: CalcMode; label: string; icon: typeof Calculator }[] = [
    { key: "drug", label: t("drug_dose"), icon: Pill },
    { key: "fluid", label: t("fluid_therapy"), icon: Droplets },
    { key: "cri", label: t("cri"), icon: Zap },
  ];

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">{t("clinical_tools")}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("calculators")}</h2>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        {modes.map(m => (
          <motion.button key={m.key} whileTap={{ scale: 0.97 }} onClick={() => setMode(m.key)}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              mode === m.key ? "gradient-emerald-cyan text-primary-foreground glow-emerald" : "glass-card border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </motion.button>
        ))}
      </motion.div>

      {mode === "drug" && <DrugDoseCalc />}
      {mode === "fluid" && <FluidTherapyCalc />}
      {mode === "cri" && <CRICalc />}
    </motion.div>
  );
}
