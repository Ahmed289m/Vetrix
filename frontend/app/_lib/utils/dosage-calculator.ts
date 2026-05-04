/**
 * Veterinary Drug Dosage Calculator Engine — v2
 * Pure TypeScript — no React dependency. Deterministic & testable.
 *
 * Core formula (unchanged):
 *   totalMg = Weight (kg) × Dosage (mg/kg)
 *   dose    = totalMg ÷ Concentration (mg per unit)
 *
 * Units:
 *   - Liquid:  concentration is mg/mL  → result is mL
 *   - Tablet:  concentration is mg/tab → result is tablets
 */

// ─── Type System ──────────────────────────────────────────────────────────────

/** Physical form of the concentration source. */
export type ConcentrationForm = "mL" | "tablet";

/** Output dose unit — deterministically derived from ConcentrationForm. */
export type DoseUnit = "mL" | "tablets";

/** Map concentration form → dose output unit. */
export function doseUnitForForm(form: ConcentrationForm): DoseUnit {
  return form === "mL" ? "mL" : "tablets";
}

/** Map dose unit → expected concentration form. */
export function formForDoseUnit(unit: DoseUnit): ConcentrationForm {
  return unit === "mL" ? "mL" : "tablet";
}

/** A single concentration entry from the drug database. */
export interface ConcentrationEntry {
  value?: number | null | undefined;
  unit?: string | null;
  form?: string | null;
}

// ─── Safety / Warning Types ───────────────────────────────────────────────────

export type WarningLevel = "info" | "warning" | "danger";

export interface DoseWarning {
  /** Machine-readable code for testing / conditional rendering */
  code: string;
  /** Severity level */
  level: WarningLevel;
  /** Human-readable description */
  message: string;
}

/** Deterministic overall safety status — highest severity wins. */
export type SafetyStatus = "ok" | "warning" | "danger";

/** Optional safety limits for species/drug-specific validation. */
export interface SafetyLimits {
  /** Max total mg before "danger" — e.g. from toxicity data */
  maxTotalMg?: number;
  /** Dosage range (mg/kg) — values outside trigger warnings */
  minDosageMgPerKg?: number;
  maxDosageMgPerKg?: number;
  /** Absolute volume / count limits */
  maxVolumeMl?: number;
  maxTablets?: number;
}

// ─── Default Safety Thresholds ────────────────────────────────────────────────

const DEFAULT_MAX_VOLUME_ML = 100;
const DEFAULT_MAX_TABLETS = 20;
const VERY_SMALL_DOSE = 0.01;
const SUSPICIOUSLY_HEAVY_KG = 1000;

// ─── Concentration Resolution ─────────────────────────────────────────────────

export interface ResolvedConcentration {
  /** Numeric mg per unit (0 if unresolvable) */
  value: number;
  /** Human label, e.g. "50 mg/mL" */
  label: string;
  /** Where the value came from */
  source: "db" | "manual" | "none";
}

/**
 * Safely resolve which concentration to use.
 *
 * Priority:
 *   1. `entries[selectedIndex]` if valid and form matches
 *   2. First entry in `entries` whose form matches
 *   3. First entry in `entries` regardless of form
 *   4. `manualValue` if > 0
 *   5. { value: 0, source: "none" }
 */
export function resolveConcentration(
  entries: ConcentrationEntry[] | null | undefined,
  selectedIndex: number | null | undefined,
  manualValue: number | null | undefined,
  expectedForm: ConcentrationForm,
): ResolvedConcentration {
  const list = Array.isArray(entries) ? entries : [];

  // Helper: parse & validate a single entry
  const parse = (
    entry: ConcentrationEntry | undefined,
  ): { val: number; label: string } | null => {
    if (!entry || entry.value == null) return null;
    const n =
      typeof entry.value === "number"
        ? entry.value
        : parseFloat(String(entry.value));
    if (!Number.isFinite(n) || n <= 0) return null;
    const formLabel = entry.form || expectedForm;
    return { val: n, label: `${n} mg/${formLabel}` };
  };

  const normalizeForm = (f: string | null | undefined): ConcentrationForm => {
    const s = (f || "").toLowerCase().trim();
    if (s === "ml" || s === "liquid" || s === "solution" || s === "injectable")
      return "mL";
    if (
      s === "tablet" ||
      s === "tab" ||
      s === "tablets" ||
      s === "pill" ||
      s === "capsule"
    )
      return "tablet";
    // Default: match the expectedForm to avoid false mismatches on empty/null
    return expectedForm;
  };

  // 1. Selected index — form must match
  if (selectedIndex != null && selectedIndex >= 0 && selectedIndex < list.length) {
    const entry = list[selectedIndex];
    if (normalizeForm(entry?.form) === expectedForm) {
      const p = parse(entry);
      if (p) return { value: p.val, label: p.label, source: "db" };
    }
  }

  // 2. First form-matching entry
  for (const entry of list) {
    if (normalizeForm(entry?.form) === expectedForm) {
      const p = parse(entry);
      if (p) return { value: p.val, label: p.label, source: "db" };
    }
  }

  // 3. Any valid entry (form mismatch is acceptable as fallback)
  for (const entry of list) {
    const p = parse(entry);
    if (p) return { value: p.val, label: p.label, source: "db" };
  }

  // 4. Manual value
  if (manualValue != null && Number.isFinite(manualValue) && manualValue > 0) {
    return {
      value: manualValue,
      label: `${manualValue} mg/${expectedForm}`,
      source: "manual",
    };
  }

  // 5. Unresolvable
  return { value: 0, label: "", source: "none" };
}

