"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  X,
  Calculator,
  Dog,
  Cat,
  AlertTriangle,
  FlaskConical,
  Pill,
} from "lucide-react";
import {
  calculateDose,
  type DoseUnit,
} from "@/app/_lib/utils/dosage-calculator";
import type { FluidSpecies } from "@/app/_lib/utils/fluid-therapy";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DrugDoseCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  /** Auto-fill from simulation pet */
  initialWeight?: number;
  initialSpecies?: FluidSpecies;
  petName?: string;
}

// ── Input Field ───────────────────────────────────────────────────────────────

function CalcInput({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  unit,
  icon,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
      </div>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/70">{sublabel}</p>
      )}
      <div className="relative">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-base font-bold outline-none focus:border-emerald/50 transition-colors tabular-nums pr-16"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/60">
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function DrugDoseCalculatorModal({
  open,
  onClose,
  initialWeight,
  initialSpecies,
  petName,
}: DrugDoseCalculatorModalProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [species, setSpecies] = React.useState<FluidSpecies>(
    initialSpecies ?? "dog",
  );
  const [weight, setWeight] = React.useState<string>(
    initialWeight != null ? String(initialWeight) : "",
  );
  const [dosage, setDosage] = React.useState<string>("");
  const [concentration, setConcentration] = React.useState<string>("");
  const [doseUnit, setDoseUnit] = React.useState<DoseUnit>("mL");

  // ── Sync props when opened ──────────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      if (initialSpecies) setSpecies(initialSpecies);
      if (initialWeight != null) setWeight(String(initialWeight));
    }
  }, [open, initialWeight, initialSpecies]);

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  // ── Calculation ────────────────────────────────────────────────────────────
  const w = parseFloat(weight) || 0;
  const d = parseFloat(dosage) || 0;
  const c = parseFloat(concentration) || 0;

  const result = calculateDose({
    weightKg: w,
    dosageMgPerKg: d,
    concentrationMgPerUnit: c,
    unit: doseUnit,
  });

  const hasAllInputs = w > 0 && d > 0 && c > 0;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="dose-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{ zIndex: 10000 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <div
            style={{ zIndex: 10000 }}
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 pointer-events-none"
          >
            <motion.div
              key="dose-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card/95 border border-border/60 rounded-[1.75rem] w-full max-w-lg max-h-[94vh] overflow-y-auto shadow-[0_30px_120px_-40px_rgba(16,185,129,0.45)] pointer-events-auto custom-scrollbar"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-emerald/10 via-cyan/5 to-transparent" />

              {/* ── Header ── */}
              <div className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur-2xl">
                <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald/15 border border-emerald/25 flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5 text-emerald" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-black tracking-tight">
                        Drug Dose Calculator
                      </h2>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {petName
                          ? `Patient: ${petName}`
                          : "Dose = Weight × Dosage ÷ Concentration"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-cyan/10 border border-cyan/20 text-cyan">
                          {species === "dog" ? "Canine" : "Feline"}
                        </span>
                        {w > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/10 border border-emerald/20 text-emerald tabular-nums">
                            {w.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    aria-label="Close drug dose calculator"
                    className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="relative p-4 sm:p-5 space-y-5">
                {/* Formula reference */}
                <div className="p-3 rounded-xl bg-emerald/5 border border-emerald/15 text-center">
                  <p className="text-xs font-bold text-emerald">
                    Dose ({doseUnit}) = Weight (kg) × Dosage (mg/kg) ÷
                    Concentration (mg/{doseUnit === "mL" ? "mL" : "tablet"})
                  </p>
                </div>

                {/* Species toggle */}
                <div className="flex gap-2">
                  {(["dog", "cat"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpecies(s)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                        species === s
                          ? s === "dog"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                          : "bg-tint/5 text-muted-foreground hover:bg-tint/10 border border-transparent"
                      }`}
                    >
                      {s === "dog" ? (
                        <Dog className="w-4 h-4" />
                      ) : (
                        <Cat className="w-4 h-4" />
                      )}
                      {s === "dog" ? "Canine" : "Feline"}
                    </button>
                  ))}
                </div>

                {/* Unit toggle */}
                <div className="flex gap-2">
                  {(["mL", "tablets"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setDoseUnit(u)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        doseUnit === u
                          ? "bg-cyan/15 text-cyan border border-cyan/30"
                          : "bg-tint/5 text-muted-foreground hover:bg-tint/10 border border-transparent"
                      }`}
                    >
                      {u === "mL" ? (
                        <FlaskConical className="w-3.5 h-3.5" />
                      ) : (
                        <Pill className="w-3.5 h-3.5" />
                      )}
                      {u === "mL" ? "Liquid (mL)" : "Tablets"}
                    </button>
                  ))}
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <CalcInput
                    label="Weight — الوزن"
                    sublabel="Animal body weight"
                    value={weight}
                    onChange={setWeight}
                    placeholder="e.g. 25"
                    unit="kg"
                  />
                  <CalcInput
                    label="Dosage — الجرعة"
                    sublabel="Prescribed dose per kg"
                    value={dosage}
                    onChange={setDosage}
                    placeholder="e.g. 10"
                    unit="mg/kg"
                  />
                  <CalcInput
                    label={`Concentration — التركيز`}
                    sublabel={`Drug concentration per ${doseUnit === "mL" ? "mL" : "tablet"}`}
                    value={concentration}
                    onChange={setConcentration}
                    placeholder="e.g. 50"
                    unit={`mg/${doseUnit === "mL" ? "mL" : "tab"}`}
                  />
                </div>

                {/* ── Result ── */}
                <AnimatePresence>
                  {hasAllInputs && result.valid && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 rounded-2xl border border-emerald/30 bg-emerald/5 p-5"
                    >
                      {/* Main result */}
                      <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Calculated Dose — الجرعة المحسوبة
                        </p>
                        <motion.p
                          key={result.dose}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-black text-emerald tabular-nums"
                        >
                          {result.dose}
                          <span className="text-lg ml-1 text-emerald/70">
                            {doseUnit}
                          </span>
                        </motion.p>
                      </div>

                      {/* Breakdown */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-card/50 border border-border/30 text-center">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">
                            Weight
                          </p>
                          <p className="text-sm font-black tabular-nums">
                            {w} <span className="text-[10px] text-muted-foreground">kg</span>
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-card/50 border border-border/30 text-center">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">
                            Total mg
                          </p>
                          <p className="text-sm font-black tabular-nums text-cyan">
                            {result.totalMg} <span className="text-[10px] text-muted-foreground">mg</span>
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-card/50 border border-border/30 text-center">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">
                            Concentration
                          </p>
                          <p className="text-sm font-black tabular-nums">
                            {c} <span className="text-[10px] text-muted-foreground">mg/{doseUnit === "mL" ? "mL" : "tab"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Equation display */}
                      <div className="p-3 rounded-xl bg-card/50 border border-border/30 text-center">
                        <p className="text-xs text-muted-foreground font-mono">
                          {w} kg × {d} mg/kg ÷ {c} mg/{doseUnit === "mL" ? "mL" : "tab"} ={" "}
                          <span className="font-bold text-emerald">
                            {result.dose} {doseUnit}
                          </span>
                        </p>
                      </div>

                      {/* Warning */}
                      {result.warning && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="font-semibold">{result.warning}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prompt when inputs are incomplete */}
                {!hasAllInputs && (
                  <div className="p-6 rounded-2xl border border-border/30 bg-muted/5 text-center space-y-2">
                    <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Enter weight, dosage, and concentration
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      أدخل الوزن والجرعة والتركيز لحساب الجرعة
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
