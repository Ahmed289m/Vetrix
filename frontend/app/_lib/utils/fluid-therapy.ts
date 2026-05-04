/**
 * Fluid Therapy Calculation Engine — v2
 * Pure TypeScript — no React dependency. Testable independently.
 *
 * Clinical formulas sourced from veterinary fluid therapy protocols.
 * Key change from v1: ongoing losses are treated as a *rate* (mL/hr),
 * not a one-time volume. The hourly infusion rate is computed directly:
 *
 *   HourlyRate = Maintenance/hr + Deficit/CorrectionHours + OngoingLoss/hr
 *
 * Phase plans use the real deficit-correction window (not an arbitrary 50/50 split).
 */

export type FluidSpecies = "dog" | "cat";
export type DropFactor = 10 | 15 | 20 | 60; // drops/mL

// ─── Maintenance ─────────────────────────────────────────────────────────────

/**
 * Allometric maintenance formula (more accurate than linear scaling).
 * Dog:  132 × W^0.75  mL/day
 * Cat:  100 × W^0.75  mL/day
 */
export function calcMaintenanceAllometric(
  weightKg: number,
  species: FluidSpecies,
): number {
  if (weightKg <= 0) return 0;
  const multiplier = species === "dog" ? 132 : 100;
  return multiplier * Math.pow(weightKg, 0.75);
}

/**
 * Linear daily maintenance (normal clinical reference — kept for comparison).
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

/**
 * Deficit correction window (hours) based on dehydration severity.
 *
 * Dogs:
 *   ≤5%  → 24h    (mild — can correct slowly)
 *   6–8% → 18h    (moderate)
 *   9–10%→ 12h    (severe)
 *   ≥11% → 8h     (critical — aggressive correction needed)
 *
 * Cats: same thresholds but ≥11% uses 12h instead of 8h
 *   (cats are more sensitive to rapid fluid shifts).
 */