// ─── Adaptive Precision ───────────────────────────────────────────────────────

/**
 * Round to an appropriate number of decimal places based on magnitude.
 *
 * | Value range | Decimals | Example    |
 * |-------------|----------|------------|
 * | ≥ 100       | 0        | 142        |
 * | ≥ 10        | 1        | 14.2       |
 * | ≥ 1         | 2        | 1.42       |
 * | ≥ 0.1       | 3        | 0.142      |
 * | < 0.1       | 4        | 0.0142     |
 */
export function smartRound(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const abs = Math.abs(value);
  let decimals: number;
  if (abs >= 100) decimals = 0;
  else if (abs >= 10) decimals = 1;
  else if (abs >= 1) decimals = 2;
  else if (abs >= 0.1) decimals = 3;
  else decimals = 4;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ─── Input / Output Types ─────────────────────────────────────────────────────

export interface DoseCalcInput {
  weightKg: number;
  dosageMgPerKg: number;
  concentrationMgPerUnit: number;
  unit: DoseUnit;
  /** Optional safety limits for drug/species-specific validation */
  limits?: SafetyLimits;
}

export interface DoseCalcResult {
  /** Whether the calculation produced a usable result */
  valid: boolean;
  /** If invalid, the reason — machine-inspectable */
  invalidReason?: string;

  /** Calculated dose in the output unit (mL or tablets) */
  dose: number;
  /** Total mg administered = weight × dosage */
  totalMg: number;
  /** Output unit */
  doseUnit: DoseUnit;
  /** Human-friendly label, e.g. "2.5 mL" */
  label: string;

  /** Structured warnings (0…N) */
  warnings: DoseWarning[];
  /** Deterministic overall status — highest severity wins */
  status: SafetyStatus;
}

// ─── Warning Generators ───────────────────────────────────────────────────────

function buildWarnings(
  dose: number,
  totalMg: number,
  dosageMgPerKg: number,
  weightKg: number,
  unit: DoseUnit,
  limits?: SafetyLimits,
): DoseWarning[] {
  const w: DoseWarning[] = [];
  const maxMl = limits?.maxVolumeMl ?? DEFAULT_MAX_VOLUME_ML;
  const maxTab = limits?.maxTablets ?? DEFAULT_MAX_TABLETS;

  // Volume / count sanity
  if (unit === "mL" && dose > maxMl) {
    w.push({
      code: "HIGH_VOLUME",
      level: "danger",
      message: `Unusually high volume (${smartRound(dose)} mL) — verify dosage and concentration.`,
    });
  } else if (unit === "tablets" && dose > maxTab) {
    w.push({
      code: "HIGH_TABLET_COUNT",
      level: "danger",
      message: `Unusually high tablet count (${smartRound(dose)}) — verify dosage and concentration.`,
    });
  }

  // Extremely small dose
  if (dose > 0 && dose < VERY_SMALL_DOSE) {
    w.push({
      code: "VERY_SMALL_DOSE",
      level: "warning",
      message:
        "Extremely small dose — consider if a different formulation is available.",
    });
  }

  // Weight sanity
  if (weightKg > SUSPICIOUSLY_HEAVY_KG) {
    w.push({
      code: "SUSPICIOUS_WEIGHT",
      level: "warning",
      message: `Weight ${weightKg} kg seems unusually high — verify the unit isn't grams.`,
    });
  }

  // Dosage range (drug/species-specific)
  if (limits?.maxDosageMgPerKg != null && dosageMgPerKg > limits.maxDosageMgPerKg) {
    w.push({
      code: "EXCEEDS_MAX_DOSAGE",
      level: "danger",
      message: `Dosage ${dosageMgPerKg} mg/kg exceeds maximum (${limits.maxDosageMgPerKg} mg/kg).`,
    });
  }
  if (limits?.minDosageMgPerKg != null && dosageMgPerKg < limits.minDosageMgPerKg) {
    w.push({
      code: "BELOW_MIN_DOSAGE",
      level: "warning",
      message: `Dosage ${dosageMgPerKg} mg/kg is below minimum (${limits.minDosageMgPerKg} mg/kg).`,
    });
  }

  // Total mg cap (toxicity threshold)
  if (limits?.maxTotalMg != null && totalMg > limits.maxTotalMg) {
    w.push({
      code: "EXCEEDS_MAX_TOTAL_MG",
      level: "danger",
      message: `Total dose ${smartRound(totalMg)} mg exceeds safety limit (${limits.maxTotalMg} mg).`,
    });
  }

  return w;
}

function deriveStatus(warnings: DoseWarning[]): SafetyStatus {
  if (warnings.some((w) => w.level === "danger")) return "danger";
  if (warnings.some((w) => w.level === "warning")) return "warning";
  return "ok";
}

// ─── Helpers: Safe Numeric Parsing ────────────────────────────────────────────

function isSafePositive(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Low-level dose calculation — no validation, no warnings.
 * Returns 0 for any invalid input.
 *
 * Formula: Dose = Weight (kg) × Dosage (mg/kg) ÷ Concentration (mg/unit)
 */
export function calcDrugDose(
  weightKg: number,
  dosageMgPerKg: number,
  concentrationMgPerUnit: number,
): number {
  if (
    !isSafePositive(weightKg) ||
    !isSafePositive(dosageMgPerKg) ||
    !isSafePositive(concentrationMgPerUnit)
  )
    return 0;
  return (weightKg * dosageMgPerKg) / concentrationMgPerUnit;
}

/**
 * Full calculation with validation, adaptive precision, and structured output.
 */
export function calculateDose(input: DoseCalcInput): DoseCalcResult {
  const { weightKg, dosageMgPerKg, concentrationMgPerUnit, unit, limits } =
    input;

  const invalid = (reason: string): DoseCalcResult => ({
    valid: false,
    invalidReason: reason,
    dose: 0,
    totalMg: 0,
    doseUnit: unit,
    label: "—",
    warnings: [],
    status: "ok",
  });

  // ── Input guards ──────────────────────────────────────────────
  if (!Number.isFinite(weightKg) || !Number.isFinite(dosageMgPerKg)) {
    return invalid("INVALID_NUMBER");
  }
  if (weightKg <= 0) return invalid("ZERO_WEIGHT");
  if (dosageMgPerKg <= 0) return invalid("ZERO_DOSAGE");

  if (
    !Number.isFinite(concentrationMgPerUnit) ||
    concentrationMgPerUnit <= 0
  ) {
    return invalid("ZERO_CONCENTRATION");
  }

  // ── Core formula ──────────────────────────────────────────────
  const totalMg = weightKg * dosageMgPerKg;
  const rawDose = totalMg / concentrationMgPerUnit;

  // Post-calculation NaN/Infinity guard (shouldn't happen but defense-in-depth)
  if (!Number.isFinite(rawDose) || !Number.isFinite(totalMg)) {
    return invalid("ARITHMETIC_ERROR");
  }

  // ── Precision ─────────────────────────────────────────────────
  const dose = smartRound(rawDose);
  const roundedMg = smartRound(totalMg);
  const label = `${dose} ${unit}`;

  // ── Safety validation ─────────────────────────────────────────
  const warnings = buildWarnings(
    dose,
    roundedMg,
    dosageMgPerKg,
    weightKg,
    unit,
    limits,
  );
  const status = deriveStatus(warnings);

  return {
    valid: true,
    dose,
    totalMg: roundedMg,
    doseUnit: unit,
    label,
    warnings,
    status,
  };
}

// ─── Inverse / Utility Calculations ───────────────────────────────────────────

/** Find required concentration given a target dose */
export function calcConcentration(
  weightKg: number,
  dosageMgPerKg: number,
  targetDose: number,
): number {
  if (
    !isSafePositive(weightKg) ||
    !isSafePositive(dosageMgPerKg) ||
    !isSafePositive(targetDose)
  )
    return 0;
  return (weightKg * dosageMgPerKg) / targetDose;
}

/** Find total mg for a given weight and dosage */
export function calcTotalMg(weightKg: number, dosageMgPerKg: number): number {
  if (!isSafePositive(weightKg) || !isSafePositive(dosageMgPerKg)) return 0;
  return weightKg * dosageMgPerKg;
}
