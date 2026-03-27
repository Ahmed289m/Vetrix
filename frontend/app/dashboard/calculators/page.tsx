"use client";

import { useState } from "react";
import { motion } from "@/app/_components/fast-motion";
import { Droplets, Zap, Pill } from "lucide-react";
import FluidTherapyCalc from "@/app/_components/calculators/FluidTherapyCalc";
import CRICalc from "@/app/_components/calculators/CRICalc";
import DrugDoseCalc from "@/app/_components/calculators/DrugDoseCalc";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

type CalcMode = "drug" | "fluid" | "cri";

import { useLang } from "@/app/_hooks/useLanguage";

export default function CalculatorsPage() {
  const [mode, setMode] = useState<CalcMode>("drug");
  const { t } = useLang();

  const modes: { key: CalcMode; labelKey: string; icon: typeof Pill }[] = [
    { key: "drug", labelKey: "drug_dose", icon: Pill },
    { key: "fluid", labelKey: "fluid_therapy", icon: Droplets },
    { key: "cri", labelKey: "cri", icon: Zap },
  ];

  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
          {t("clinical_tools")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t("calculators")}
        </h2>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        {modes.map((m) => (
          <motion.button
            key={m.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMode(m.key)}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              mode === m.key
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "glass-card border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}
          >
            <m.icon className="w-4 h-4" /> {t(m.labelKey)}
          </motion.button>
        ))}
      </motion.div>

      {mode === "drug" && <DrugDoseCalc />}
      {mode === "fluid" && <FluidTherapyCalc />}
      {mode === "cri" && <CRICalc />}
    </motion.div>
  );
}