export function getDeficitCorrectionHours(
  species: FluidSpecies,
  dehydrationPct: number,
): number {
  if (dehydrationPct <= 0) return 24;
  if (dehydrationPct <= 5) return 24;
  if (dehydrationPct <= 8) return 18;
  if (dehydrationPct <= 10) return 12;
  // ≥11%
  return species === "dog" ? 8 : 12;
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
 * @deprecated Use calcOngoingLossRatePerHour instead for rate-based calculations.
 * Kept for backward compatibility — returns the raw daily loss volume.
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

export interface OngoingLossRate {
  /** Total estimated daily loss volume (mL/day) */
  perDayMl: number;
  /** Hourly loss rate = perDayMl / 24 (mL/hr) */
  perHourMl: number;
}

/**
 * Estimates ongoing losses as a **rate** (mL/hr), treating the episode count
 * as a daily occurrence estimate.
 *
 * dailyLoss = Weight × (vomitRate × vomitEpisodes + diarrheaRate × diarrheaEpisodes)
 * hourlyLoss = dailyLoss / 24
 */
export function calcOngoingLossRatePerHour(
  weightKg: number,
  vomitCount: number,
  diarrheaCount: number,
  vomitSev: LossSeverity = "mild",
  diarrheaSev: LossSeverity = "mild",
): OngoingLossRate {
  if (weightKg <= 0) return { perDayMl: 0, perHourMl: 0 };
  const perDayMl =
    weightKg * VOMIT_RATE[vomitSev] * Math.max(0, vomitCount) +
    weightKg * DIARRHEA_RATE[diarrheaSev] * Math.max(0, diarrheaCount);
  return { perDayMl, perHourMl: perDayMl / 24 };
}

// ─── Hourly Rate (the correct clinical formula) ──────────────────────────────

/**
 * True clinical hourly infusion rate:
 *
 *   HourlyRate = MaintenancePerHour + DeficitRatePerHour + OngoingLossPerHour
 *
 * Where:
 *   MaintenancePerHour  = maintenanceMlPerDay / 24
 *   DeficitRatePerHour  = deficitMl / deficitCorrectionHours
 *   OngoingLossPerHour  = ongoingLoss.perHourMl
 */
export function calcClinicalHourlyRate(
  maintenanceMlPerDay: number,
  deficitMl: number,
  deficitCorrectionHours: number,
  ongoingPerHourMl: number,
): number {
  const maintPerHour = maintenanceMlPerDay / 24;
  const deficitPerHour = deficitCorrectionHours > 0 ? deficitMl / deficitCorrectionHours : 0;
  return maintPerHour + deficitPerHour + ongoingPerHourMl;
}

// ─── Legacy rate helpers (still useful for conversion) ───────────────────────

/**
 * @deprecated Use calcClinicalHourlyRate instead.
 * Hourly infusion rate = totalVolume / timeHours (mL/hr)
 */
export function calcHourlyRate(totalMl: number, hours = 24): number {
  if (hours <= 0) return 0;
  return totalMl / hours;
}

/**
 * @deprecated Use calcTotal24h only for legacy contexts.
 * Total 24h fluid volume = maintenance + deficit + ongoing losses (mL)
 */
export function calcTotal24h(
  maintenanceMl: number,
  deficitMl: number,
  ongoingMl: number,
): number {
  return maintenanceMl + deficitMl + ongoingMl;
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

// ─── Clinically-Correct 2-Phase Correction Plan ──────────────────────────────

/** @deprecated Use calculateFluidPlan phase summaries instead. */
export interface FluidPhase {
  label: string;
  hours: [number, number];
  deficitFraction: number;
  maintenanceFraction: number;
  lossesFraction: number;
}

/** @deprecated Use calculateFluidPlan instead. */
export function getSmartPlan(species: FluidSpecies): [FluidPhase, FluidPhase] {
  const correctionHours = 8; // legacy default
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

/** @deprecated Use calculateFluidPlan instead. */
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

// ─── New Typed Phase Summary ─────────────────────────────────────────────────

export interface PhaseSummary {
  label: string;
  hours: [number, number];
  phaseHours: number;
  /** Maintenance volume contributed in this phase */
  maintenanceMl: number;
  /** Deficit volume contributed in this phase (0 after correction window ends) */
  deficitMl: number;
  /** Ongoing-loss volume contributed in this phase */
  ongoingMl: number;
  /** Total volume for this phase */
  totalMl: number;
  /** Average rate during this phase (mL/hr) */
  ratePerHour: number;
}

/**
 * Build clinically-correct phase summaries.
 *
 * - Deficit replacement runs for exactly `correctionHours`, then stops.
 * - Within each phase, deficit volume = deficitRatePerHour × (hours the deficit
 *   correction window overlaps with this phase).
 * - Maintenance and ongoing losses are spread proportionally over 24h.
 */
function buildPhaseSummaries(
  maintenanceMlPerDay: number,
  deficitMl: number,
  correctionHours: number,
  ongoingPerHourMl: number,
  phase1End: number,
): [PhaseSummary, PhaseSummary] {
  const maintPerHour = maintenanceMlPerDay / 24;
  const deficitPerHour = correctionHours > 0 ? deficitMl / correctionHours : 0;

  // Phase 1: 0 → phase1End
  const p1Hours = phase1End;
  // How many of the deficit-correction hours fall within phase 1?
  const p1DeficitHours = Math.min(correctionHours, phase1End);
  const p1Deficit = deficitPerHour * p1DeficitHours;
  const p1Maint = maintPerHour * p1Hours;
  const p1Ongoing = ongoingPerHourMl * p1Hours;
  const p1Total = p1Deficit + p1Maint + p1Ongoing;

  // Phase 2: phase1End → 24
  const p2Hours = 24 - phase1End;
  // Remaining deficit-correction hours that spill into phase 2
  const p2DeficitHours = Math.max(0, correctionHours - phase1End);
  const p2Deficit = deficitPerHour * p2DeficitHours;
  const p2Maint = maintPerHour * p2Hours;
  const p2Ongoing = ongoingPerHourMl * p2Hours;
  const p2Total = p2Deficit + p2Maint + p2Ongoing;

  return [
    {
      label: "Active Correction",
      hours: [0, phase1End],
      phaseHours: p1Hours,
      maintenanceMl: p1Maint,
      deficitMl: p1Deficit,
      ongoingMl: p1Ongoing,
      totalMl: p1Total,
      ratePerHour: p1Hours > 0 ? p1Total / p1Hours : 0,
    },
    {
      label: "Maintenance & Monitoring",
      hours: [phase1End, 24],
      phaseHours: p2Hours,
      maintenanceMl: p2Maint,
      deficitMl: p2Deficit,
      ongoingMl: p2Ongoing,
      totalMl: p2Total,
      ratePerHour: p2Hours > 0 ? p2Total / p2Hours : 0,
    },
  ];
}

// ─── Clinical Safety Types ───────────────────────────────────────────────────

export type SafetyWarningSeverity = "info" | "warning" | "danger";

export interface SafetyWarning {
  severity: SafetyWarningSeverity;
  message: string;
}

export interface FluidSafety {
  /** Normal maintenance rate range for this species/weight */
  maintenanceRange: { min: number; max: number };
  /** Maximum safe bolus rate for this species/weight */
  maxBolusRate: number;
  /** Dynamic warnings based on the computed rate */
  warnings: SafetyWarning[];
}

// ─── Master Calculation Function ─────────────────────────────────────────────

export interface FluidPlanInput {
  weightKg: number;
  species: FluidSpecies;
  dehydrationPct: number;
  vomitCount: number;
  diarrheaCount: number;
  vomitSeverity: LossSeverity;
  diarrheaSeverity: LossSeverity;
  dropFactor: DropFactor;
}

export interface FluidPlanResult {
  maintenance: {
    perDay: number;
    perHour: number;
  };
  deficit: {
    total: number;
    correctionHours: number;
    ratePerHour: number;
  };
  ongoing: {
    perDay: number;
    perHour: number;
  };
  /** True clinical hourly rate = maint/hr + deficit/corrHours + ongoing/hr */
  hourlyRate: number;
  minuteRate: number;
  dropsPerMin: number;
  dropsPerSec: number;
  /** Total volume over 24h (for reference / display) */
  total24h: number;
  /** Safety limits (legacy — prefer safety.maxBolusRate) */
  maxBolusRate: number;
  normalRateRange: { min: number; max: number };
  /** Dehydration assessment */
  severity: DehydrationSeverity;
  /** 2-phase correction plan */
  phase1: PhaseSummary;
  phase2: PhaseSummary;

  // ── Clinical Safety Layer ──────────────────────────────────────────────────

  /** This calculator is for rehydration therapy ONLY — not for shock resuscitation */
  isRehydrationOnly: true;
  /** Static warning: always present */
  rehydrationWarning: string;

  /** Rate validation + dynamic warnings */
  safety: FluidSafety;

  /** Fluid therapy requires periodic reassessment */
  requiresReassessmentAfter24h: true;
  /** Reassessment guidance message */
  reassessmentMessage: string;

  /** Note about ongoing GI loss estimation method */
  ongoingLossNote: string;
}

/**
 * Master calculation: takes all patient inputs, returns the complete
 * fluid therapy plan with clinically-correct rates and safety validation.
 */
export function calculateFluidPlan(input: FluidPlanInput): FluidPlanResult {
  const {
    weightKg, species, dehydrationPct,
    vomitCount, diarrheaCount, vomitSeverity, diarrheaSeverity,
    dropFactor,
  } = input;

  // 1. Maintenance
  const maintPerDay = calcMaintenanceAllometric(weightKg, species);
  const maintPerHour = maintPerDay / 24;

  // 2. Deficit
  const deficitTotal = calcFluidDeficit(weightKg, dehydrationPct);
  const correctionHours = getDeficitCorrectionHours(species, dehydrationPct);
  const deficitPerHour = correctionHours > 0 ? deficitTotal / correctionHours : 0;

  // 3. Ongoing losses as a rate
  const ongoing = calcOngoingLossRatePerHour(
    weightKg, vomitCount, diarrheaCount, vomitSeverity, diarrheaSeverity,
  );

  // 4. True clinical hourly rate (during the active correction window)
  const hourlyRate = maintPerHour + deficitPerHour + ongoing.perHourMl;

  // 5. Derived rates
  const minuteRate = calcMinuteRate(hourlyRate);
  const dropsPerMin = calcDropsPerMinute(minuteRate, dropFactor);
  const dropsPerSec = calcDropsPerSecond(dropsPerMin);

  // 6. Total 24h (for display — note: deficit correction may end before 24h)
  //    total24h = maint + deficit + ongoing/day
  const total24h = maintPerDay + deficitTotal + ongoing.perDayMl;

  // 7. Safety limits
  const maxBolusRate = getMaxBolusRate(weightKg, species);
  const normalRateRange = getNormalRateRange(weightKg, species);
  const severity = getDehydrationSeverity(dehydrationPct);

  // 8. Phase plan — split at correction window boundary
  const phase1End = Math.min(correctionHours, 24);
  const [phase1, phase2] = buildPhaseSummaries(
    maintPerDay, deficitTotal, correctionHours, ongoing.perHourMl, phase1End,
  );

  // 9. Clinical safety validation
  const safetyWarnings: SafetyWarning[] = [];

  if (weightKg > 0 && hourlyRate > 0) {
    // High rate warning: rate exceeds 2× upper maintenance range
    const upperMaintLimit = normalRateRange.max; // Dog: 6 mL/kg/hr, Cat: 3 mL/kg/hr
    if (hourlyRate > upperMaintLimit * 2) {
      safetyWarnings.push({
        severity: "warning",
        message: "High fluid rate — reassess patient for shock or severe ongoing losses",
      });
    }

    // Unsafe rate: exceeds max bolus (shock) limit
    if (hourlyRate > maxBolusRate) {
      safetyWarnings.push({
        severity: "danger",
        message: "Unsafe rate — exceeds shock bolus limit",
      });
    }
  }

  const safety: FluidSafety = {
    maintenanceRange: normalRateRange,
    maxBolusRate,
    warnings: safetyWarnings,
  };

  return {
    maintenance: { perDay: maintPerDay, perHour: maintPerHour },
    deficit: { total: deficitTotal, correctionHours, ratePerHour: deficitPerHour },
    ongoing: { perDay: ongoing.perDayMl, perHour: ongoing.perHourMl },
    hourlyRate,
    minuteRate,
    dropsPerMin,
    dropsPerSec,
    total24h,
    maxBolusRate,
    normalRateRange,
    severity,
    phase1,
    phase2,

    // Clinical safety layer
    isRehydrationOnly: true,
    rehydrationWarning: "Not for shock resuscitation — use IV bolus protocol first",
    safety,
    requiresReassessmentAfter24h: true,
    reassessmentMessage: "Fluid therapy must be reassessed every 12–24 hours",
    ongoingLossNote: "Ongoing GI losses use conservative outpatient estimates",
  };
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
