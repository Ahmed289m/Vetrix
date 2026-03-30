import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  AlertTriangle,
  Syringe,
  ArrowRight,
  User,
  Beaker,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const criDrugs = [
  {
    name: "Ketamine",
    concentration: 100,
    unit: "mg/mL",
    defaultDose: 10,
    doseUnit: "mcg/kg/min",
    loadingDose: 2,
    loadingUnit: "mg/kg",
    maxDose: 40,
    notes: "Dissociative anesthetic. Provides somatic analgesia.",
    safetyWarnings: [
      "Avoid in cats with HCM",
      "May increase intracranial pressure",
    ],
  },
  {
    name: "Lidocaine",
    concentration: 20,
    unit: "mg/mL",
    defaultDose: 50,
    doseUnit: "mcg/kg/min",
    loadingDose: 2,
    loadingUnit: "mg/kg",
    maxDose: 80,
    notes: "Local anesthetic, anti-arrhythmic. Provides visceral analgesia.",
    safetyWarnings: [
      "Toxic in cats — DO NOT USE in felines",
      "Monitor for tremors, seizures at high doses",
    ],
  },
  {
    name: "Fentanyl",
    concentration: 0.05,
    unit: "mg/mL",
    defaultDose: 5,
    doseUnit: "mcg/kg/hr",
    loadingDose: 0.002,
    loadingUnit: "mg/kg",
    maxDose: 20,
    notes: "Potent opioid. Excellent analgesic for severe pain.",
    safetyWarnings: [
      "Respiratory depression at high doses",
      "Bradycardia — have atropine ready",
    ],
  },
  {
    name: "Morphine",
    concentration: 10,
    unit: "mg/mL",
    defaultDose: 0.1,
    doseUnit: "mg/kg/hr",
    loadingDose: 0.2,
    loadingUnit: "mg/kg",
    maxDose: 0.5,
    notes: "Opioid analgesic. Good for moderate-severe pain.",
    safetyWarnings: [
      "Histamine release in dogs — give slowly",
      "Contraindicated in head trauma",
    ],
  },
  {
    name: "Dopamine",
    concentration: 40,
    unit: "mg/mL",
    defaultDose: 5,
    doseUnit: "mcg/kg/min",
    loadingDose: 0,
    loadingUnit: "",
    maxDose: 20,
    notes: "Vasopressor. Dose-dependent effects on cardiac output.",
    safetyWarnings: [
      "Extravasation causes tissue necrosis",
      "Tachyarrhythmias at high doses",
    ],
  },
  {
    name: "Norepinephrine",
    concentration: 1,
    unit: "mg/mL",
    defaultDose: 0.1,
    doseUnit: "mcg/kg/min",
    loadingDose: 0,
    loadingUnit: "",
    maxDose: 2,
    notes: "Potent vasopressor for refractory hypotension.",
    safetyWarnings: [
      "Must use central line ideally",
      "Monitor blood pressure continuously",
    ],
  },
];

