/**
 * Fluid Therapy Calculation Engine
 * Pure TypeScript — no React dependency. Testable independently.
 *
 * Clinical formulas sourced from veterinary fluid therapy protocols.
 */

export type FluidSpecies = "dog" | "cat";
export type DropFactor = 10 | 15 | 20 | 60; // drops/mL

// ─── Maintenance ─────────────────────────────────────────────────────────────

/**
 * Allometric maintenance formula (more accurate than linear scaling).
 * Dog:  132 × W^0.75  mL/day
 * Cat:   80 × W^0.75  mL/day
 */
export function calcMaintenanceAllometric(
  weightKg: number,
  species: FluidSpecies,
): number {
  if (weightKg <= 0) return 0;
  const multiplier = species === "dog" ? 132 : 80;
  return multiplier * Math.pow(weightKg, 0.75);
}

/**
 * Linear daily maintenance (normal clinical reference).
 * Dog: 60 mL/kg/24h
 * Cat: 40 mL/kg/24h
 */
export function calcMaintenanceLinear(
  weightKg: number,
  species: FluidSpecies,
): number {
  if (weightKg <= 0) return 0;
  return weightKg * (species === "dog" ? 60 : 40);
}

// ─── Fluid Deficit ────────────────────────────────────────────────────────────

/**
 * Fluid Deficit (mL) = Weight (kg) × Dehydration% × 10
 * (equivalent to Weight × decimal × 1000)
 */
export function calcFluidDeficit(
  weightKg: number,
  dehydrationPct: number,
): number {
  if (weightKg <= 0 || dehydrationPct <= 0) return 0;
  return weightKg * dehydrationPct * 10;
}

// ─── Ongoing Losses ───────────────────────────────────────────────────────────

export type LossSeverity = "mild" | "severe";

/**
 * mL/kg multipliers per episode, by severity.
 *
 * Vomiting:
 *   Mild / occasional  → 1 mL/kg per episode
 *   Frequent / severe  → 2 mL/kg per episode
 *
 * Diarrhea:
 *   Mild               → 4 mL/kg per episode
 *   Severe / watery    → 6 mL/kg per episode
 */
export const VOMIT_RATE: Record<LossSeverity, number> = { mild: 1, severe: 2 };
export const DIARRHEA_RATE: Record<LossSeverity, number> = { mild: 4, severe: 6 };

/**
 * Estimated ongoing losses from vomiting & diarrhea.
 *
 * @param weightKg      Body weight in kg
 * @param vomitCount    Number of vomiting episodes
 * @param diarrheaCount Number of diarrhea episodes
 * @param vomitSev      Vomiting severity ("mild" | "severe"), default "mild"
 * @param diarrheaSev   Diarrhea severity ("mild" | "severe"), default "mild"
 */
export function calcOngoingLosses(
  weightKg: number,
  vomitCount: number,
  diarrheaCount: number,
  vomitSev: LossSeverity = "mild",
  diarrheaSev: LossSeverity = "mild",
): number {
  if (weightKg <= 0) return 0;
  const vomitLoss = weightKg * VOMIT_RATE[vomitSev] * Math.max(0, vomitCount);
  const diarrheaLoss = weightKg * DIARRHEA_RATE[diarrheaSev] * Math.max(0, diarrheaCount);
  return vomitLoss + diarrheaLoss;
}

// ─── Totals & Rates ───────────────────────────────────────────────────────────

/** Total 24h fluid volume = maintenance + deficit + ongoing losses (mL) */
export function calcTotal24h(
  maintenanceMl: number,
  deficitMl: number,
  ongoingMl: number,
): number {
  return maintenanceMl + deficitMl + ongoingMl;
}

/** Hourly infusion rate = totalVolume / timeHours (mL/hr) */
export function calcHourlyRate(totalMl: number, hours = 24): number {
  if (hours <= 0) return 0;
  return totalMl / hours;
}

/** Minute rate = hourly rate / 60 (mL/min) */
export function calcMinuteRate(hourlyRate: number): number {
  return hourlyRate / 60;
}

/** Drops per minute = minute rate × drop factor */
export function calcDropsPerMinute(
  minuteRate: number,
  dropFactor: DropFactor,
): number {
  return minuteRate * dropFactor;
}

/** Drops per second = drops per minute / 60 */
export function calcDropsPerSecond(dropsPerMinute: number): number {
  return dropsPerMinute / 60;
}

// ─── Dilution (C₁V₁ = C₂V₂) ─────────────────────────────────────────────────

/**
 * Solves for V₁ (volume of stock solution needed).
 * C₁ × V₁ = C₂ × V₂  →  V₁ = (C₂ × V₂) / C₁
 *
 * @param c1 Initial concentration of stock solution
 * @param c2 Desired final concentration
 * @param v2 Final total bag volume (mL)
 * @returns V₁ — volume of stock solution to draw up (mL)
 */
export function calcDilutionV1(c1: number, c2: number, v2: number): number {
  if (c1 <= 0 || c2 <= 0 || v2 <= 0) return 0;
  return (c2 * v2) / c1;
}

// ─── Safety Limits ────────────────────────────────────────────────────────────

/** Maximum safe bolus rate (1 blood volume/hour) */
export function getMaxBolusRate(
  weightKg: number,
  species: FluidSpecies,
): number {
  return weightKg * (species === "dog" ? 90 : 60); // mL/hr
}

