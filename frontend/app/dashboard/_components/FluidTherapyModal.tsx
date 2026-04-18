"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Droplets,
  Dog,
  Cat,
  AlertTriangle,
  Info,
  ChevronDown,
  Beaker,
  Clock,
  Activity,
  FlaskConical,
  Scale,
} from "lucide-react";
import {
  calcMaintenanceAllometric,
  calcFluidDeficit,
  calcOngoingLosses,
  calcTotal24h,
  calcHourlyRate,
  calcMinuteRate,
  calcDropsPerMinute,
  calcDropsPerSecond,
  calcDilutionV1,
  getDehydrationSeverity,
  getSmartPlan,
  calcPhaseVolumes,
  getMaxBolusRate,
  getNormalRateRange,
  CLINICAL_PRECAUTIONS,
  DEHYDRATION_COLOR,
  type FluidSpecies,
  type DropFactor,
} from "@/app/_lib/utils/fluid-therapy";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FluidTherapyModalProps {
  open: boolean;
  onClose: () => void;
  /** Auto-fill from simulation pet */
  initialWeight?: number;
  initialSpecies?: FluidSpecies;
  petName?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className={`p-3 rounded-xl border text-center ${color}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <motion.p
        key={value.toFixed(1)}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-xl font-extrabold tabular-nums"
      >
        {Math.round(value).toLocaleString()}
      </motion.p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}

function NumberStepper({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 50,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/70">{sublabel}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-xl bg-tint/10 hover:bg-tint/20 font-black text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) =>
            onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))
          }
          className="flex-1 text-center py-2 rounded-xl bg-muted/30 border border-border/50 text-sm font-bold outline-none focus:border-blue-400/50 transition-colors"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-xl bg-tint/10 hover:bg-tint/20 font-black text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

const DROP_FACTORS: DropFactor[] = [10, 15, 20, 60];

export function FluidTherapyModal({
  open,
  onClose,
  initialWeight,
  initialSpecies,
  petName,
}: FluidTherapyModalProps) {
  // ── Inputs ─────────────────────────────────────────────────────────────────
  const [species, setSpecies] = React.useState<FluidSpecies>(
    initialSpecies ?? "dog",
  );
  const [weight, setWeight] = React.useState<string>(
    initialWeight != null ? String(initialWeight) : "",
  );
  const [dehydration, setDehydration] = React.useState(5);
  const [vomitCount, setVomitCount] = React.useState(0);
  const [diarrheaCount, setDiarrheaCount] = React.useState(0);
  const [dropFactor, setDropFactor] = React.useState<DropFactor>(20);

  // ── Dilution inputs ─────────────────────────────────────────────────────────
  const [dilC1, setDilC1] = React.useState("");
  const [dilC2, setDilC2] = React.useState("");
  const [dilV2, setDilV2] = React.useState("");

  // ── UI toggles ──────────────────────────────────────────────────────────────
  const [showSmartPlan, setShowSmartPlan] = React.useState(false);
  const [showDilution, setShowDilution] = React.useState(false);
  const [showPrecautions, setShowPrecautions] = React.useState(false);

  // ── Sync props when opened ──────────────────────────────────────────────────
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

  // ── Calculations ────────────────────────────────────────────────────────────
  const w = parseFloat(weight) || 0;
  const maintenance = calcMaintenanceAllometric(w, species);
  const deficit = calcFluidDeficit(w, dehydration);
  const ongoing = calcOngoingLosses(w, vomitCount, diarrheaCount);
  const total24h = calcTotal24h(maintenance, deficit, ongoing);
  const hourlyRate = calcHourlyRate(total24h);
  const minuteRate = calcMinuteRate(hourlyRate);
  const dropsPerMin = calcDropsPerMinute(minuteRate, dropFactor);
  const dropsPerSec = calcDropsPerSecond(dropsPerMin);
  const maxBolus = getMaxBolusRate(w, species);
  const normalRange = getNormalRateRange(w);
  const severity = getDehydrationSeverity(dehydration);
  const colors = DEHYDRATION_COLOR[severity];
  const smartPlan = getSmartPlan(species);
  const [phase1, phase2] = smartPlan.map((p) =>
    calcPhaseVolumes(p, deficit, maintenance, ongoing),
  );

  // Dilution
  const dilV1 = calcDilutionV1(
    parseFloat(dilC1) || 0,
    parseFloat(dilC2) || 0,
    parseFloat(dilV2) || 0,
  );

  const hasWeight = w > 0;
  const phase1Hours = smartPlan[0].hours[1];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="fluid-backdrop"
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
              key="fluid-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card/95 border border-border/60 rounded-[1.75rem] w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-[0_30px_120px_-40px_rgba(14,165,233,0.45)] pointer-events-auto custom-scrollbar"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-cyan/10 via-emerald/5 to-transparent" />

              {/* ── Header ── */}
              <div className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur-2xl">
                <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                      <Droplets className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-black tracking-tight">
                        Fluid Therapy Calculator
                      </h2>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {petName
                          ? `Patient: ${petName}`
                          : "Maintenance · Deficit · Ongoing Losses"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-cyan/10 border border-cyan/20 text-cyan">
                          {species === "dog" ? "Canine" : "Feline"}
                        </span>
                        {hasWeight && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/10 border border-emerald/20 text-emerald tabular-nums">
                            {w.toFixed(1)} kg
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${colors.bg} ${colors.border} ${colors.text}`}
                        >
                          {severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    aria-label="Close fluid therapy calculator"
                    className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative p-4 sm:p-5 lg:p-6 space-y-5">
                {/* ── Input Section ── */}
                <div className="space-y-4 rounded-2xl border border-border/40 bg-muted/10 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    Patient Parameters
                  </p>

                  {/* Row 1: Pet Type + Weight */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pet Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" />
                        Pet Type (نوع الحيوان)
                      </label>
                      <div className="flex gap-2">
                        {(["dog", "cat"] as FluidSpecies[]).map((s) => (
                          <motion.button
                            key={s}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSpecies(s)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                              species === s
                                ? "gradient-emerald-cyan text-primary-foreground border-transparent shadow-[0_0_15px_-5px_hsl(160,84%,39%,0.5)]"
                                : "bg-tint/5 border-tint/10 text-muted-foreground hover:border-emerald/30"
                            }`}
                          >
                            {s === "dog" ? (
                              <Dog className="w-4 h-4" />
                            ) : (
                              <Cat className="w-4 h-4" />
                            )}
                            {s}
                          </motion.button>
                        ))}
                      </div>
                      {initialSpecies && (
                        <p className="text-[10px] text-emerald flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Auto-filled from patient record
                        </p>
                      )}
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" />
                        Body Weight — الوزن (kg)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 25"
                        min="0"
                        max="300"
                        step="0.1"
                        className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm font-bold outline-none focus:border-blue-400/50 transition-colors"
                      />
                      {initialWeight != null && (
                        <p className="text-[10px] text-emerald flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Auto-filled from patient record
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Dehydration % */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">
                      Dehydration % — نسبة الجفاف
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={dehydration}
                        onChange={(e) => setDehydration(Number(e.target.value))}
                        className="flex-1 accent-blue-400"
                      />
                      <span
                        className={`text-sm font-extrabold tabular-nums w-12 text-right ${colors.text}`}
                      >
                        {dehydration}%
                      </span>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-1.5">
                      {[0, 5, 7, 10, 12, 15].map((v) => (
                        <button
                          key={v}
                          onClick={() => setDehydration(v)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            dehydration === v
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-tint/5 text-muted-foreground hover:bg-tint/10"
                          }`}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                    {/* Severity bar */}
                    {dehydration > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">
                            Severity
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase ${colors.text}`}
                          >
                            {severity}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            animate={{
                              width: `${Math.min((dehydration / 15) * 100, 100)}%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${colors.bar}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Ongoing losses */}
                  <div className="grid grid-cols-2 gap-4">
                    <NumberStepper
                      label="Vomiting — عدد مرات القيء"
                      sublabel="1 mL/kg per episode"
                      value={vomitCount}
                      onChange={setVomitCount}
                    />
                    <NumberStepper
                      label="Diarrhea — عدد مرات الإسهال"
                      sublabel="200 mL/kg per episode"
                      value={diarrheaCount}
                      onChange={setDiarrheaCount}
                    />
                  </div>
                </div>

                {/* ── Results ── */}
                <AnimatePresence>
                  {hasWeight && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 rounded-2xl border border-border/40 bg-card/40 p-4 sm:p-5"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Volume Calculations
                      </p>

                      {/* Volume breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard
                          label="Maintenance"
                          value={maintenance}
                          unit="mL/day"
                          color="bg-emerald/5 border-emerald/20 text-emerald"
                        />
                        <StatCard
                          label="Deficit"
                          value={deficit}
                          unit="mL"
                          color="bg-blue-500/5 border-blue-500/20 text-blue-400"
                        />
                        <StatCard
                          label="Ongoing Loss"
                          value={ongoing}
                          unit="mL"
                          color="bg-orange/5 border-orange/20 text-orange"
                        />
                        <StatCard
                          label="Total 24h"
                          value={total24h}
                          unit="mL"
                          color="gradient-emerald-cyan text-primary-foreground border-transparent"
                        />
                      </div>

                      {/* Rate section */}
                      <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            Infusion Rates
                          </p>
                          {/* Drop factor selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-bold">
                              Drop factor:
                            </span>
                            {DROP_FACTORS.map((df) => (
                              <button
                                key={df}
                                onClick={() => setDropFactor(df)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                                  dropFactor === df
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {df}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              label: "Hourly Rate",
                              value: hourlyRate.toFixed(1),
                              unit: "mL/hr",
                              color: "text-blue-400",
                            },
                            {
                              label: "Minute Rate",
                              value: minuteRate.toFixed(2),
                              unit: "mL/min",
                              color: "text-cyan",
                            },
                            {
                              label: "Drops/min",
                              value: dropsPerMin.toFixed(0),
                              unit: "drops/min",
                              color: "text-emerald",
                            },
                            {
                              label: "Drops/sec",
                              value: dropsPerSec.toFixed(2),
                              unit: "drops/sec",
                              color: "text-emerald",
                            },
                          ].map((r) => (
                            <div
                              key={r.label}
                              className="text-center p-2 rounded-lg bg-tint/5"
                            >
                              <p className="text-[10px] text-muted-foreground font-bold">
                                {r.label}
                              </p>
                              <motion.p
                                key={r.value}
                                initial={{ scale: 1.1, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-lg font-extrabold tabular-nums ${r.color}`}
                              >
                                {r.value}
                              </motion.p>
                              <p className="text-[10px] text-muted-foreground">
                                {r.unit}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Safety limits */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="font-bold text-foreground">
                              Normal range
                            </p>
                            <p>
                              {normalRange.min.toFixed(0)}–
                              {normalRange.max.toFixed(0)} mL/hr
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="font-bold text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Max bolus rate
                            </p>
                            <p>{maxBolus.toFixed(0)} mL/hr</p>
                          </div>
                        </div>
                      </div>

                      {/* ── Smart 2-Phase Plan ── */}
                      <button
                        onClick={() => setShowSmartPlan((p) => !p)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40 hover:border-emerald/30 transition-all text-sm"
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <Clock className="w-4 h-4 text-emerald" />
                          Smart 2-Phase Correction Plan
                        </div>
                        <motion.div
                          animate={{ rotate: showSmartPlan ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showSmartPlan && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-1">
                              {/* Timeline bar */}
                              <div className="relative h-8 rounded-xl overflow-hidden bg-muted/20 border border-border/30">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${(phase1Hours / 24) * 100}%`,
                                  }}
                                  transition={{ duration: 1, delay: 0.1 }}
                                  className="absolute inset-y-0 left-0 bg-linear-to-r from-cyan/30 to-emerald/30 border-r-2 border-emerald/50 flex items-center justify-center text-[10px] font-bold text-emerald"
                                >
                                  Phase 1
                                </motion.div>
                                <div
                                  className="absolute inset-y-0 flex items-center justify-center text-[10px] font-bold text-cyan"
                                  style={{
                                    left: `${(phase1Hours / 24) * 100}%`,
                                    right: 0,
                                  }}
                                >
                                  Phase 2
                                </div>
                              </div>

                              {/* Phase cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  {
                                    ph: phase1,
                                    plan: smartPlan[0],
                                    col: "border-emerald/20 bg-emerald/5",
                                    rateCol: "gradient-emerald-cyan",
                                    tag: "text-emerald",
                                    num: "1",
                                  },
                                  {
                                    ph: phase2,
                                    plan: smartPlan[1],
                                    col: "border-cyan/20 bg-cyan/5",
                                    rateCol: "bg-cyan",
                                    tag: "text-cyan",
                                    num: "2",
                                  },
                                ].map(
                                  ({ ph, plan, col, rateCol, tag, num }) => (
                                    <div
                                      key={num}
                                      className={`p-3.5 rounded-xl border ${col} space-y-2.5`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-5 h-5 rounded-full ${rateCol} flex items-center justify-center text-[10px] font-extrabold text-primary-foreground`}
                                          >
                                            {num}
                                          </div>
                                          <span className="text-xs font-bold uppercase">
                                            {plan.label}
                                          </span>
                                        </div>
                                        <span
                                          className={`text-[10px] font-mono ${tag}`}
                                        >
                                          {plan.hours[0]}–{plan.hours[1]}h
                                        </span>
                                      </div>
                                      <div className="space-y-1 text-xs">
                                        {[
                                          {
                                            l: "Deficit",
                                            v: ph.deficit.toFixed(0),
                                          },
                                          {
                                            l: "Maintenance",
                                            v: ph.maintenance.toFixed(0),
                                          },
                                          ...(ph.losses > 0
                                            ? [
                                                {
                                                  l: "Losses",
                                                  v: ph.losses.toFixed(0),
                                                },
                                              ]
                                            : []),
                                        ].map(({ l, v }) => (
                                          <div
                                            key={l}
                                            className="flex justify-between"
                                          >
                                            <span className="text-muted-foreground">
                                              {l}
                                            </span>
                                            <span className="font-bold tabular-nums">
                                              {v} mL
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      <div
                                        className={`p-2 rounded-lg ${rateCol} text-center`}
                                      >
                                        <p className="text-[10px] font-bold text-primary-foreground/70">
                                          Rate
                                        </p>
                                        <p className="text-base font-extrabold text-primary-foreground tabular-nums">
                                          {ph.ratePerHour.toFixed(1)} mL/hr
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Dilution Calculator ── */}
                      <button
                        onClick={() => setShowDilution((p) => !p)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40 hover:border-blue-400/30 transition-all text-sm"
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <Beaker className="w-4 h-4 text-blue-400" />
                          Dilution Calculator (C₁V₁ = C₂V₂)
                        </div>
                        <motion.div
                          animate={{ rotate: showDilution ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showDilution && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
                              <p className="text-[10px] text-muted-foreground">
                                Solve for V₁ — volume of stock solution needed
                              </p>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  {
                                    label: "C₁ — Stock conc.",
                                    val: dilC1,
                                    set: setDilC1,
                                    ph: "e.g. 1000",
                                  },
                                  {
                                    label: "C₂ — Target conc.",
                                    val: dilC2,
                                    set: setDilC2,
                                    ph: "e.g. 10",
                                  },
                                  {
                                    label: "V₂ — Bag volume (mL)",
                                    val: dilV2,
                                    set: setDilV2,
                                    ph: "e.g. 500",
                                  },
                                ].map(({ label, val, set, ph }) => (
                                  <div key={label} className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">
                                      {label}
                                    </label>
                                    <input
                                      type="number"
                                      value={val}
                                      onChange={(e) => set(e.target.value)}
                                      placeholder={ph}
                                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-blue-400/50 transition-colors font-bold text-center"
                                    />
                                  </div>
                                ))}
                              </div>
                              {dilV1 > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-3 rounded-xl gradient-emerald-cyan text-center"
                                >
                                  <p className="text-[10px] font-bold text-primary-foreground/70">
                                    V₁ — Draw up
                                  </p>
                                  <p className="text-2xl font-extrabold text-primary-foreground tabular-nums">
                                    {dilV1.toFixed(2)} mL
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Clinical Precautions ── */}
                <button
                  onClick={() => setShowPrecautions((p) => !p)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all text-sm"
                >
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Clinical Precautions
                  </div>
                  <motion.div
                    animate={{ rotate: showPrecautions ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-red-400/60" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showPrecautions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {CLINICAL_PRECAUTIONS.map((p) => {
                          const isDanger = p.severity === "danger";
                          const isWarn = p.severity === "warning";
                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border flex gap-3 ${
                                isDanger
                                  ? "bg-red-500/8 border-red-500/25"
                                  : isWarn
                                    ? "bg-amber-500/8 border-amber-500/25"
                                    : "bg-blue-500/5 border-blue-500/20"
                              }`}
                            >
                              {isDanger ? (
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              ) : isWarn ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-0.5">
                                <p
                                  className={`text-xs font-bold ${isDanger ? "text-red-400" : isWarn ? "text-amber-400" : "text-blue-400"}`}
                                >
                                  {p.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.detail}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Close button ── */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
