import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Dog, Cat, Beaker, Clock, TrendingUp, AlertTriangle, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

type Species = "dog" | "cat";

const maintenanceRates: Record<Species, number> = { dog: 60, cat: 50 };

export default function FluidTherapyCalc() {
  const [species, setSpecies] = useState<Species>("dog");
  const [weight, setWeight] = useState("");
  const [dehydration, setDehydration] = useState("5");
  const [ongoingLosses, setOngoingLosses] = useState("0");
  const [showPlan, setShowPlan] = useState(false);

  const w = parseFloat(weight) || 0;
  const dh = parseFloat(dehydration) || 0;
  const losses = parseFloat(ongoingLosses) || 0;

  const deficitMl = w * (dh / 100) * 1000;
  const maintenanceMl = w * maintenanceRates[species];
  const totalFluid24h = deficitMl + maintenanceMl + losses;
  const ratePerHour = totalFluid24h / 24;

  // Smart plan
  const phase1Hours = species === "dog" ? 8 : 6;
  const phase1DeficitPercent = 0.5;
  const phase1Deficit = deficitMl * phase1DeficitPercent;
  const phase1Maintenance = maintenanceMl * (phase1Hours / 24);
  const phase1Losses = losses * (phase1Hours / 24);
  const phase1Total = phase1Deficit + phase1Maintenance + phase1Losses;
  const phase1Rate = phase1Total / phase1Hours;

  const phase2Hours = 24 - phase1Hours;
  const phase2Deficit = deficitMl * (1 - phase1DeficitPercent);
  const phase2Maintenance = maintenanceMl * (phase2Hours / 24);
  const phase2Losses = losses * (phase2Hours / 24);
  const phase2Total = phase2Deficit + phase2Maintenance + phase2Losses;
  const phase2Rate = phase2Total / phase2Hours;

  const phase1Progress = (phase1Hours / 24) * 100;

  return (
    <motion.div variants={fadeUp} className="glass-card p-6 space-y-5 border-glow">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Droplets className="w-4 h-4 text-cyan" /> Fluid Therapy Calculator
      </h3>

      {/* Species toggle */}
      <div className="flex gap-2">
        {(["dog", "cat"] as Species[]).map(s => (
          <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setSpecies(s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              species === s ? "gradient-emerald-cyan text-primary-foreground glow-emerald" : "glass-card border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}>
            {s === "dog" ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />}
            {s}
          </motion.button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Body Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 25"
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Dehydration (%)</label>
          <input type="number" value={dehydration} onChange={e => setDehydration(e.target.value)} min="0" max="15"
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors" />
          <div className="flex justify-between mt-1.5">
            {[5, 7, 10, 12].map(v => (
              <button key={v} onClick={() => setDehydration(String(v))}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${dehydration === String(v) ? "bg-cyan/20 text-cyan font-bold" : "text-muted-foreground hover:text-foreground"}`}>
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ongoing Losses (mL)</label>
          <input type="number" value={ongoingLosses} onChange={e => setOngoingLosses(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors" />
          <p className="text-[10px] text-muted-foreground mt-1">Vomiting, diarrhea, drains</p>
        </div>
      </div>

      {/* Dehydration severity indicator */}
      {w > 0 && dh > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Severity</span>
              <span className={`text-[10px] font-bold uppercase ${dh <= 5 ? "text-emerald" : dh <= 8 ? "text-orange" : "text-coral"}`}>
                {dh <= 5 ? "Mild" : dh <= 8 ? "Moderate" : dh <= 12 ? "Severe" : "Critical"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(dh / 15 * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${dh <= 5 ? "bg-emerald" : dh <= 8 ? "bg-orange" : "bg-coral"}`}
              />
            </div>
          </div>
          {dh >= 10 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-coral">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Critical</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {w > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-cyan/5 border border-cyan/20 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Deficit</p>
              <motion.p className="text-xl font-extrabold text-cyan mt-1 tabular-nums"
                key={deficitMl} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{deficitMl.toFixed(0)}</motion.p>
              <p className="text-[10px] text-muted-foreground">mL</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald/5 border border-emerald/20 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Maintenance</p>
              <motion.p className="text-xl font-extrabold text-emerald mt-1 tabular-nums"
                key={maintenanceMl} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{maintenanceMl.toFixed(0)}</motion.p>
              <p className="text-[10px] text-muted-foreground">mL/day</p>
            </div>
            <div className="p-4 rounded-xl bg-orange/5 border border-orange/20 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Total/24h</p>
              <motion.p className="text-xl font-extrabold text-orange mt-1 tabular-nums"
                key={totalFluid24h} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{totalFluid24h.toFixed(0)}</motion.p>
              <p className="text-[10px] text-muted-foreground">mL</p>
            </div>
            <div className="p-4 rounded-xl gradient-emerald-cyan text-center glow-emerald">
              <p className="text-[10px] font-bold uppercase text-primary-foreground/70">Rate</p>
              <motion.p className="text-xl font-extrabold text-primary-foreground mt-1 tabular-nums"
                key={ratePerHour} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{ratePerHour.toFixed(1)}</motion.p>
              <p className="text-[10px] text-primary-foreground/70">mL/hr</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Plan toggle */}
      {w > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowPlan(!showPlan)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-emerald/30 transition-all">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-emerald" />
              <span className="text-sm font-bold">Smart Correction Plan</span>
            </div>
            <motion.div animate={{ rotate: showPlan ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showPlan && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden">
                <div className="pt-4 space-y-4">
                  {/* Timeline visualization */}
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">24-Hour Correction Timeline</span>
                    </div>
                    <div className="relative h-10 rounded-xl overflow-hidden bg-muted/20 border border-border/30">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${phase1Progress}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan/30 to-emerald/30 border-r-2 border-emerald/50 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-emerald">Phase 1</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute inset-y-0 flex items-center justify-center" style={{ left: `${phase1Progress}%`, right: 0 }}>
                        <span className="text-[10px] font-bold text-cyan">Phase 2</span>
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">0h</span>
                      <span className="text-[10px] text-emerald font-mono font-bold" style={{ marginLeft: `${phase1Progress - 8}%` }}>{phase1Hours}h</span>
                      <span className="text-[10px] text-muted-foreground font-mono">24h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phase 1 */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                      className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full gradient-emerald-cyan flex items-center justify-center">
                            <span className="text-[10px] font-extrabold text-primary-foreground">1</span>
                          </div>
                          <span className="text-xs font-bold uppercase">Rapid Correction</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">0–{phase1Hours}h</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deficit (50%)</span><span className="font-bold tabular-nums">{phase1Deficit.toFixed(0)} mL</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Maintenance</span><span className="font-bold tabular-nums">{phase1Maintenance.toFixed(0)} mL</span></div>
                        {phase1Losses > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Losses</span><span className="font-bold tabular-nums">{phase1Losses.toFixed(0)} mL</span></div>}
                        <div className="pt-2 border-t border-emerald/20 flex justify-between text-xs">
                          <span className="font-bold text-emerald">Total</span><span className="font-extrabold text-emerald tabular-nums">{phase1Total.toFixed(0)} mL</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg gradient-emerald-cyan text-center glow-emerald">
                        <p className="text-[10px] font-bold uppercase text-primary-foreground/70">Infusion Rate</p>
                        <p className="text-lg font-extrabold text-primary-foreground tabular-nums">{phase1Rate.toFixed(1)} mL/hr</p>
                      </div>
                    </motion.div>

                    {/* Phase 2 */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                      className="p-4 rounded-xl border border-cyan/20 bg-cyan/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan flex items-center justify-center">
                            <span className="text-[10px] font-extrabold text-primary-foreground">2</span>
                          </div>
                          <span className="text-xs font-bold uppercase">Gradual Replacement</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{phase1Hours}–24h</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Remaining Deficit</span><span className="font-bold tabular-nums">{phase2Deficit.toFixed(0)} mL</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Maintenance</span><span className="font-bold tabular-nums">{phase2Maintenance.toFixed(0)} mL</span></div>
                        {phase2Losses > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Losses</span><span className="font-bold tabular-nums">{phase2Losses.toFixed(0)} mL</span></div>}
                        <div className="pt-2 border-t border-cyan/20 flex justify-between text-xs">
                          <span className="font-bold text-cyan">Total</span><span className="font-extrabold text-cyan tabular-nums">{phase2Total.toFixed(0)} mL</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-cyan text-center">
                        <p className="text-[10px] font-bold uppercase text-primary-foreground/70">Infusion Rate</p>
                        <p className="text-lg font-extrabold text-primary-foreground tabular-nums">{phase2Rate.toFixed(1)} mL/hr</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Clinical notes */}
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Clinical Notes</p>
                    <ul className="space-y-1">
                      <li className="text-xs text-muted-foreground">• Reassess hydration status every 4–6 hours</li>
                      <li className="text-xs text-muted-foreground">• Monitor urine output (target: 1–2 mL/kg/hr)</li>
                      <li className="text-xs text-muted-foreground">• Adjust rate based on clinical response and ongoing losses</li>
                      {species === "cat" && <li className="text-xs text-orange">• ⚠️ Cats are sensitive to fluid overload — monitor closely for respiratory changes</li>}
                      {dh >= 10 && <li className="text-xs text-coral">• ⚠️ Severe dehydration — consider IV bolus of 10–20 mL/kg over 15–20 min initially</li>}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
