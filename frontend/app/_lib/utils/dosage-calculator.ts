/**
 * Drug Dosage Calculator Engine
 * Pure TypeScript — no React dependency. Testable independently.
 *
 * Core formula:
 *   Dose (mL or tablets) = Weight (kg) × Dosage (mg/kg) / Concentration (mg/mL or mg/tablet)
 */

export type DoseUnit = "mL" | "tablets";

export interface DoseCalcInput {
  weightKg: number;
  dosageMgPerKg: number;
  concentrationMgPerUnit: number;
  unit: DoseUnit;
}

export interface DoseCalcResult {
  /** The calculated dose in the specified unit (mL or tablets) */
  dose: number;
  /** Total mg administered = weight × dosage */
  totalMg: number;
  /** Human-friendly label, e.g. "2.5 mL" */
  label: string;
  /** Whether inputs are valid */
  valid: boolean;
  /** Warning message, if any */
  warning: string | null;
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate drug dose.
 *
 * Dose = Weight (kg) × Dosage (mg/kg) / Concentration (mg/unit)
 *
 * @param weightKg            Animal weight in kg
 * @param dosageMgPerKg       Prescribed dosage in mg/kg
 * @param concentrationMgPerUnit  Concentration in mg/mL or mg/tablet
 * @returns Dose in the appropriate unit
 */
export function calcDrugDose(
  weightKg: number,
  dosageMgPerKg: number,
  concentrationMgPerUnit: number,
): number {
  if (weightKg <= 0 || dosageMgPerKg <= 0 || concentrationMgPerUnit <= 0) return 0;
  return (weightKg * dosageMgPerKg) / concentrationMgPerUnit;
}

/**
 * Full calculation with validation and formatting.
 */
export function calculateDose(input: DoseCalcInput): DoseCalcResult {
  const { weightKg, dosageMgPerKg, concentrationMgPerUnit, unit } = input;

  // Validate inputs
  if (weightKg <= 0 || dosageMgPerKg <= 0 || concentrationMgPerUnit <= 0) {
    return {
      dose: 0,
      totalMg: 0,
      label: "—",
      valid: false,
      warning: null,
    };
  }

  const totalMg = weightKg * dosageMgPerKg;
  const dose = totalMg / concentrationMgPerUnit;

  // Generate warnings for extreme values
  let warning: string | null = null;
  if (dose > 100 && unit === "mL") {
    warning = "Unusually high volume — please verify the dosage and concentration.";
  } else if (dose > 20 && unit === "tablets") {
    warning = "Unusually high tablet count — please verify the dosage and concentration.";
  } else if (dose < 0.01) {
    warning = "Extremely small dose — consider if a different formulation is available.";
  }

  // Format label
  const rounded = Math.round(dose * 100) / 100;
  const label = `${rounded} ${unit}`;

  return { dose: rounded, totalMg: Math.round(totalMg * 100) / 100, label, valid: true, warning };
}

// ─── Inverse Calculations ─────────────────────────────────────────────────────

/** Find required concentration given a target dose */
export function calcConcentration(
  weightKg: number,
  dosageMgPerKg: number,
  targetDose: number,
): number {
  if (weightKg <= 0 || dosageMgPerKg <= 0 || targetDose <= 0) return 0;
  return (weightKg * dosageMgPerKg) / targetDose;
}

/** Find total mg for a given weight and dosage */
export function calcTotalMg(weightKg: number, dosageMgPerKg: number): number {
  if (weightKg <= 0 || dosageMgPerKg <= 0) return 0;
  return weightKg * dosageMgPerKg;
}
