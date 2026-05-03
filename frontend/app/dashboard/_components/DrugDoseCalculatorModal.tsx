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
  Search,
  ChevronDown,
} from "lucide-react";
import {
  calculateDose,
  type DoseUnit,
} from "@/app/_lib/utils/dosage-calculator";
import type { FluidSpecies } from "@/app/_lib/utils/fluid-therapy";
import type { Drug } from "@/app/_lib/types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Numeric mg/kg for a structured dose-species entry (or null if unset) */
function getDoseMgPerKg(drug: Drug | undefined, species: FluidSpecies): number | null {
  if (!drug?.dose) return null;
  const entry = drug.dose[species];
  if (!entry || entry.value == null) return null;
  const n = typeof entry.value === "number" ? entry.value : parseFloat(String(entry.value));
  return Number.isFinite(n) ? n : null;
}

/** Human label for a dose entry — e.g. "1 mg/kg q24h" */
function formatDoseLabel(drug: Drug | undefined, species: FluidSpecies): string {
  if (!drug?.dose) return "";
  const entry = drug.dose[species];
  if (!entry) return "";
  const parts: string[] = [];
  if (entry.value != null) parts.push(String(entry.value));
  if (entry.unit) parts.push(entry.unit);
  if (entry.frequency) parts.push(entry.frequency);
  return parts.join(" ").trim();
}