export default function CRICalc() {
  const [selectedDrug, setSelectedDrug] = useState(criDrugs[0].name);
  const [weight, setWeight] = useState("");
  const [doseRate, setDoseRate] = useState("");
  const [fluidBagVol, setFluidBagVol] = useState("500");
  const [infusionRate, setInfusionRate] = useState("10");

  const drug = criDrugs.find((d) => d.name === selectedDrug)!;
  const w = parseFloat(weight) || 0;
  const dose = parseFloat(doseRate) || drug.defaultDose;
  const bagVol = parseFloat(fluidBagVol) || 500;
  const fluidRateMlHr = parseFloat(infusionRate) || 10;

  // Calculate based on drug dose unit
  let mgPerHr = 0;
  if (drug.doseUnit.includes("mcg/kg/min")) {
    mgPerHr = (dose * w * 60) / 1000;
  } else if (drug.doseUnit.includes("mcg/kg/hr")) {
    mgPerHr = (dose * w) / 1000;
  } else {
    mgPerHr = dose * w;
  }

  const loadingDoseMg = drug.loadingDose * w;
  const drugToAddMg = (mgPerHr / fluidRateMlHr) * bagVol;
  const drugToAddMl = drugToAddMg / drug.concentration;
  const concentrationInBag = drugToAddMg / bagVol;

  // Safety checks
  const isOverMaxDose = dose > drug.maxDose;
  const isHighVolume = drugToAddMl > bagVol * 0.1;

  return (
    <motion.div
      variants={fadeUp}
      className="glass-card p-6 space-y-5 border-glow"
    >
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange" /> Constant Rate Infusion (CRI)
      </h3>

      {/* Drug selection grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {criDrugs.map((d) => (
          <motion.button
            key={d.name}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedDrug(d.name);
              setDoseRate("");
            }}
            className={`p-3 rounded-xl text-xs font-bold transition-all text-left ${
              selectedDrug === d.name
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "bg-muted/20 border border-border/50 text-muted-foreground hover:border-orange/30"
            }`}
          >
            <span className="block truncate">{d.name}</span>
            <span
              className={`text-[10px] font-normal ${selectedDrug === d.name ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}
            >
              {d.concentration} {d.unit}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 25"
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Dose ({drug.doseUnit})
          </label>
          <input
            type="number"
            value={doseRate}
            onChange={(e) => setDoseRate(e.target.value)}
            placeholder={String(drug.defaultDose)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Fluid Bag (mL)
          </label>
          <input
            type="number"
            value={fluidBagVol}
            onChange={(e) => setFluidBagVol(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Infusion Rate (mL/hr)
          </label>
          <input
            type="number"
            value={infusionRate}
            onChange={(e) => setInfusionRate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors"
          />
        </div>
      </div>

      {/* Safety warnings */}
      <AnimatePresence>
        {(isOverMaxDose || drug.safetyWarnings.length > 0) && w > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {isOverMaxDose && (
              <motion.div
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-coral/10 border border-coral/30"
              >
                <AlertTriangle className="w-4 h-4 text-coral shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-coral">
                    ⚠️ DOSE EXCEEDS MAXIMUM
                  </p>
                  <p className="text-[10px] text-coral/80 mt-0.5">
                    Max recommended: {drug.maxDose} {drug.doseUnit}. Current:{" "}
                    {dose} {drug.doseUnit}
                  </p>
                </div>
              </motion.div>
            )}
            {drug.safetyWarnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg bg-orange/5 border border-orange/20"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-orange shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange">{w}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {w > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Loading dose */}
            {drug.loadingDose > 0 && (
              <div className="p-4 rounded-xl bg-emerald/5 border border-emerald/20">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Loading Dose
                </p>
                <p className="text-2xl font-extrabold text-emerald mt-1 tabular-nums">
                  {loadingDoseMg.toFixed(2)} mg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {drug.loadingDose} {drug.loadingUnit} × {w} kg — give IV
                  slowly over 10–15 min
                </p>
              </div>
            )}

            {/* Infusion flow diagram */}
            <div className="p-4 rounded-xl bg-muted/10 border border-border/30">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-4">
                Infusion Flow
              </p>
              <div className="flex items-center justify-center gap-0">
                {/* Drug */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl bg-orange/10 border border-orange/30 flex items-center justify-center">
                    <Syringe className="w-6 h-6 text-orange" />
                  </div>
                  <span className="text-[10px] font-bold text-center">
                    {drug.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {drugToAddMl.toFixed(1)} mL
                  </span>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex-1 max-w-[80px] flex items-center mx-2 origin-left"
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-orange to-cyan" />
                  <ArrowRight className="w-3 h-3 text-cyan -ml-1" />
                </motion.div>

                {/* Fluid bag */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-cyan" />
                  </div>
                  <span className="text-[10px] font-bold text-center">
                    Fluid Bag
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {bagVol} mL
                  </span>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="flex-1 max-w-[80px] flex items-center mx-2 origin-left"
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan to-emerald" />
                  <ArrowRight className="w-3 h-3 text-emerald -ml-1" />
                </motion.div>

                {/* Patient */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl gradient-emerald-cyan flex items-center justify-center glow-emerald">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-center">
                    Patient
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {fluidRateMlHr} mL/hr
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Calculation results grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-orange/5 border border-orange/20 text-center">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Required/hr
                </p>
                <p className="text-xl font-extrabold text-orange mt-1 tabular-nums">
                  {mgPerHr.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">mg/hr</p>
              </div>
              <div className="p-4 rounded-xl bg-cyan/5 border border-cyan/20 text-center">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Add to Bag
                </p>
                <p className="text-xl font-extrabold text-cyan mt-1 tabular-nums">
                  {drugToAddMg.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  mg ({drugToAddMl.toFixed(1)} mL)
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald/5 border border-emerald/20 text-center">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Bag Concentration
                </p>
                <p className="text-xl font-extrabold text-emerald mt-1 tabular-nums">
                  {concentrationInBag.toFixed(3)}
                </p>
                <p className="text-[10px] text-muted-foreground">mg/mL</p>
              </div>
            </div>

            {isHighVolume && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-orange/10 border border-orange/20">
                <AlertTriangle className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                <p className="text-xs text-orange">
                  Drug volume exceeds 10% of bag volume. Consider using a more
                  concentrated formulation or syringe driver.
                </p>
              </div>
            )}

            {/* Drug notes */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
              <p className="text-xs text-muted-foreground">{drug.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