/**
 * Normal maintenance infusion rate range (mL/hr).
 * Dog: 2–6 mL/kg/hr
 * Cat: 2–3 mL/kg/hr
 */
export function getNormalRateRange(
  weightKg: number,
  species: FluidSpecies = "dog",
): { min: number; max: number } {
  const maxRate = species === "cat" ? 3 : 6;
  return { min: weightKg * 2, max: weightKg * maxRate };
}

// ─── Dehydration Severity ─────────────────────────────────────────────────────

export type DehydrationSeverity = "none" | "mild" | "moderate" | "severe" | "critical";

export function getDehydrationSeverity(pct: number): DehydrationSeverity {
  if (pct <= 0) return "none";
  if (pct <= 5) return "mild";
  if (pct <= 8) return "moderate";
  if (pct <= 12) return "severe";
  return "critical";
}

export const DEHYDRATION_COLOR: Record<
  DehydrationSeverity,
  { bar: string; text: string; badge: string }
> = {
  none:     { bar: "bg-muted",    text: "text-muted-foreground", badge: "bg-muted/20 text-muted-foreground" },
  mild:     { bar: "bg-emerald",  text: "text-emerald",          badge: "bg-emerald/15 text-emerald" },
  moderate: { bar: "bg-orange",   text: "text-orange",           badge: "bg-orange/15 text-orange" },
  severe:   { bar: "bg-red-400",  text: "text-red-400",          badge: "bg-red-400/15 text-red-400" },
  critical: { bar: "bg-red-600",  text: "text-red-500",          badge: "bg-red-600/15 text-red-500" },
};

// ─── Smart 2-Phase Correction Plan ───────────────────────────────────────────

export interface FluidPhase {
  label: string;
  hours: [number, number]; // [start, end]
  deficitFraction: number; // fraction of total deficit replaced
  maintenanceFraction: number; // fraction of maintenance for these hours
  lossesFraction: number; // fraction of losses
}

export function getSmartPlan(species: FluidSpecies): [FluidPhase, FluidPhase] {
  const phase1Hours = species === "dog" ? 8 : 6;
  const phase2Hours = 24 - phase1Hours;
  return [
    {
      label: "Rapid Correction",
      hours: [0, phase1Hours],
      deficitFraction: 0.5,
      maintenanceFraction: phase1Hours / 24,
      lossesFraction: phase1Hours / 24,
    },
    {
      label: "Gradual Replacement",
      hours: [phase1Hours, 24],
      deficitFraction: 0.5,
      maintenanceFraction: phase2Hours / 24,
      lossesFraction: phase2Hours / 24,
    },
  ];
}

export interface PhaseVolumes {
  deficit: number;
  maintenance: number;
  losses: number;
  total: number;
  ratePerHour: number;
}

export function calcPhaseVolumes(
  phase: FluidPhase,
  deficitMl: number,
  maintenanceMl: number,
  ongoingMl: number,
): PhaseVolumes {
  const phaseHours = phase.hours[1] - phase.hours[0];
  const deficit = deficitMl * phase.deficitFraction;
  const maintenance = maintenanceMl * phase.maintenanceFraction;
  const losses = ongoingMl * phase.lossesFraction;
  const total = deficit + maintenance + losses;
  return { deficit, maintenance, losses, total, ratePerHour: total / phaseHours };
}

// ─── Clinical Precautions ─────────────────────────────────────────────────────

export interface ClinicalPrecaution {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
}

export const CLINICAL_PRECAUTIONS: ClinicalPrecaution[] = [
  {
    id: "cardiac",
    severity: "danger",
    title: "Heart Failure & Cardiac Disease",
    detail:
      "Rapid IV fluids are strictly contraindicated in congestive heart failure. Increases cardiac workload and may trigger fatal pulmonary edema.",
  },
  {
    id: "cerebral",
    severity: "danger",
    title: "Cerebral Edema & Head Trauma",
    detail:
      "Avoid adjusting sodium by more than 0.5 mEq/L/hr to prevent permanent neurological damage from brain swelling or shrinkage.",
  },
  {
    id: "renal",
    severity: "danger",
    title: "Anuric Renal Failure",
    detail:
      "If kidneys have stopped producing urine (anuria), aggressive fluid therapy can cause rapid fluid overload and death.",
  },
  {
    id: "dextrose",
    severity: "warning",
    title: "Resuscitation vs. Dehydration Fluids",
    detail:
      "5% Dextrose must never be used for shock resuscitation — it does not stay in blood vessels and can cause dangerous cellular swelling.",
  },
  {
    id: "maxrate_dog",
    severity: "info",
    title: "Maximum Rate (Dogs)",
    detail:
      "Maximum safe IV rate: 90 mL/kg/hr (1 blood volume/hr). Normal maintenance: 10–20 mL/kg/hr. Monitor PCV > 20% and TPP > 4 g/dL.",
  },
  {
    id: "maxrate_cat",
    severity: "info",
    title: "Maximum Rate (Cats)",
    detail:
      "Maximum safe IV rate: 60 mL/kg/hr (1 blood volume/hr). Cats are particularly sensitive to fluid overload — monitor for respiratory changes.",
  },
];