/** Pick a default concentration from drug.concentration[] (mg per mL/tablet) */
function getDefaultConcentration(drug: Drug | undefined): number | null {
  if (!drug?.concentration?.length) return null;
  const first = drug.concentration[0];
  if (first?.value == null) return null;
  const n = typeof first.value === "number" ? first.value : parseFloat(String(first.value));
  return Number.isFinite(n) ? n : null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DrugDoseCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  /** Auto-fill from simulation pet */
  initialWeight?: number;
  initialSpecies?: FluidSpecies;
  petName?: string;
  /** Full list of available drugs for the drug selector */
  drugs?: Drug[];
  /** Pre-selected drug IDs (from prescriptions) for auto batch calculation */
  preselectedDrugIds?: string[];
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
  drugs = [],
  preselectedDrugIds,
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

  // ── Drug selector state ─────────────────────────────────────────────────
  const [selectedDrugId, setSelectedDrugId] = React.useState<string>("");
  const [drugSearchQuery, setDrugSearchQuery] = React.useState("");
  const [showDrugDropdown, setShowDrugDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedDrug = drugs.find((d) => d.drug_id === selectedDrugId);

  // ── Filter drugs ──────────────────────────────────────────────────────────
  const filteredDrugs = React.useMemo(() => {
    if (!drugs.length) return [];
    const q = drugSearchQuery.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.class || "").toLowerCase().includes(q),
    );
  }, [drugs, drugSearchQuery]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  React.useEffect(() => {
    if (!showDrugDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDrugDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDrugDropdown]);

  // ── Sync props when opened ──────────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      if (initialSpecies) setSpecies(initialSpecies);
      if (initialWeight != null) setWeight(String(initialWeight));
      // If preselectedDrugIds provided, pick the first one
      if (preselectedDrugIds?.length && drugs.length) {
        const firstId = preselectedDrugIds[0];
        setSelectedDrugId(firstId);
        const drug = drugs.find((d) => d.drug_id === firstId);
        if (drug) {
          const parsed = getDoseMgPerKg(drug, initialSpecies ?? "dog");
          if (parsed != null) setDosage(String(parsed));
          const conc = getDefaultConcentration(drug);
          if (conc != null) setConcentration(String(conc));
        }
      } else {
        setSelectedDrugId("");
      }
    }
  }, [open, initialWeight, initialSpecies, preselectedDrugIds, drugs]);

  // ── Auto-fill dosage when drug or species changes ─────────────────────────
  React.useEffect(() => {
    if (selectedDrug) {
      const parsed = getDoseMgPerKg(selectedDrug, species);
      if (parsed != null) {
        setDosage(String(parsed));
      }
      const conc = getDefaultConcentration(selectedDrug);
      if (conc != null) {
        setConcentration(String(conc));
      }
    }
  }, [selectedDrugId, species, selectedDrug]);

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

  // ── Batch results for preselected drugs ────────────────────────────────────
  // Each drug uses its OWN stored concentration (drug.concentration[0].value).
  // Falls back to the manually-entered concentration if the drug has none stored.
  const batchResults = React.useMemo(() => {
    if (!preselectedDrugIds?.length || !drugs.length || w <= 0) return [];
    return preselectedDrugIds
      .map((drugId) => {
        const drug = drugs.find((dd) => dd.drug_id === drugId);
        if (!drug) return null;
        const parsed = getDoseMgPerKg(drug, species);
        if (parsed == null) return null;
        // Prefer the drug's own stored concentration, fall back to global entry
        const drugConc = getDefaultConcentration(drug);
        const effectiveConc = drugConc != null ? drugConc : c > 0 ? c : null;
        const res =
          effectiveConc != null
            ? calculateDose({
                weightKg: w,
                dosageMgPerKg: parsed,
                concentrationMgPerUnit: effectiveConc,
                unit: doseUnit,
              })
            : null;
        return {
          drug,
          dosageMgPerKg: parsed,
          result: res,
          rawDosage: formatDoseLabel(drug, species),
          effectiveConc,
          concSource: drugConc != null ? "db" : c > 0 ? "manual" : "none",
        };
      })
      .filter(Boolean) as Array<{
      drug: Drug;
      dosageMgPerKg: number;
      result: ReturnType<typeof calculateDose> | null;
      rawDosage: string;
      effectiveConc: number | null;
      concSource: "db" | "manual" | "none";
    }>;
  }, [preselectedDrugIds, drugs, w, c, species, doseUnit]);

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

                {/* ── Drug Selector ── */}
                {drugs.length > 0 && (
                  <div className="space-y-2" ref={dropdownRef}>
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald" />
                      <p className="text-xs font-bold text-muted-foreground">
                        Select Drug — اختر الدواء
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDrugDropdown((v) => !v)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                          selectedDrug
                            ? "bg-emerald/5 border-emerald/30 text-emerald"
                            : "bg-muted/30 border-border/50 text-muted-foreground"
                        }`}
                      >
                        <span className="truncate">
                          {selectedDrug
                            ? `${selectedDrug.name} — ${selectedDrug.class || ""}`
                            : "Choose a drug to auto-fill dosage…"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${showDrugDropdown ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {showDrugDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 top-full mt-1 w-full rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden"
                          >
                            {/* Search */}
                            <div className="relative border-b border-border/40">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                              <input
                                type="text"
                                value={drugSearchQuery}
                                onChange={(e) =>
                                  setDrugSearchQuery(e.target.value)
                                }
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Search drugs…"
                                autoComplete="off"
                                spellCheck={false}
                                autoFocus
                                className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs outline-none placeholder-muted-foreground"
                              />
                            </div>
                            {/* List */}
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {filteredDrugs.length === 0 ? (
                                <div className="py-4 text-center text-xs text-muted-foreground">
                                  No drugs found
                                </div>
                              ) : (
                                filteredDrugs.map((drug) => {
                                  const parsed = getDoseMgPerKg(drug, species);
                                  const isActive =
                                    drug.drug_id === selectedDrugId;
                                  return (
                                    <button
                                      key={drug.drug_id}
                                      onClick={() => {
                                        setSelectedDrugId(drug.drug_id);
                                        setShowDrugDropdown(false);
                                        setDrugSearchQuery("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors ${
                                        isActive
                                          ? "bg-emerald/10 text-emerald"
                                          : "hover:bg-muted/30"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="font-bold truncate">
                                          {drug.name}
                                        </p>
                                        <p className="text-muted-foreground/60 truncate">
                                          {drug.class}
                                        </p>
                                      </div>
                                      {parsed && (
                                        <span className="shrink-0 px-2 py-0.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-bold tabular-nums">
                                          {parsed} mg/kg
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Auto-filled hint */}
                    {selectedDrug && (
                      <p className="text-[10px] text-emerald/70 flex items-center gap-1 px-1">
                        <FlaskConical className="w-3 h-3" />
                        Dosage auto-filled from{" "}
                        <span className="font-bold">{selectedDrug.name}</span>{" "}
                        ({species} dose:{" "}
                        {formatDoseLabel(selectedDrug, species) || "N/A"})
                      </p>
                    )}
                  </div>
                )}

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
                    sublabel={
                      selectedDrug
                        ? `Auto-filled from ${selectedDrug.name}`
                        : "Prescribed dose per kg"
                    }
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

                {/* ── Batch results for prescription drugs ── */}
                {batchResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      All Prescription Doses
                    </p>
                    {batchResults.map(({ drug, dosageMgPerKg, result: res, rawDosage, effectiveConc, concSource }) => (
                      <div
                        key={drug.drug_id}
                        className="p-3 rounded-xl bg-emerald/5 border border-emerald/15 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-emerald">
                            {drug.name}
                          </p>
                          {res?.valid ? (
                            <span className="text-lg font-black text-emerald tabular-nums">
                              {res.dose}{" "}
                              <span className="text-xs text-emerald/60">
                                {doseUnit}
                              </span>
                            </span>
                          ) : concSource === "none" ? (
                            <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              Enter concentration ↑
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                          <span>
                            Dosage: <span className="font-bold text-cyan">{dosageMgPerKg} mg/kg</span>
                            {rawDosage && (
                              <span className="opacity-60"> ({rawDosage})</span>
                            )}
                          </span>
                          {effectiveConc != null && (
                            <span>
                              Conc:{" "}
                              <span className="font-bold">
                                {effectiveConc} mg/{doseUnit === "mL" ? "mL" : "tab"}
                              </span>
                              {concSource === "db" && (
                                <span className="ml-1 text-emerald/60">(stored)</span>
                              )}
                            </span>
                          )}
                          {res?.valid && (
                            <span>
                              Total: <span className="font-bold">{res.totalMg} mg</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prompt when inputs are incomplete */}
                {!hasAllInputs && batchResults.length === 0 && (
                  <div className="p-6 rounded-2xl border border-border/30 bg-muted/5 text-center space-y-2">
                    <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {preselectedDrugIds?.length
                        ? "Enter patient weight to calculate all doses"
                        : "Enter weight, dosage, and concentration"}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {preselectedDrugIds?.length
                        ? "Drug concentrations will be loaded from the database automatically"
                        : "أدخل الوزن والجرعة والتركيز لحساب الجرعة"}
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
